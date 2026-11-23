const express = require('express');
const db = require('../db');
const { autenticar, exigirPerfil } = require('../auth');

const router = express.Router();
const MODALIDADES = ['PRESENCIAL', 'REMOTA', 'HIBRIDA'];

const SELECT_BASE = `
  SELECT o.*, c.nome AS causa, u.nome AS organizacao,
         (SELECT COUNT(*)::int FROM candidatura ca
           WHERE ca.oportunidade_id = o.id AND ca.status = 'APROVADA') AS aprovados
    FROM oportunidade o
    JOIN causa c ON c.id = o.causa_id
    JOIN usuario u ON u.id = o.organizacao_id`;

// Listagem pública com filtros (somente oportunidades publicadas)
router.get('/', async (req, res) => {
  const { causa, modalidade, cidade, q } = req.query;
  const where = ["o.status = 'PUBLICADA'"];
  const params = [];
  if (causa) { params.push(causa); where.push(`o.causa_id = $${params.length}`); }
  if (modalidade && MODALIDADES.includes(modalidade)) {
    params.push(modalidade); where.push(`o.modalidade = $${params.length}`);
  }
  if (cidade) { params.push(`%${cidade}%`); where.push(`o.cidade ILIKE $${params.length}`); }
  if (q) {
    params.push(`%${q}%`);
    where.push(`(o.titulo ILIKE $${params.length} OR o.descricao ILIKE $${params.length} OR u.nome ILIKE $${params.length})`);
  }
  const { rows } = await db.query(
    `${SELECT_BASE} WHERE ${where.join(' AND ')} ORDER BY o.criado_em DESC`,
    params
  );
  res.json(rows);
});

// Oportunidades da organização logada (todas as situações)
router.get('/minhas', autenticar, exigirPerfil('ORGANIZACAO'), async (req, res) => {
  const { rows } = await db.query(
    `SELECT o.*, c.nome AS causa,
       (SELECT COUNT(*)::int FROM candidatura ca WHERE ca.oportunidade_id = o.id AND ca.status <> 'CANCELADA') AS total_candidaturas,
       (SELECT COUNT(*)::int FROM candidatura ca WHERE ca.oportunidade_id = o.id AND ca.status IN ('PENDENTE','EM_ANALISE')) AS aguardando,
       (SELECT COUNT(*)::int FROM candidatura ca WHERE ca.oportunidade_id = o.id AND ca.status = 'APROVADA') AS aprovados
       FROM oportunidade o JOIN causa c ON c.id = o.causa_id
      WHERE o.organizacao_id = $1
      ORDER BY CASE o.status WHEN 'PUBLICADA' THEN 0 WHEN 'RASCUNHO' THEN 1 ELSE 2 END, o.criado_em DESC`,
    [req.usuario.id]
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await db.query(
    `${SELECT_BASE.replace('u.nome AS organizacao', 'u.nome AS organizacao, org.descricao AS organizacao_descricao, org.site AS organizacao_site')}
     JOIN organizacao org ON org.usuario_id = o.organizacao_id
     WHERE o.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ erro: 'Oportunidade não encontrada.' });
  res.json(rows[0]);
});

function validarOportunidade(b) {
  if (!b.titulo || !b.descricao || !b.causa_id || !b.modalidade) {
    return 'Preencha título, descrição, causa e modalidade.';
  }
  if (!MODALIDADES.includes(b.modalidade)) return 'Modalidade inválida.';
  if (b.modalidade !== 'REMOTA' && !b.cidade) return 'Informe a cidade para atividades presenciais ou híbridas.';
  if (b.vagas && Number(b.vagas) < 1) return 'O número de vagas deve ser maior que zero.';
  if (b.data_inicio && b.data_fim && b.data_fim < b.data_inicio) return 'A data de término deve ser posterior ao início.';
  return null;
}

const CAMPOS = ['causa_id', 'titulo', 'descricao', 'requisitos', 'modalidade', 'cidade', 'uf',
  'data_inicio', 'data_fim', 'carga_horaria', 'vagas', 'status'];

router.post('/', autenticar, exigirPerfil('ORGANIZACAO'), async (req, res) => {
  const b = req.body || {};
  const erro = validarOportunidade(b);
  if (erro) return res.status(400).json({ erro });
  const valores = CAMPOS.map((c) => (b[c] === '' || b[c] === undefined ? null : b[c]));
  valores[CAMPOS.indexOf('vagas')] = Number(b.vagas) || 1;
  valores[CAMPOS.indexOf('status')] = b.status === 'PUBLICADA' ? 'PUBLICADA' : 'RASCUNHO';
  const { rows } = await db.query(
    `INSERT INTO oportunidade (organizacao_id, ${CAMPOS.join(', ')})
     VALUES ($1, ${CAMPOS.map((_, i) => `$${i + 2}`).join(', ')}) RETURNING *`,
    [req.usuario.id, ...valores]
  );
  res.status(201).json(rows[0]);
});

async function garantirDono(req, res) {
  const { rows } = await db.query('SELECT organizacao_id FROM oportunidade WHERE id = $1', [req.params.id]);
  if (!rows[0]) { res.status(404).json({ erro: 'Oportunidade não encontrada.' }); return false; }
  if (rows[0].organizacao_id !== req.usuario.id) {
    res.status(403).json({ erro: 'Esta oportunidade pertence a outra organização.' }); return false;
  }
  return true;
}

router.put('/:id', autenticar, exigirPerfil('ORGANIZACAO'), async (req, res) => {
  if (!(await garantirDono(req, res))) return;
  const b = req.body || {};
  const erro = validarOportunidade(b);
  if (erro) return res.status(400).json({ erro });
  const editaveis = CAMPOS.filter((c) => c !== 'status');
  const valores = editaveis.map((c) => (b[c] === '' || b[c] === undefined ? null : b[c]));
  valores[editaveis.indexOf('vagas')] = Number(b.vagas) || 1;
  const { rows } = await db.query(
    `UPDATE oportunidade SET ${editaveis.map((c, i) => `${c} = $${i + 1}`).join(', ')}, atualizado_em = NOW()
     WHERE id = $${editaveis.length + 1} RETURNING *`,
    [...valores, req.params.id]
  );
  res.json(rows[0]);
});

// Publicar / encerrar / voltar para rascunho
router.patch('/:id/status', autenticar, exigirPerfil('ORGANIZACAO'), async (req, res) => {
  if (!(await garantirDono(req, res))) return;
  const { status } = req.body || {};
  if (!['RASCUNHO', 'PUBLICADA', 'ENCERRADA'].includes(status)) {
    return res.status(400).json({ erro: 'Situação inválida.' });
  }
  const { rows } = await db.query(
    'UPDATE oportunidade SET status = $1, atualizado_em = NOW() WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  res.json(rows[0]);
});

module.exports = router;

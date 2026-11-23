const express = require('express');
const db = require('../db');
const { autenticar, exigirPerfil } = require('../auth');

const router = express.Router();
router.use(autenticar);

async function registrarHistorico(client, candidaturaId, anterior, novo, usuarioId, obs) {
  await client.query(
    `INSERT INTO historico_status (candidatura_id, status_anterior, status_novo, alterado_por, observacao)
     VALUES ($1,$2,$3,$4,$5)`,
    [candidaturaId, anterior, novo, usuarioId, obs || null]
  );
}

// Voluntário se candidata a uma oportunidade
router.post('/oportunidade/:id', exigirPerfil('VOLUNTARIO'), async (req, res) => {
  const op = await db.query('SELECT status FROM oportunidade WHERE id = $1', [req.params.id]);
  if (!op.rows[0]) return res.status(404).json({ erro: 'Oportunidade não encontrada.' });
  if (op.rows[0].status !== 'PUBLICADA') {
    return res.status(400).json({ erro: 'Esta oportunidade não está recebendo candidaturas.' });
  }
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const existente = await client.query(
      'SELECT id, status FROM candidatura WHERE oportunidade_id = $1 AND voluntario_id = $2',
      [req.params.id, req.usuario.id]
    );
    let cand;
    if (existente.rows[0]) {
      if (existente.rows[0].status !== 'CANCELADA') {
        await client.query('ROLLBACK');
        return res.status(409).json({ erro: 'Você já se candidatou a esta oportunidade.' });
      }
      // Reabre uma candidatura cancelada anteriormente
      const r = await client.query(
        `UPDATE candidatura SET status='PENDENTE', mensagem=$1, atualizado_em=NOW() WHERE id=$2 RETURNING *`,
        [req.body?.mensagem || null, existente.rows[0].id]
      );
      cand = r.rows[0];
      await registrarHistorico(client, cand.id, 'CANCELADA', 'PENDENTE', req.usuario.id, 'Candidatura reenviada');
    } else {
      const r = await client.query(
        `INSERT INTO candidatura (oportunidade_id, voluntario_id, mensagem) VALUES ($1,$2,$3) RETURNING *`,
        [req.params.id, req.usuario.id, req.body?.mensagem || null]
      );
      cand = r.rows[0];
      await registrarHistorico(client, cand.id, null, 'PENDENTE', req.usuario.id, 'Candidatura enviada');
    }
    await client.query('COMMIT');
    res.status(201).json(cand);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ erro: 'Não foi possível enviar a candidatura.' });
  } finally {
    client.release();
  }
});

// Candidaturas do voluntário logado
router.get('/minhas', exigirPerfil('VOLUNTARIO'), async (req, res) => {
  const { rows } = await db.query(
    `SELECT ca.*, o.titulo, o.modalidade, o.cidade, o.uf, o.data_inicio, u.nome AS organizacao,
            (SELECT observacao FROM historico_status h WHERE h.candidatura_id = ca.id
              ORDER BY h.alterado_em DESC LIMIT 1) AS ultima_observacao
       FROM candidatura ca
       JOIN oportunidade o ON o.id = ca.oportunidade_id
       JOIN usuario u ON u.id = o.organizacao_id
      WHERE ca.voluntario_id = $1
      ORDER BY ca.atualizado_em DESC`,
    [req.usuario.id]
  );
  res.json(rows);
});

// Candidatos de uma oportunidade (visão da ONG)
router.get('/oportunidade/:id', exigirPerfil('ORGANIZACAO'), async (req, res) => {
  const op = await db.query('SELECT organizacao_id FROM oportunidade WHERE id = $1', [req.params.id]);
  if (!op.rows[0]) return res.status(404).json({ erro: 'Oportunidade não encontrada.' });
  if (op.rows[0].organizacao_id !== req.usuario.id) return res.status(403).json({ erro: 'Acesso negado.' });
  const { rows } = await db.query(
    `SELECT ca.id, ca.status, ca.mensagem, ca.criado_em, ca.atualizado_em,
            u.nome, u.email, u.telefone, u.cidade, u.uf,
            v.habilidades, v.disponibilidade, v.bio
       FROM candidatura ca
       JOIN usuario u ON u.id = ca.voluntario_id
       JOIN voluntario v ON v.usuario_id = ca.voluntario_id
      WHERE ca.oportunidade_id = $1 AND ca.status <> 'CANCELADA'
      ORDER BY ca.criado_em`,
    [req.params.id]
  );
  res.json(rows);
});

// ONG atualiza a situação de um candidato
router.patch('/:id/status', exigirPerfil('ORGANIZACAO'), async (req, res) => {
  const { status, observacao } = req.body || {};
  if (!['EM_ANALISE', 'APROVADA', 'RECUSADA'].includes(status)) {
    return res.status(400).json({ erro: 'Situação inválida.' });
  }
  const atual = await db.query(
    `SELECT ca.status, o.organizacao_id FROM candidatura ca
       JOIN oportunidade o ON o.id = ca.oportunidade_id WHERE ca.id = $1`,
    [req.params.id]
  );
  const c = atual.rows[0];
  if (!c) return res.status(404).json({ erro: 'Candidatura não encontrada.' });
  if (c.organizacao_id !== req.usuario.id) return res.status(403).json({ erro: 'Acesso negado.' });
  if (c.status === 'CANCELADA') return res.status(400).json({ erro: 'Candidatura cancelada pelo voluntário.' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      'UPDATE candidatura SET status=$1, atualizado_em=NOW() WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    await registrarHistorico(client, req.params.id, c.status, status, req.usuario.id, observacao);
    await client.query('COMMIT');
    res.json(r.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ erro: 'Não foi possível atualizar a candidatura.' });
  } finally {
    client.release();
  }
});

// Voluntário cancela a própria candidatura
router.patch('/:id/cancelar', exigirPerfil('VOLUNTARIO'), async (req, res) => {
  const atual = await db.query('SELECT status, voluntario_id FROM candidatura WHERE id=$1', [req.params.id]);
  const c = atual.rows[0];
  if (!c || c.voluntario_id !== req.usuario.id) return res.status(404).json({ erro: 'Candidatura não encontrada.' });
  if (['CANCELADA', 'RECUSADA'].includes(c.status)) return res.status(400).json({ erro: 'Não é possível cancelar.' });
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE candidatura SET status='CANCELADA', atualizado_em=NOW() WHERE id=$1`, [req.params.id]);
    await registrarHistorico(client, req.params.id, c.status, 'CANCELADA', req.usuario.id, 'Cancelada pelo voluntário');
    await client.query('COMMIT');
    res.json({ ok: true });
  } finally {
    client.release();
  }
});

// Linha do tempo da candidatura
router.get('/:id/historico', async (req, res) => {
  const { rows: dono } = await db.query(
    `SELECT ca.voluntario_id, o.organizacao_id FROM candidatura ca
       JOIN oportunidade o ON o.id = ca.oportunidade_id WHERE ca.id=$1`,
    [req.params.id]
  );
  if (!dono[0] || ![dono[0].voluntario_id, dono[0].organizacao_id].includes(req.usuario.id)) {
    return res.status(404).json({ erro: 'Candidatura não encontrada.' });
  }
  const { rows } = await db.query(
    `SELECT h.status_anterior, h.status_novo, h.observacao, h.alterado_em, u.nome AS alterado_por
       FROM historico_status h LEFT JOIN usuario u ON u.id = h.alterado_por
      WHERE h.candidatura_id = $1 ORDER BY h.alterado_em`,
    [req.params.id]
  );
  res.json(rows);
});

module.exports = router;

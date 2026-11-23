const express = require('express');
const db = require('../db');
const { autenticar } = require('../auth');

const router = express.Router();
router.use(autenticar);

router.get('/', async (req, res) => {
  const { id, tipo } = req.usuario;
  const base = await db.query(
    'SELECT id, nome, email, tipo, telefone, cidade, uf FROM usuario WHERE id = $1',
    [id]
  );
  const perfil = base.rows[0];
  if (tipo === 'VOLUNTARIO') {
    const v = await db.query('SELECT bio, habilidades, disponibilidade FROM voluntario WHERE usuario_id = $1', [id]);
    const c = await db.query('SELECT causa_id FROM voluntario_causa WHERE voluntario_id = $1', [id]);
    Object.assign(perfil, v.rows[0], { causas: c.rows.map((r) => r.causa_id) });
  } else {
    const o = await db.query('SELECT cnpj, descricao, site FROM organizacao WHERE usuario_id = $1', [id]);
    Object.assign(perfil, o.rows[0]);
  }
  res.json(perfil);
});

router.put('/', async (req, res) => {
  const { id, tipo } = req.usuario;
  const b = req.body || {};
  if (!b.nome || !b.nome.trim()) return res.status(400).json({ erro: 'O nome é obrigatório.' });
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE usuario SET nome=$1, telefone=$2, cidade=$3, uf=$4 WHERE id=$5', [
      b.nome.trim(), b.telefone || null, b.cidade || null, b.uf || null, id,
    ]);
    if (tipo === 'VOLUNTARIO') {
      await client.query(
        'UPDATE voluntario SET bio=$1, habilidades=$2, disponibilidade=$3 WHERE usuario_id=$4',
        [b.bio || null, b.habilidades || null, b.disponibilidade || null, id]
      );
      await client.query('DELETE FROM voluntario_causa WHERE voluntario_id=$1', [id]);
      for (const causaId of b.causas || []) {
        await client.query('INSERT INTO voluntario_causa VALUES ($1,$2)', [id, causaId]);
      }
    } else {
      await client.query('UPDATE organizacao SET cnpj=$1, descricao=$2, site=$3 WHERE usuario_id=$4', [
        b.cnpj || null, b.descricao || null, b.site || null, id,
      ]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ erro: 'Não foi possível salvar o perfil.' });
  } finally {
    client.release();
  }
});

module.exports = router;

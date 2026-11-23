const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { gerarToken, autenticar } = require('../auth');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cadastro de voluntário ou organização
router.post('/register', async (req, res) => {
  const { nome, email, senha, tipo, cidade, uf, telefone, cnpj, descricao } = req.body || {};
  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ erro: 'Preencha nome, e-mail, senha e tipo de perfil.' });
  }
  if (!EMAIL_RE.test(email)) return res.status(400).json({ erro: 'E-mail inválido.' });
  if (senha.length < 8) return res.status(400).json({ erro: 'A senha deve ter pelo menos 8 caracteres.' });
  if (!['VOLUNTARIO', 'ORGANIZACAO'].includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo de perfil inválido.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const existe = await client.query('SELECT 1 FROM usuario WHERE email = $1', [email.toLowerCase()]);
    if (existe.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' });
    }
    const hash = await bcrypt.hash(senha, 10);
    const { rows } = await client.query(
      `INSERT INTO usuario (nome, email, senha_hash, tipo, cidade, uf, telefone)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, nome, email, tipo, cidade, uf`,
      [nome.trim(), email.toLowerCase(), hash, tipo, cidade || null, uf || null, telefone || null]
    );
    const usuario = rows[0];
    if (tipo === 'VOLUNTARIO') {
      await client.query('INSERT INTO voluntario (usuario_id) VALUES ($1)', [usuario.id]);
    } else {
      await client.query('INSERT INTO organizacao (usuario_id, cnpj, descricao) VALUES ($1,$2,$3)', [
        usuario.id,
        cnpj || null,
        descricao || null,
      ]);
    }
    await client.query('COMMIT');
    res.status(201).json({ token: gerarToken(usuario), usuario });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ erro: 'Não foi possível concluir o cadastro.' });
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  const { rows } = await db.query(
    'SELECT id, nome, email, tipo, cidade, uf, senha_hash FROM usuario WHERE email = $1',
    [email.toLowerCase()]
  );
  const u = rows[0];
  if (!u || !(await bcrypt.compare(senha, u.senha_hash))) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }
  delete u.senha_hash;
  res.json({ token: gerarToken(u), usuario: u });
});

router.get('/me', autenticar, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, nome, email, tipo, cidade, uf, telefone FROM usuario WHERE id = $1',
    [req.usuario.id]
  );
  res.json(rows[0]);
});

module.exports = router;

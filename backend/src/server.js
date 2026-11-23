require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/causas', async (req, res) => {
  const { rows } = await db.query('SELECT id, nome FROM causa ORDER BY nome');
  res.json(rows);
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/perfil', require('./routes/perfil'));
app.use('/api/oportunidades', require('./routes/oportunidades'));
app.use('/api/candidaturas', require('./routes/candidaturas'));

// Em produção, a API também entrega o front-end compilado (frontend/dist)
const dist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ erro: 'Recurso não encontrado.' }));
// Tratamento central de erros (Express 5 encaminha erros de funções async)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ConectaImpacto API em http://localhost:${PORT}`));

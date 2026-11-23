const jwt = require('jsonwebtoken');

const SECRET = () => process.env.JWT_SECRET || 'conectaimpacto-dev';

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id, tipo: usuario.tipo, nome: usuario.nome }, SECRET(), {
    expiresIn: '8h',
  });
}

// Exige token válido no cabeçalho Authorization: Bearer <token>
function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Faça login para continuar.' });
  try {
    req.usuario = jwt.verify(token, SECRET());
    next();
  } catch {
    return res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
  }
}

// Controle de acesso por perfil
function exigirPerfil(tipo) {
  return (req, res, next) => {
    if (req.usuario?.tipo !== tipo) {
      return res.status(403).json({ erro: 'Ação não permitida para este perfil.' });
    }
    next();
  };
}

module.exports = { gerarToken, autenticar, exigirPerfil };

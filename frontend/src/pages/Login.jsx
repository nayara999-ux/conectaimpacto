import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const u = await login(email, senha);
      navigate(u.tipo === 'ORGANIZACAO' ? '/painel' : '/oportunidades');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="caixa-auth card">
      <h1>Entrar</h1>
      <p className="sutil">Acesse para se candidatar ou gerenciar as vagas da sua ONG.</p>
      <form onSubmit={enviar} className="form">
        <label>E-mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label>Senha<input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" /></label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="btn btn-primario btn-bloco" disabled={carregando}>{carregando ? 'Entrando...' : 'Entrar'}</button>
      </form>
      <p className="sutil centro">Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link></p>
    </div>
  );
}

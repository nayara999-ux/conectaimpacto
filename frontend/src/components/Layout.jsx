import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="ConectaImpacto — início">
      <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden="true">
        <circle cx="11" cy="11" r="10" fill="#0f766e" />
        <circle cx="19" cy="11" r="10" fill="#f97362" fillOpacity=".85" />
      </svg>
      <span>Conecta<b>Impacto</b></span>
    </Link>
  );
}

export function Badge({ cor = 'cinza', children }) {
  return <span className={`badge badge-${cor}`}>{children}</span>;
}

export default function Layout({ children }) {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const primeiroNome = usuario?.nome?.split(' ')[0];

  return (
    <>
      <header className="topo">
        <div className="container topo-conteudo">
          <Logo />
          <nav className="menu">
            <NavLink to="/oportunidades">Oportunidades</NavLink>
            {usuario?.tipo === 'VOLUNTARIO' && <NavLink to="/minhas-candidaturas">Minhas candidaturas</NavLink>}
            {usuario?.tipo === 'ORGANIZACAO' && <NavLink to="/painel">Painel da ONG</NavLink>}
            {usuario ? (
              <>
                <NavLink to="/perfil" className="menu-perfil">Olá, {primeiroNome}</NavLink>
                <button className="btn btn-link" onClick={() => { sair(); navigate('/'); }}>Sair</button>
              </>
            ) : (
              <>
                <NavLink to="/entrar">Entrar</NavLink>
                <Link to="/cadastro" className="btn btn-primario btn-pequeno">Criar conta</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container conteudo">{children}</main>
      <footer className="rodape">
        <div className="container">
          ConectaImpacto · Projeto Integrador — Senac EAD · {new Date().getFullYear()} ·{' '}
          Tratamos seus dados conforme a LGPD.
        </div>
      </footer>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import CardOportunidade from '../components/CardOportunidade';
import { useAuth } from '../AuthContext';

export default function Inicio() {
  const [ops, setOps] = useState([]);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();
  const { usuario } = useAuth();

  useEffect(() => { api('/oportunidades').then((r) => setOps(r.slice(0, 3))).catch(() => {}); }, []);

  return (
    <>
      <section className="hero">
        <div>
          <h1>Encontre onde o seu tempo <span>faz diferença</span>.</h1>
          <p>
            O ConectaImpacto reúne oportunidades de voluntariado de ONGs locais em um só lugar.
            Busque por causa, modalidade e cidade, candidate-se em poucos cliques e acompanhe cada etapa.
          </p>
          <form className="busca-hero" onSubmit={(e) => { e.preventDefault(); navigate(`/oportunidades?q=${encodeURIComponent(busca)}`); }}>
            <input placeholder="Ex.: reforço escolar, plantio, adoção..." value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar oportunidades" />
            <button className="btn btn-primario">Buscar</button>
          </form>
        </div>
        <div className="hero-cards">
          <div className="hero-card"><b>Para voluntários</b><p>Descubra ações compatíveis com sua rotina e saiba sempre em que pé está sua inscrição.</p></div>
          <div className="hero-card coral"><b>Para ONGs</b><p>Publique vagas, receba candidaturas organizadas e atualize o status sem planilhas.</p>
            {!usuario && <Link to="/cadastro?tipo=ORGANIZACAO" className="link-forte">Cadastrar minha ONG →</Link>}
          </div>
        </div>
      </section>

      <section>
        <div className="secao-titulo">
          <h2>Oportunidades recentes</h2>
          <Link to="/oportunidades">Ver todas →</Link>
        </div>
        <div className="grade">{ops.map((op) => <CardOportunidade key={op.id} op={op} />)}</div>
      </section>

      <section className="passos">
        <h2>Como funciona</h2>
        <ol>
          <li><b>1. Crie seu perfil</b><span>Voluntário ou organização, em menos de 2 minutos.</span></li>
          <li><b>2. Encontre ou publique</b><span>Filtros por causa, modalidade e cidade.</span></li>
          <li><b>3. Candidate-se</b><span>Uma mensagem curta basta para se apresentar.</span></li>
          <li><b>4. Acompanhe</b><span>Status atualizado pela ONG, com histórico.</span></li>
        </ol>
      </section>
    </>
  );
}

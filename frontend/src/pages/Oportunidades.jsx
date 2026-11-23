import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, MODALIDADES } from '../api';
import CardOportunidade from '../components/CardOportunidade';

export default function Oportunidades() {
  const [params, setParams] = useSearchParams();
  const [causas, setCausas] = useState([]);
  const [ops, setOps] = useState(null);
  const filtros = {
    q: params.get('q') || '',
    causa: params.get('causa') || '',
    modalidade: params.get('modalidade') || '',
    cidade: params.get('cidade') || '',
  };
  const [texto, setTexto] = useState(filtros.q);
  const [cidade, setCidade] = useState(filtros.cidade);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => { api('/causas').then(setCausas); }, []);
  useEffect(() => {
    const qs = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v)).toString();
    setOps(null);
    api(`/oportunidades${qs ? '?' + qs : ''}`).then(setOps).catch(() => setOps([]));
  }, [params.toString()]);

  function aplicar(novos) {
    const p = { ...filtros, ...novos };
    setParams(Object.fromEntries(Object.entries(p).filter(([, v]) => v)));
  }
  const algumFiltro = Object.values(filtros).some(Boolean);

  return (
    <div className="layout-busca">
      <aside className={`filtros card ${mostrarFiltros ? 'aberto' : ''}`}>
        <button className="btn btn-secundario btn-bloco so-mobile" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
          {mostrarFiltros ? 'Ocultar filtros' : 'Filtrar oportunidades'}{algumFiltro ? ' •' : ''}
        </button>
        <div className="filtros-corpo">
        <h2>Filtrar</h2>
        <form onSubmit={(e) => { e.preventDefault(); aplicar({ q: texto, cidade }); }} className="form">
          <label>Palavra-chave<input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Título, ONG..." /></label>
          <label>Cidade<input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex.: São Paulo" /></label>
          <button className="btn btn-secundario btn-bloco">Aplicar</button>
        </form>
        <h3>Causa</h3>
        <div className="chips">
          {causas.map((c) => (
            <button key={c.id} className={`chip ${filtros.causa === String(c.id) ? 'ativo' : ''}`}
              onClick={() => aplicar({ causa: filtros.causa === String(c.id) ? '' : String(c.id) })}>{c.nome}</button>
          ))}
        </div>
        <h3>Modalidade</h3>
        <div className="chips">
          {Object.entries(MODALIDADES).map(([k, v]) => (
            <button key={k} className={`chip ${filtros.modalidade === k ? 'ativo' : ''}`}
              onClick={() => aplicar({ modalidade: filtros.modalidade === k ? '' : k })}>{v}</button>
          ))}
        </div>
        {algumFiltro && (
          <button className="btn btn-link" onClick={() => { setTexto(''); setCidade(''); setParams({}); }}>Limpar filtros</button>
        )}
        </div>
      </aside>
      <section>
        <h1>Oportunidades de voluntariado</h1>
        <p className="sutil">{ops ? `${ops.length} ${ops.length === 1 ? 'oportunidade encontrada' : 'oportunidades encontradas'}` : 'Carregando...'}</p>
        {ops && ops.length === 0 && (
          <div className="vazio card">Nenhuma oportunidade com esses filtros. Tente outra causa ou a modalidade remota.</div>
        )}
        <div className="grade grade-2">{ops?.map((op) => <CardOportunidade key={op.id} op={op} />)}</div>
      </section>
    </div>
  );
}

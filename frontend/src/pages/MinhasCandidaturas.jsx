import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, STATUS_CANDIDATURA, MODALIDADES, formatarData } from '../api';
import { Badge } from '../components/Layout';

const ETAPAS = ['PENDENTE', 'EM_ANALISE', 'APROVADA'];

function Linha({ status }) {
  const recusada = status === 'RECUSADA';
  const indice = recusada ? 2 : ETAPAS.indexOf(status);
  const rotulos = ['Enviada', 'Em análise', recusada ? 'Não selecionada' : 'Aprovada'];
  return (
    <ol className="progresso">
      {rotulos.map((r, i) => (
        <li key={r} className={`${i <= indice ? 'feito' : ''} ${recusada && i === 2 ? 'recusado' : ''}`}>{r}</li>
      ))}
    </ol>
  );
}

export default function MinhasCandidaturas() {
  const [lista, setLista] = useState(null);
  const [historico, setHistorico] = useState({});

  const carregar = () => api('/candidaturas/minhas').then(setLista);
  useEffect(() => { carregar(); }, []);

  async function verHistorico(id) {
    if (historico[id]) return setHistorico({ ...historico, [id]: null });
    const h = await api(`/candidaturas/${id}/historico`);
    setHistorico({ ...historico, [id]: h });
  }

  async function cancelar(id) {
    if (!window.confirm('Cancelar esta candidatura?')) return;
    await api(`/candidaturas/${id}/cancelar`, { method: 'PATCH' });
    carregar();
  }

  if (!lista) return <p>Carregando...</p>;
  return (
    <>
      <h1>Minhas candidaturas</h1>
      <p className="sutil">Acompanhe em que etapa está cada inscrição.</p>
      {lista.length === 0 && (
        <div className="vazio card">Você ainda não se candidatou. <Link to="/oportunidades">Encontre uma oportunidade</Link>.</div>
      )}
      <div className="lista">
        {lista.map((c) => {
          const st = STATUS_CANDIDATURA[c.status];
          return (
            <div key={c.id} className="card item-cand">
              <div className="item-cab">
                <div>
                  <Link to={`/oportunidades/${c.oportunidade_id}`}><h3>{c.titulo}</h3></Link>
                  <p className="org">{c.organizacao} · {MODALIDADES[c.modalidade]}{c.cidade ? ` · ${c.cidade}` : ''}</p>
                </div>
                <Badge cor={st.cor}>{st.rotulo}</Badge>
              </div>
              {c.status !== 'CANCELADA' && <Linha status={c.status} />}
              {c.ultima_observacao && c.status !== 'PENDENTE' && (
                <p className="recado">💬 <b>Recado da ONG:</b> {c.ultima_observacao}</p>
              )}
              <div className="acoes">
                <span className="sutil">Atualizada em {formatarData(c.atualizado_em)}</span>
                <button className="btn btn-link" onClick={() => verHistorico(c.id)}>{historico[c.id] ? 'Ocultar histórico' : 'Ver histórico'}</button>
                {['PENDENTE', 'EM_ANALISE'].includes(c.status) && (
                  <button className="btn btn-link perigo" onClick={() => cancelar(c.id)}>Cancelar candidatura</button>
                )}
              </div>
              {historico[c.id] && (
                <ul className="historico">
                  {historico[c.id].map((h, i) => (
                    <li key={i}><b>{STATUS_CANDIDATURA[h.status_novo].rotulo}</b> — {new Date(h.alterado_em).toLocaleString('pt-BR')}{h.observacao ? ` · ${h.observacao}` : ''}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, STATUS_CANDIDATURA, formatarData } from '../api';
import { Badge } from '../components/Layout';

export default function Candidatos() {
  const { id } = useParams();
  const [op, setOp] = useState(null);
  const [lista, setLista] = useState(null);
  const [obs, setObs] = useState({});
  const [aberto, setAberto] = useState(null);

  const carregar = () => api(`/candidaturas/oportunidade/${id}`).then(setLista);
  useEffect(() => {
    api(`/oportunidades/${id}`).then(setOp);
    carregar();
  }, [id]);

  async function atualizar(candId, status) {
    await api(`/candidaturas/${candId}/status`, { method: 'PATCH', body: { status, observacao: obs[candId] } });
    setObs({ ...obs, [candId]: '' });
    carregar();
  }

  if (!lista || !op) return <p>Carregando...</p>;
  return (
    <>
      <Link to="/painel" className="voltar">← Voltar ao painel</Link>
      <h1>Candidatos</h1>
      <p className="sutil">{op.titulo} · {lista.filter((c) => c.status === 'APROVADA').length} de {op.vagas} vagas preenchidas</p>
      {lista.length === 0 && <div className="vazio card">Ainda não há candidaturas para esta oportunidade.</div>}
      <div className="lista">
        {lista.map((c) => {
          const st = STATUS_CANDIDATURA[c.status];
          return (
            <div key={c.id} className="card item-cand">
              <div className="item-cab">
                <div>
                  <h3>{c.nome}</h3>
                  <p className="org">{c.cidade}/{c.uf} · candidatura em {formatarData(c.criado_em)}</p>
                </div>
                <Badge cor={st.cor}>{st.rotulo}</Badge>
              </div>
              {c.mensagem && <p className="recado">“{c.mensagem}”</p>}
              <button className="btn btn-link" onClick={() => setAberto(aberto === c.id ? null : c.id)}>
                {aberto === c.id ? 'Ocultar perfil' : 'Ver perfil e contato'}
              </button>
              {aberto === c.id && (
                <dl className="ficha ficha-inline">
                  <dt>Habilidades</dt><dd>{c.habilidades || '—'}</dd>
                  <dt>Disponibilidade</dt><dd>{c.disponibilidade || '—'}</dd>
                  <dt>Sobre</dt><dd>{c.bio || '—'}</dd>
                  <dt>Contato</dt><dd>{c.email} · {c.telefone}</dd>
                </dl>
              )}
              {!['APROVADA', 'RECUSADA'].includes(c.status) ? (
                <div className="decisao">
                  <input placeholder="Recado para o voluntário (opcional)" value={obs[c.id] || ''} onChange={(e) => setObs({ ...obs, [c.id]: e.target.value })} />
                  {c.status === 'PENDENTE' && <button className="btn btn-secundario btn-pequeno" onClick={() => atualizar(c.id, 'EM_ANALISE')}>Em análise</button>}
                  <button className="btn btn-primario btn-pequeno" onClick={() => atualizar(c.id, 'APROVADA')}>Aprovar</button>
                  <button className="btn btn-perigo btn-pequeno" onClick={() => atualizar(c.id, 'RECUSADA')}>Recusar</button>
                </div>
              ) : (
                <p className="sutil">Decisão registrada em {formatarData(c.atualizado_em)}.</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

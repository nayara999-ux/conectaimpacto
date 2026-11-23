import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, STATUS_OPORTUNIDADE, MODALIDADES, formatarData } from '../api';
import { useAuth } from '../AuthContext';
import { Badge } from '../components/Layout';

export default function PainelOng() {
  const { usuario } = useAuth();
  const [ops, setOps] = useState(null);
  const carregar = () => api('/oportunidades/minhas').then(setOps);
  useEffect(() => { carregar(); }, []);

  async function mudarStatus(id, status) {
    await api(`/oportunidades/${id}/status`, { method: 'PATCH', body: { status } });
    carregar();
  }

  if (!ops) return <p>Carregando...</p>;
  const publicadas = ops.filter((o) => o.status === 'PUBLICADA').length;
  const aguardando = ops.reduce((s, o) => s + o.aguardando, 0);
  const aprovados = ops.reduce((s, o) => s + o.aprovados, 0);

  return (
    <>
      <div className="secao-titulo">
        <div>
          <h1>Painel — {usuario.nome}</h1>
          <p className="sutil">Gerencie suas oportunidades e candidatos.</p>
        </div>
        <Link to="/painel/nova" className="btn btn-primario">+ Nova oportunidade</Link>
      </div>

      <div className="indicadores">
        <div className="card"><span>{publicadas}</span>oportunidades publicadas</div>
        <div className="card destaque"><span>{aguardando}</span>candidaturas aguardando análise</div>
        <div className="card"><span>{aprovados}</span>voluntários aprovados</div>
      </div>

      <div className="tabela-wrap card">
        <table className="tabela">
          <thead>
            <tr><th>Oportunidade</th><th>Situação</th><th>Candidaturas</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {ops.map((o) => {
              const st = STATUS_OPORTUNIDADE[o.status];
              return (
                <tr key={o.id}>
                  <td>
                    <b>{o.titulo}</b>
                    <div className="sutil">{o.causa} · {MODALIDADES[o.modalidade]} · início {formatarData(o.data_inicio)}</div>
                  </td>
                  <td><Badge cor={st.cor}>{st.rotulo}</Badge></td>
                  <td>
                    {o.total_candidaturas}
                    {o.aguardando > 0 && <span className="pilula">{o.aguardando} nova(s)</span>}
                  </td>
                  <td className="acoes-tabela">
                    <Link to={`/painel/${o.id}/candidatos`} className="btn btn-secundario btn-pequeno">Candidatos</Link>
                    <Link to={`/painel/${o.id}/editar`} className="btn btn-link">Editar</Link>
                    {o.status === 'RASCUNHO' && <button className="btn btn-link" onClick={() => mudarStatus(o.id, 'PUBLICADA')}>Publicar</button>}
                    {o.status === 'PUBLICADA' && <button className="btn btn-link perigo" onClick={() => mudarStatus(o.id, 'ENCERRADA')}>Encerrar</button>}
                    {o.status === 'ENCERRADA' && <button className="btn btn-link" onClick={() => mudarStatus(o.id, 'PUBLICADA')}>Reabrir</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

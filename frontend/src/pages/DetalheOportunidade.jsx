import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, MODALIDADES, formatarData } from '../api';
import { useAuth } from '../AuthContext';
import { Badge } from '../components/Layout';

export default function DetalheOportunidade() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [op, setOp] = useState(null);
  const [erro, setErro] = useState('');
  const [abrirForm, setAbrirForm] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [enviada, setEnviada] = useState(false);
  const [jaCandidatado, setJaCandidatado] = useState(false);

  useEffect(() => {
    api(`/oportunidades/${id}`).then(setOp).catch((e) => setErro(e.message));
    if (usuario?.tipo === 'VOLUNTARIO') {
      api('/candidaturas/minhas').then((cs) =>
        setJaCandidatado(cs.some((c) => String(c.oportunidade_id) === id && c.status !== 'CANCELADA')));
    }
  }, [id]);

  async function candidatar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api(`/candidaturas/oportunidade/${id}`, { method: 'POST', body: { mensagem } });
      setEnviada(true);
    } catch (err) {
      setErro(err.message);
    }
  }

  if (!op) return <p>{erro || 'Carregando...'}</p>;
  const restantes = Math.max(op.vagas - op.aprovados, 0);

  return (
    <div className="detalhe">
      <Link to="/oportunidades" className="voltar">← Voltar para a busca</Link>
      <div className="detalhe-grade">
        <article className="card">
          <div className="card-op-topo">
            <Badge cor="azul">{op.causa}</Badge>
            <Badge cor={op.modalidade === 'REMOTA' ? 'roxo' : 'cinza'}>{MODALIDADES[op.modalidade]}</Badge>
            {op.status !== 'PUBLICADA' && <Badge cor="vermelho">Inscrições encerradas</Badge>}
          </div>
          <h1>{op.titulo}</h1>
          <p className="org">{op.organizacao}</p>
          <h2>Sobre a atividade</h2>
          <p>{op.descricao}</p>
          {op.requisitos && (<><h2>Requisitos</h2><p>{op.requisitos}</p></>)}
          <h2>Sobre a organização</h2>
          <p>{op.organizacao_descricao}</p>
          {op.organizacao_site && <a href={op.organizacao_site} target="_blank" rel="noreferrer">{op.organizacao_site}</a>}
        </article>

        <aside className="card lateral">
          <dl className="ficha">
            <dt>Local</dt><dd>{op.modalidade === 'REMOTA' ? 'Remoto' : `${op.cidade} / ${op.uf}`}</dd>
            <dt>Período</dt><dd>{formatarData(op.data_inicio)}{op.data_fim && op.data_fim !== op.data_inicio ? ` a ${formatarData(op.data_fim)}` : ''}</dd>
            <dt>Dedicação</dt><dd>{op.carga_horaria || 'A combinar'}</dd>
            <dt>Vagas</dt><dd>{restantes} de {op.vagas} disponíveis</dd>
          </dl>

          {enviada || jaCandidatado ? (
            <div className="sucesso">
              <b>{enviada ? '✅ Candidatura enviada!' : 'Você já se candidatou.'}</b>
              <p>A organização será avisada. Acompanhe o status em “Minhas candidaturas”.</p>
              <Link to="/minhas-candidaturas" className="btn btn-secundario btn-bloco">Ver minhas candidaturas</Link>
            </div>
          ) : op.status !== 'PUBLICADA' ? null : !usuario ? (
            <Link to="/entrar" className="btn btn-primario btn-bloco">Entre para se candidatar</Link>
          ) : usuario.tipo === 'ORGANIZACAO' ? (
            <p className="sutil">Entre com um perfil de voluntário para se candidatar.</p>
          ) : !abrirForm ? (
            <button className="btn btn-primario btn-bloco" onClick={() => setAbrirForm(true)}>Quero me candidatar</button>
          ) : (
            <form onSubmit={candidatar} className="form">
              <label>Conte rapidamente por que quer participar <small>(opcional)</small>
                <textarea rows={4} value={mensagem} onChange={(e) => setMensagem(e.target.value)} maxLength={600} />
              </label>
              {erro && <p className="erro">{erro}</p>}
              <button className="btn btn-primario btn-bloco">Enviar candidatura</button>
              <button type="button" className="btn btn-link" onClick={() => setAbrirForm(false)}>Cancelar</button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}

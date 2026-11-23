import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, MODALIDADES } from '../api';

const VAZIO = {
  titulo: '', causa_id: '', descricao: '', requisitos: '', modalidade: 'PRESENCIAL',
  cidade: '', uf: 'SP', data_inicio: '', data_fim: '', carga_horaria: '', vagas: 1,
};

export default function FormOportunidade() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [f, setF] = useState(VAZIO);
  const [causas, setCausas] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('/causas').then(setCausas);
    if (id) {
      api(`/oportunidades/${id}`).then((o) =>
        setF({ ...o, data_inicio: o.data_inicio?.slice(0, 10) || '', data_fim: o.data_fim?.slice(0, 10) || '' }));
    }
  }, [id]);

  const set = (campo) => (e) => setF({ ...f, [campo]: e.target.value });

  async function salvar(status) {
    setErro('');
    try {
      if (id) await api(`/oportunidades/${id}`, { method: 'PUT', body: f });
      else await api('/oportunidades', { method: 'POST', body: { ...f, status } });
      navigate('/painel');
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="card caixa-media">
      <Link to="/painel" className="voltar">← Voltar ao painel</Link>
      <h1>{id ? 'Editar oportunidade' : 'Nova oportunidade'}</h1>
      <form className="form" onSubmit={(e) => { e.preventDefault(); salvar('PUBLICADA'); }}>
        <label>Título<input required value={f.titulo} onChange={set('titulo')} placeholder="Ex.: Reforço escolar de matemática" /></label>
        <div className="linha">
          <label className="cresce">Causa
            <select required value={f.causa_id} onChange={set('causa_id')}>
              <option value="">Selecione</option>
              {causas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label className="cresce">Modalidade
            <select value={f.modalidade} onChange={set('modalidade')}>
              {Object.entries(MODALIDADES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
        {f.modalidade !== 'REMOTA' && (
          <div className="linha">
            <label className="cresce">Cidade<input required value={f.cidade || ''} onChange={set('cidade')} /></label>
            <label style={{ width: 80 }}>UF<input maxLength={2} value={f.uf || ''} onChange={set('uf')} /></label>
          </div>
        )}
        <label>Descrição da atividade<textarea required rows={4} value={f.descricao} onChange={set('descricao')} /></label>
        <label>Requisitos <small>(opcional)</small><textarea rows={2} value={f.requisitos || ''} onChange={set('requisitos')} /></label>
        <div className="linha">
          <label className="cresce">Início<input type="date" value={f.data_inicio} onChange={set('data_inicio')} /></label>
          <label className="cresce">Término<input type="date" value={f.data_fim} onChange={set('data_fim')} /></label>
          <label style={{ width: 100 }}>Vagas<input type="number" min={1} value={f.vagas} onChange={set('vagas')} /></label>
        </div>
        <label>Dedicação esperada<input value={f.carga_horaria || ''} onChange={set('carga_horaria')} placeholder="Ex.: 3 h por semana, sábados" /></label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <div className="botoes">
          {id ? (
            <button className="btn btn-primario">Salvar alterações</button>
          ) : (
            <>
              <button type="button" className="btn btn-secundario" onClick={() => salvar('RASCUNHO')}>Salvar rascunho</button>
              <button className="btn btn-primario">Publicar</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

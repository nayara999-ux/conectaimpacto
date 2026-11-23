import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';

export default function Perfil() {
  const [params] = useSearchParams();
  const [p, setP] = useState(null);
  const [causas, setCausas] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/perfil').then(setP);
    api('/causas').then(setCausas);
  }, []);

  if (!p) return <p>Carregando...</p>;
  const vol = p.tipo === 'VOLUNTARIO';
  const set = (campo) => (e) => setP({ ...p, [campo]: e.target.value });
  const alternarCausa = (id) =>
    setP({ ...p, causas: p.causas.includes(id) ? p.causas.filter((c) => c !== id) : [...p.causas, id] });

  async function salvar(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api('/perfil', { method: 'PUT', body: p });
      setMsg('Perfil atualizado.');
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="card caixa-media">
      <h1>Meu perfil</h1>
      {params.get('novo') && <p className="sucesso">Conta criada! Complete seu perfil para que as ONGs conheçam você.</p>}
      <form onSubmit={salvar} className="form">
        <label>{vol ? 'Nome' : 'Nome da organização'}<input value={p.nome || ''} onChange={set('nome')} required /></label>
        <label>E-mail<input value={p.email} disabled /></label>
        <div className="linha">
          <label className="cresce">Telefone / WhatsApp<input value={p.telefone || ''} onChange={set('telefone')} /></label>
          <label className="cresce">Cidade<input value={p.cidade || ''} onChange={set('cidade')} /></label>
          <label style={{ width: 80 }}>UF<input maxLength={2} value={p.uf || ''} onChange={set('uf')} /></label>
        </div>
        {vol ? (
          <>
            <label>Sobre mim<textarea rows={3} value={p.bio || ''} onChange={set('bio')} /></label>
            <label>Habilidades<input value={p.habilidades || ''} onChange={set('habilidades')} placeholder="Ex.: ensino, design, contabilidade" /></label>
            <label>Disponibilidade<input value={p.disponibilidade || ''} onChange={set('disponibilidade')} placeholder="Ex.: sábados de manhã" /></label>
            <fieldset>
              <legend>Causas de interesse</legend>
              <div className="chips">
                {causas.map((c) => (
                  <button type="button" key={c.id} className={`chip ${p.causas.includes(c.id) ? 'ativo' : ''}`} onClick={() => alternarCausa(c.id)}>{c.nome}</button>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <>
            <label>CNPJ<input value={p.cnpj || ''} onChange={set('cnpj')} /></label>
            <label>Site<input value={p.site || ''} onChange={set('site')} /></label>
            <label>Sobre a organização<textarea rows={4} value={p.descricao || ''} onChange={set('descricao')} /></label>
          </>
        )}
        {msg && <p className="sucesso">{msg}</p>}
        <button className="btn btn-primario">Salvar alterações</button>
      </form>
    </div>
  );
}

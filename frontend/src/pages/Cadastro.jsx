import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Cadastro() {
  const [params] = useSearchParams();
  const { cadastrar } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({
    tipo: params.get('tipo') === 'ORGANIZACAO' ? 'ORGANIZACAO' : 'VOLUNTARIO',
    nome: '', email: '', senha: '', cidade: '', uf: 'SP', cnpj: '', descricao: '', aceite: false,
  });
  const [erro, setErro] = useState('');
  const set = (campo) => (e) => setF({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const ong = f.tipo === 'ORGANIZACAO';

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (!f.aceite) return setErro('É preciso concordar com a política de privacidade.');
    try {
      const u = await cadastrar(f);
      navigate(u.tipo === 'ORGANIZACAO' ? '/painel' : '/perfil?novo=1');
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div className="caixa-auth card largo">
      <h1>Criar conta</h1>
      <div className="seletor-tipo" role="radiogroup" aria-label="Tipo de perfil">
        <button type="button" className={!ong ? 'ativo' : ''} onClick={() => setF({ ...f, tipo: 'VOLUNTARIO' })}>
          🙋 Quero ser voluntário
        </button>
        <button type="button" className={ong ? 'ativo' : ''} onClick={() => setF({ ...f, tipo: 'ORGANIZACAO' })}>
          🏛 Represento uma ONG
        </button>
      </div>
      <form onSubmit={enviar} className="form">
        <label>{ong ? 'Nome da organização' : 'Nome completo'}<input required value={f.nome} onChange={set('nome')} /></label>
        <label>E-mail<input type="email" required value={f.email} onChange={set('email')} /></label>
        <label>Senha <small>(mínimo 8 caracteres)</small><input type="password" required minLength={8} value={f.senha} onChange={set('senha')} /></label>
        <div className="linha">
          <label className="cresce">Cidade<input value={f.cidade} onChange={set('cidade')} /></label>
          <label style={{ width: 90 }}>UF<input maxLength={2} value={f.uf} onChange={set('uf')} /></label>
        </div>
        {ong && (
          <>
            <label>CNPJ <small>(opcional)</small><input value={f.cnpj} onChange={set('cnpj')} placeholder="00.000.000/0000-00" /></label>
            <label>Sobre a organização<textarea rows={3} value={f.descricao} onChange={set('descricao')} /></label>
          </>
        )}
        <label className="check">
          <input type="checkbox" checked={f.aceite} onChange={set('aceite')} />
          Li e concordo com a política de privacidade. Meus dados serão usados apenas para conectar voluntários e organizações.
        </label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="btn btn-primario btn-bloco">Criar conta</button>
      </form>
      <p className="sutil centro">Já tem conta? <Link to="/entrar">Entrar</Link></p>
    </div>
  );
}

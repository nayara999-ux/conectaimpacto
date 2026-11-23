import { createContext, useContext, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('ci_usuario');
    return salvo ? JSON.parse(salvo) : null;
  });

  function salvarSessao({ token, usuario }) {
    localStorage.setItem('ci_token', token);
    localStorage.setItem('ci_usuario', JSON.stringify(usuario));
    setUsuario(usuario);
  }

  const login = async (email, senha) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, senha } });
    salvarSessao(r);
    return r.usuario;
  };

  const cadastrar = async (dados) => {
    const r = await api('/auth/register', { method: 'POST', body: dados });
    salvarSessao(r);
    return r.usuario;
  };

  const sair = () => {
    localStorage.removeItem('ci_token');
    localStorage.removeItem('ci_usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, cadastrar, sair }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

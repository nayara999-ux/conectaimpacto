// Cliente HTTP simples para a API REST
const BASE = import.meta.env.VITE_API_URL || '/api';

export async function api(caminho, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('ci_token');
  const resp = await fetch(`${BASE}${caminho}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(dados.erro || 'Algo deu errado. Tente novamente.');
  return dados;
}

export const MODALIDADES = { PRESENCIAL: 'Presencial', REMOTA: 'Remota', HIBRIDA: 'Híbrida' };

export const STATUS_CANDIDATURA = {
  PENDENTE: { rotulo: 'Enviada', cor: 'cinza' },
  EM_ANALISE: { rotulo: 'Em análise', cor: 'amarelo' },
  APROVADA: { rotulo: 'Aprovada', cor: 'verde' },
  RECUSADA: { rotulo: 'Não selecionada', cor: 'vermelho' },
  CANCELADA: { rotulo: 'Cancelada', cor: 'cinza' },
};

export const STATUS_OPORTUNIDADE = {
  RASCUNHO: { rotulo: 'Rascunho', cor: 'cinza' },
  PUBLICADA: { rotulo: 'Publicada', cor: 'verde' },
  ENCERRADA: { rotulo: 'Encerrada', cor: 'vermelho' },
};

export function formatarData(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

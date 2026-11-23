# ConectaImpacto

Plataforma web de gestão e engajamento para voluntariado e ONGs — MVP desenvolvido no **Projeto Integrador** do curso de Tecnologia em Análise e Desenvolvimento de Sistemas do **Centro Universitário Senac (EAD)**.

**Equipe:** Nayara Dantas Leite · Rodrigo dos Anjos Silva · Vinícius Fernandes de Carvalho Lopes · João Pedro dos Santos Silvano
**Orientador:** Prof. Me. Anderson Clayton

## Funcionalidades do MVP

| Perfil | Funcionalidades |
|---|---|
| Voluntário | Cadastro e login · perfil com habilidades, disponibilidade e causas de interesse · busca com filtros (causa, modalidade, cidade, palavra-chave) · candidatura com mensagem · acompanhamento do status e histórico · cancelamento |
| Organização (ONG) | Cadastro e login · painel com indicadores · criar, editar, publicar, encerrar e reabrir oportunidades · lista de candidatos com perfil e contato · aprovar/recusar com recado ao voluntário |

## Tecnologias

- **Front-end:** React 19, React Router 7, Vite 6, HTML5 e CSS3 (layout responsivo)
- **Back-end:** Node.js 22, Express 5, JSON Web Token (jsonwebtoken), bcryptjs, node-postgres (pg)
- **Banco de dados:** PostgreSQL 16
- **Ferramentas:** Git/GitHub, Graphviz (DER), Playwright (capturas e vídeo)

## Estrutura

```
conectaimpacto/
├── backend/            API REST (Express)
│   └── src/
│       ├── server.js
│       ├── db.js, auth.js
│       ├── routes/     auth, perfil, oportunidades, candidaturas
│       └── scripts/initDb.js   cria o banco e insere dados de exemplo
├── frontend/           SPA React (Vite)
│   └── src/pages/      Inicio, Login, Cadastro, Oportunidades, DetalheOportunidade,
│                       MinhasCandidaturas, Perfil, PainelOng, FormOportunidade, Candidatos
└── database/schema.sql modelo físico (8 tabelas)
```

## Como executar

Pré-requisitos: Node.js 20+ e PostgreSQL 14+.

```bash
# 1. Banco de dados
createdb conectaimpacto

# 2. API
cd backend
cp .env.example .env        # ajuste DATABASE_URL se necessário
npm install
npm run db:init             # cria as tabelas e os dados de demonstração
npm start                   # http://localhost:3001

# 3. Front-end (em outro terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Para servir tudo em uma única porta: `cd frontend && npm run build` e depois `cd backend && npm start` — a API passa a entregar o front-end compilado em http://localhost:3001.

### Usuários de teste (senha `conecta123`)

| Perfil | E-mail |
|---|---|
| Voluntária (persona Camila) | camila@email.com |
| Voluntário (persona Antônio) | antonio@email.com |
| ONG (persona Márcia — Instituto Semear) | contato@semear.org |
| ONG | contato@verdevivo.org |

## Principais rotas da API

| Método | Rota | Acesso |
|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` | público |
| GET/PUT | `/api/perfil` | autenticado |
| GET | `/api/causas` · `/api/oportunidades` · `/api/oportunidades/:id` | público |
| GET | `/api/oportunidades/minhas` | ONG |
| POST/PUT | `/api/oportunidades` · `/api/oportunidades/:id` | ONG (dona) |
| PATCH | `/api/oportunidades/:id/status` | ONG (dona) |
| POST | `/api/candidaturas/oportunidade/:id` | voluntário |
| GET | `/api/candidaturas/minhas` | voluntário |
| GET | `/api/candidaturas/oportunidade/:id` | ONG (dona) |
| PATCH | `/api/candidaturas/:id/status` · `/api/candidaturas/:id/cancelar` | ONG · voluntário |
| GET | `/api/candidaturas/:id/historico` | partes envolvidas |

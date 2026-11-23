-- ConectaImpacto — modelo físico (PostgreSQL 16)
-- Projeto Integrador — Senac EAD — TADS

DROP TABLE IF EXISTS historico_status CASCADE;
DROP TABLE IF EXISTS candidatura CASCADE;
DROP TABLE IF EXISTS oportunidade CASCADE;
DROP TABLE IF EXISTS voluntario_causa CASCADE;
DROP TABLE IF EXISTS causa CASCADE;
DROP TABLE IF EXISTS organizacao CASCADE;
DROP TABLE IF EXISTS voluntario CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TYPE IF EXISTS tipo_usuario, modalidade_oportunidade, status_oportunidade, status_candidatura;

CREATE TYPE tipo_usuario AS ENUM ('VOLUNTARIO', 'ORGANIZACAO');
CREATE TYPE modalidade_oportunidade AS ENUM ('PRESENCIAL', 'REMOTA', 'HIBRIDA');
CREATE TYPE status_oportunidade AS ENUM ('RASCUNHO', 'PUBLICADA', 'ENCERRADA');
CREATE TYPE status_candidatura AS ENUM ('PENDENTE', 'EM_ANALISE', 'APROVADA', 'RECUSADA', 'CANCELADA');

-- Dados comuns de acesso (voluntários e organizações)
CREATE TABLE usuario (
  id            SERIAL PRIMARY KEY,
  nome          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  senha_hash    VARCHAR(100) NOT NULL,
  tipo          tipo_usuario NOT NULL,
  telefone      VARCHAR(20),
  cidade        VARCHAR(80),
  uf            CHAR(2),
  criado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Especialização 1:1 de usuario para voluntários
CREATE TABLE voluntario (
  usuario_id      INTEGER PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
  bio             TEXT,
  habilidades     VARCHAR(300),
  disponibilidade VARCHAR(120)
);

-- Especialização 1:1 de usuario para organizações
CREATE TABLE organizacao (
  usuario_id    INTEGER PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
  cnpj          VARCHAR(18) UNIQUE,
  descricao     TEXT,
  site          VARCHAR(200)
);

CREATE TABLE causa (
  id    SERIAL PRIMARY KEY,
  nome  VARCHAR(60) NOT NULL UNIQUE
);

-- Causas de interesse do voluntário (N:N)
CREATE TABLE voluntario_causa (
  voluntario_id INTEGER REFERENCES voluntario(usuario_id) ON DELETE CASCADE,
  causa_id      INTEGER REFERENCES causa(id) ON DELETE CASCADE,
  PRIMARY KEY (voluntario_id, causa_id)
);

CREATE TABLE oportunidade (
  id              SERIAL PRIMARY KEY,
  organizacao_id  INTEGER NOT NULL REFERENCES organizacao(usuario_id) ON DELETE CASCADE,
  causa_id        INTEGER NOT NULL REFERENCES causa(id),
  titulo          VARCHAR(120) NOT NULL,
  descricao       TEXT NOT NULL,
  requisitos      TEXT,
  modalidade      modalidade_oportunidade NOT NULL,
  cidade          VARCHAR(80),
  uf              CHAR(2),
  data_inicio     DATE,
  data_fim        DATE,
  carga_horaria   VARCHAR(60),
  vagas           INTEGER NOT NULL DEFAULT 1 CHECK (vagas > 0),
  status          status_oportunidade NOT NULL DEFAULT 'RASCUNHO',
  criado_em       TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio)
);
CREATE INDEX idx_oportunidade_busca ON oportunidade (status, causa_id, modalidade, cidade);

CREATE TABLE candidatura (
  id               SERIAL PRIMARY KEY,
  oportunidade_id  INTEGER NOT NULL REFERENCES oportunidade(id) ON DELETE CASCADE,
  voluntario_id    INTEGER NOT NULL REFERENCES voluntario(usuario_id) ON DELETE CASCADE,
  mensagem         TEXT,
  status           status_candidatura NOT NULL DEFAULT 'PENDENTE',
  criado_em        TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (oportunidade_id, voluntario_id)
);

-- Rastreabilidade das mudanças de status de cada candidatura
CREATE TABLE historico_status (
  id               SERIAL PRIMARY KEY,
  candidatura_id   INTEGER NOT NULL REFERENCES candidatura(id) ON DELETE CASCADE,
  status_anterior  status_candidatura,
  status_novo      status_candidatura NOT NULL,
  alterado_por     INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  observacao       VARCHAR(300),
  alterado_em      TIMESTAMP NOT NULL DEFAULT NOW()
);

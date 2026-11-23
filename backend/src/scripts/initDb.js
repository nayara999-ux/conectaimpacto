// Cria as tabelas e insere dados de demonstração.
// Uso: npm run db:init
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../db');

const CAUSAS = ['Educação', 'Meio ambiente', 'Saúde', 'Assistência social', 'Animais', 'Cultura e esporte', 'Idosos', 'Gestão e tecnologia para ONGs'];

const ORGS = [
  { nome: 'Instituto Semear', email: 'contato@semear.org', cidade: 'São Paulo', uf: 'SP', cnpj: '12.345.678/0001-90',
    descricao: 'Reforço escolar e oficinas de leitura para crianças e adolescentes da Zona Leste de São Paulo.', site: 'https://semear.org.br' },
  { nome: 'Associação Verde Vivo', email: 'contato@verdevivo.org', cidade: 'Guarulhos', uf: 'SP', cnpj: '23.456.789/0001-01',
    descricao: 'Recuperação de áreas verdes urbanas e educação ambiental em escolas públicas.', site: 'https://verdevivo.org.br' },
  { nome: 'Casa Acolher', email: 'contato@casaacolher.org', cidade: 'São Paulo', uf: 'SP', cnpj: '34.567.890/0001-12',
    descricao: 'Apoio a pessoas em situação de rua com alimentação, triagem social e encaminhamentos.', site: '' },
  { nome: 'Patas Amigas', email: 'contato@patasamigas.org', cidade: 'Santo André', uf: 'SP', cnpj: '45.678.901/0001-23',
    descricao: 'Resgate, castração e adoção responsável de cães e gatos.', site: '' },
];

const VOLUNTARIOS = [
  { nome: 'Camila Rocha', email: 'camila@email.com', cidade: 'São Paulo', uf: 'SP', habilidades: 'Comunicação, redes sociais, design no Canva',
    disponibilidade: 'Sábados pela manhã e remoto à noite', bio: 'Analista de marketing, quero usar o que sei para ajudar causas de educação.' },
  { nome: 'Antônio Ferreira', email: 'antonio@email.com', cidade: 'Guarulhos', uf: 'SP', habilidades: 'Contabilidade, planilhas, organização financeira',
    disponibilidade: 'Terças e quintas à tarde', bio: 'Contador aposentado. Gosto de ensinar e de ser útil.' },
  { nome: 'Lucas Martins', email: 'lucas@email.com', cidade: 'São Paulo', uf: 'SP', habilidades: 'Programação, matemática',
    disponibilidade: 'Fins de semana', bio: 'Estudante de ADS.' },
  { nome: 'Beatriz Souza', email: 'beatriz@email.com', cidade: 'Santo André', uf: 'SP', habilidades: 'Cuidados com animais, fotografia',
    disponibilidade: 'Domingos', bio: '' },
];

// [org, causa, titulo, modalidade, cidade, inicio, fim, carga, vagas, status, descricao, requisitos]
const OPS = [
  [0, 'Educação', 'Reforço escolar de matemática (6º ao 9º ano)', 'PRESENCIAL', 'São Paulo', '2026-12-05', '2027-06-30', '3 h por semana, sábados das 9h às 12h', 6, 'PUBLICADA',
    'Apoie alunos do ensino fundamental com dificuldades em matemática, em pequenos grupos, na sede do Instituto Semear (Itaquera).',
    'Maiores de 18 anos; conhecimento de matemática do ensino fundamental; compromisso mínimo de 3 meses.'],
  [0, 'Educação', 'Mediação de leitura para crianças', 'PRESENCIAL', 'São Paulo', '2026-12-12', '2027-03-31', '2 h por semana', 4, 'PUBLICADA',
    'Conduza rodas de leitura e contação de histórias para crianças de 6 a 10 anos.', 'Gostar de ler em voz alta e de trabalhar com crianças.'],
  [0, 'Gestão e tecnologia para ONGs', 'Criação de posts para redes sociais', 'REMOTA', '', '2026-12-01', '2027-02-28', '4 h por mês', 2, 'PUBLICADA',
    'Ajude a divulgar as ações do Instituto criando peças para Instagram e WhatsApp a partir de fotos e textos enviados pela equipe.', 'Familiaridade com Canva ou ferramenta similar.'],
  [0, 'Educação', 'Feira de ciências 2027 — monitores', 'PRESENCIAL', 'São Paulo', '2027-05-15', '2027-05-15', '1 dia (8 h)', 10, 'RASCUNHO',
    'Monitores para orientar visitantes durante a feira de ciências anual.', ''],
  [1, 'Meio ambiente', 'Mutirão de plantio no Parque do Lago', 'PRESENCIAL', 'Guarulhos', '2026-12-13', '2026-12-13', 'Sábado, 8h às 12h', 25, 'PUBLICADA',
    'Plantio de mudas nativas e limpeza de trilhas. Ferramentas e lanche fornecidos.', 'Usar roupas confortáveis e protetor solar.'],
  [1, 'Gestão e tecnologia para ONGs', 'Apoio na organização financeira da associação', 'HIBRIDA', 'Guarulhos', '2027-01-06', '2027-04-30', '4 h por semana', 1, 'PUBLICADA',
    'Organize o controle de entradas e saídas, prestação de contas de projetos e planilhas de orçamento.', 'Experiência com contabilidade ou finanças.'],
  [2, 'Assistência social', 'Distribuição de refeições noturnas', 'PRESENCIAL', 'São Paulo', '2026-12-01', '2027-12-31', '1 noite por semana (19h–22h)', 12, 'PUBLICADA',
    'Preparo e distribuição de refeições na região central de São Paulo.', 'Maiores de 18 anos.'],
  [2, 'Saúde', 'Triagem e acolhimento — profissionais de saúde', 'PRESENCIAL', 'São Paulo', '2027-01-10', '2027-06-30', '4 h por mês', 3, 'PUBLICADA',
    'Atendimento inicial e orientação em saúde durante as ações mensais da Casa Acolher.', 'Formação na área da saúde com registro profissional ativo.'],
  [3, 'Animais', 'Feira de adoção de fim de ano', 'PRESENCIAL', 'Santo André', '2026-12-20', '2026-12-20', 'Domingo, 10h às 16h', 8, 'PUBLICADA',
    'Ajude no cuidado dos animais e na conversa com adotantes durante a feira.', ''],
  [3, 'Animais', 'Fotógrafo voluntário para perfis de adoção', 'HIBRIDA', 'Santo André', '2026-12-01', '2027-03-31', '2 h por semana', 2, 'PUBLICADA',
    'Fotografe os animais disponíveis para adoção e trate as imagens para as redes sociais.', 'Câmera ou celular com boa câmera.'],
  [1, 'Meio ambiente', 'Oficina de compostagem em escolas', 'PRESENCIAL', 'Guarulhos', '2026-10-01', '2026-11-15', '2 h por semana', 4, 'ENCERRADA',
    'Oficinas práticas de compostagem doméstica para alunos do ensino fundamental.', ''],
];

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'database', 'schema.sql'), 'utf8');
  await db.query(schema);
  for (const c of CAUSAS) await db.query('INSERT INTO causa (nome) VALUES ($1)', [c]);
  const causaId = {};
  (await db.query('SELECT id, nome FROM causa')).rows.forEach((r) => (causaId[r.nome] = r.id));

  const hash = await bcrypt.hash('conecta123', 10);
  const orgIds = [];
  for (const o of ORGS) {
    const { rows } = await db.query(
      `INSERT INTO usuario (nome, email, senha_hash, tipo, cidade, uf, telefone) VALUES ($1,$2,$3,'ORGANIZACAO',$4,$5,'(11) 3000-0000') RETURNING id`,
      [o.nome, o.email, hash, o.cidade, o.uf]
    );
    await db.query('INSERT INTO organizacao (usuario_id, cnpj, descricao, site) VALUES ($1,$2,$3,$4)', [rows[0].id, o.cnpj, o.descricao, o.site]);
    orgIds.push(rows[0].id);
  }
  const volIds = [];
  for (const v of VOLUNTARIOS) {
    const { rows } = await db.query(
      `INSERT INTO usuario (nome, email, senha_hash, tipo, cidade, uf, telefone) VALUES ($1,$2,$3,'VOLUNTARIO',$4,$5,'(11) 90000-0000') RETURNING id`,
      [v.nome, v.email, hash, v.cidade, v.uf]
    );
    await db.query('INSERT INTO voluntario (usuario_id, bio, habilidades, disponibilidade) VALUES ($1,$2,$3,$4)', [rows[0].id, v.bio, v.habilidades, v.disponibilidade]);
    volIds.push(rows[0].id);
  }
  await db.query('INSERT INTO voluntario_causa VALUES ($1,$2),($1,$3)', [volIds[0], causaId['Educação'], causaId['Gestão e tecnologia para ONGs']]);
  await db.query('INSERT INTO voluntario_causa VALUES ($1,$2)', [volIds[1], causaId['Gestão e tecnologia para ONGs']]);

  const opIds = [];
  for (const [org, causa, titulo, mod, cidade, ini, fim, carga, vagas, status, desc, req] of OPS) {
    const { rows } = await db.query(
      `INSERT INTO oportunidade (organizacao_id, causa_id, titulo, descricao, requisitos, modalidade, cidade, uf, data_inicio, data_fim, carga_horaria, vagas, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [orgIds[org], causaId[causa], titulo, desc, req || null, mod, cidade || null, cidade ? 'SP' : null, ini, fim, carga, vagas, status]
    );
    opIds.push(rows[0].id);
  }

  // Candidaturas de exemplo: [voluntário, oportunidade, status final, observação]
  const CANDS = [
    [0, 2, 'APROVADA', 'Bem-vinda! Enviaremos o material por e-mail.'],
    [2, 0, 'EM_ANALISE', 'Vamos agendar uma conversa rápida.'],
    [3, 0, 'PENDENTE', null],
    [1, 5, 'PENDENTE', null],
    [3, 8, 'APROVADA', 'Confirmado para a feira.'],
    [2, 4, 'APROVADA', null],
  ];
  for (const [v, o, status, obs] of CANDS) {
    const { rows } = await db.query(
      `INSERT INTO candidatura (oportunidade_id, voluntario_id, mensagem, status) VALUES ($1,$2,$3,$4) RETURNING id`,
      [opIds[o], volIds[v], 'Tenho interesse e disponibilidade no horário indicado.', status]
    );
    await db.query(`INSERT INTO historico_status (candidatura_id, status_anterior, status_novo, alterado_por, observacao, alterado_em)
                    VALUES ($1, NULL, 'PENDENTE', $2, 'Candidatura enviada', NOW() - INTERVAL '3 days')`, [rows[0].id, volIds[v]]);
    if (status !== 'PENDENTE') {
      await db.query(`INSERT INTO historico_status (candidatura_id, status_anterior, status_novo, alterado_por, observacao, alterado_em)
                      VALUES ($1, 'PENDENTE', $2, $3, $4, NOW() - INTERVAL '1 day')`, [rows[0].id, status, orgIds[OPS[o][0]], obs]);
    }
  }
  console.log('Banco criado e populado. Senha de todos os usuários de teste: conecta123');
  await db.pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });

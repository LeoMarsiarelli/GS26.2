-- =====================================================================
--  BairroAtivo - Zeladoria urbana colaborativa e acessível
--  Global Solution 2 - 2026 (CitizenTech)
--  Script 01 - DDL: criação das tabelas, restrições, índices e visões
--  SGBD: Oracle Database 19c / 21c / 23ai
-- =====================================================================
SET DEFINE OFF
SET SERVEROUTPUT ON

-- ---------------------------------------------------------------------
-- Limpeza (permite reexecutar o script)
-- ---------------------------------------------------------------------
BEGIN
  FOR t IN (SELECT table_name FROM user_tables
             WHERE table_name IN ('LOG_ERRO','INDICADOR_BAIRRO','AVALIACAO','HISTORICO_STATUS',
                                  'APOIO','OCORRENCIA','PALAVRA_CHAVE_RISCO','CATEGORIA',
                                  'ORGAO','CIDADAO','BAIRRO')) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS PURGE';
  END LOOP;
  FOR s IN (SELECT sequence_name FROM user_sequences WHERE sequence_name = 'SEQ_PROTOCOLO') LOOP
    EXECUTE IMMEDIATE 'DROP SEQUENCE ' || s.sequence_name;
  END LOOP;
END;
/

-- ---------------------------------------------------------------------
-- BAIRRO: área geográfica atendida
-- ---------------------------------------------------------------------
CREATE TABLE bairro (
  id_bairro     NUMBER GENERATED ALWAYS AS IDENTITY,
  nome          VARCHAR2(80)  NOT NULL,
  cidade        VARCHAR2(80)  NOT NULL,
  uf            CHAR(2)       NOT NULL,
  CONSTRAINT pk_bairro PRIMARY KEY (id_bairro),
  CONSTRAINT uk_bairro UNIQUE (nome, cidade, uf)
);

-- ---------------------------------------------------------------------
-- CIDADAO: usuário do aplicativo
-- ---------------------------------------------------------------------
CREATE TABLE cidadao (
  id_cidadao          NUMBER GENERATED ALWAYS AS IDENTITY,
  nome                VARCHAR2(100) NOT NULL,
  email               VARCHAR2(120) NOT NULL,
  telefone            VARCHAR2(20),
  id_bairro           NUMBER        NOT NULL,
  necessidade_acess   CHAR(1)       DEFAULT 'N' NOT NULL,
  fonte_grande        CHAR(1)       DEFAULT 'N' NOT NULL,
  alto_contraste      CHAR(1)       DEFAULT 'N' NOT NULL,
  dt_cadastro         DATE          DEFAULT SYSDATE NOT NULL,
  CONSTRAINT pk_cidadao PRIMARY KEY (id_cidadao),
  CONSTRAINT uk_cidadao_email UNIQUE (email),
  CONSTRAINT fk_cidadao_bairro FOREIGN KEY (id_bairro) REFERENCES bairro (id_bairro),
  CONSTRAINT ck_cidadao_acess CHECK (necessidade_acess IN ('S','N')),
  CONSTRAINT ck_cidadao_fonte CHECK (fonte_grande IN ('S','N')),
  CONSTRAINT ck_cidadao_contr CHECK (alto_contraste IN ('S','N')),
  CONSTRAINT ck_cidadao_email CHECK (REGEXP_LIKE(email, '^[^@ ]+@[^@ ]+\.[^@ ]+$'))
);

-- ---------------------------------------------------------------------
-- ORGAO: órgão público responsável pelo atendimento
-- ---------------------------------------------------------------------
CREATE TABLE orgao (
  id_orgao   NUMBER GENERATED ALWAYS AS IDENTITY,
  nome       VARCHAR2(100) NOT NULL,
  telefone   VARCHAR2(20),
  email      VARCHAR2(120),
  CONSTRAINT pk_orgao PRIMARY KEY (id_orgao),
  CONSTRAINT uk_orgao_nome UNIQUE (nome)
);

-- ---------------------------------------------------------------------
-- CATEGORIA: tipo de problema, com prazo (SLA) e peso de risco
-- ---------------------------------------------------------------------
CREATE TABLE categoria (
  id_categoria  NUMBER GENERATED ALWAYS AS IDENTITY,
  codigo        VARCHAR2(20)  NOT NULL,
  nome          VARCHAR2(60)  NOT NULL,
  sla_dias      NUMBER(3)     NOT NULL,
  peso_risco    NUMBER(3)     NOT NULL,
  id_orgao      NUMBER        NOT NULL,
  CONSTRAINT pk_categoria PRIMARY KEY (id_categoria),
  CONSTRAINT uk_categoria_codigo UNIQUE (codigo),
  CONSTRAINT fk_categoria_orgao FOREIGN KEY (id_orgao) REFERENCES orgao (id_orgao),
  CONSTRAINT ck_categoria_sla CHECK (sla_dias BETWEEN 1 AND 90),
  CONSTRAINT ck_categoria_peso CHECK (peso_risco BETWEEN 0 AND 40)
);

-- ---------------------------------------------------------------------
-- PALAVRA_CHAVE_RISCO: base de conhecimento da triagem automática
-- (termos sem acento e em maiúsculas)
-- ---------------------------------------------------------------------
CREATE TABLE palavra_chave_risco (
  id_palavra  NUMBER GENERATED ALWAYS AS IDENTITY,
  termo       VARCHAR2(40) NOT NULL,
  grupo       VARCHAR2(30) NOT NULL,
  peso        NUMBER(3)    NOT NULL,
  CONSTRAINT pk_palavra PRIMARY KEY (id_palavra),
  CONSTRAINT uk_palavra_termo UNIQUE (termo),
  CONSTRAINT ck_palavra_peso CHECK (peso BETWEEN 1 AND 40),
  CONSTRAINT ck_palavra_upper CHECK (termo = UPPER(termo))
);

-- ---------------------------------------------------------------------
-- OCORRENCIA: problema registrado pelo cidadão
-- ---------------------------------------------------------------------
CREATE SEQUENCE seq_protocolo START WITH 100000 INCREMENT BY 1 NOCACHE;

CREATE TABLE ocorrencia (
  id_ocorrencia   NUMBER GENERATED ALWAYS AS IDENTITY,
  protocolo       VARCHAR2(20)   NOT NULL,
  id_cidadao      NUMBER         NOT NULL,
  id_categoria    NUMBER         NOT NULL,
  id_bairro       NUMBER         NOT NULL,
  descricao       VARCHAR2(500)  NOT NULL,
  endereco        VARCHAR2(200)  NOT NULL,
  latitude        NUMBER(9,6)    NOT NULL,
  longitude       NUMBER(9,6)    NOT NULL,
  foto_url        VARCHAR2(400),
  status          VARCHAR2(12)   DEFAULT 'ABERTA' NOT NULL,
  prioridade      VARCHAR2(8)    DEFAULT 'BAIXA'  NOT NULL,
  pontuacao       NUMBER(3)      DEFAULT 0        NOT NULL,
  afeta_acess     CHAR(1)        DEFAULT 'N'      NOT NULL,
  qtd_apoios      NUMBER(6)      DEFAULT 0        NOT NULL,
  dt_abertura     DATE           DEFAULT SYSDATE  NOT NULL,
  dt_prazo        DATE           NOT NULL,
  dt_resolucao    DATE,
  CONSTRAINT pk_ocorrencia PRIMARY KEY (id_ocorrencia),
  CONSTRAINT uk_ocorrencia_protocolo UNIQUE (protocolo),
  CONSTRAINT fk_ocorr_cidadao   FOREIGN KEY (id_cidadao)   REFERENCES cidadao (id_cidadao),
  CONSTRAINT fk_ocorr_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria),
  CONSTRAINT fk_ocorr_bairro    FOREIGN KEY (id_bairro)    REFERENCES bairro (id_bairro),
  CONSTRAINT ck_ocorr_status     CHECK (status IN ('ABERTA','EM_ANALISE','EM_EXECUCAO','RESOLVIDA')),
  CONSTRAINT ck_ocorr_prioridade CHECK (prioridade IN ('BAIXA','MEDIA','ALTA','CRITICA')),
  CONSTRAINT ck_ocorr_pontuacao  CHECK (pontuacao BETWEEN 0 AND 100),
  CONSTRAINT ck_ocorr_acess      CHECK (afeta_acess IN ('S','N')),
  CONSTRAINT ck_ocorr_lat        CHECK (latitude  BETWEEN -90  AND 90),
  CONSTRAINT ck_ocorr_lon        CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT ck_ocorr_resolucao  CHECK (dt_resolucao IS NULL OR dt_resolucao >= dt_abertura)
);

-- ---------------------------------------------------------------------
-- APOIO: "também me afeta" (relacionamento N:N cidadão x ocorrência)
-- ---------------------------------------------------------------------
CREATE TABLE apoio (
  id_ocorrencia  NUMBER NOT NULL,
  id_cidadao     NUMBER NOT NULL,
  dt_apoio       DATE   DEFAULT SYSDATE NOT NULL,
  CONSTRAINT pk_apoio PRIMARY KEY (id_ocorrencia, id_cidadao),
  CONSTRAINT fk_apoio_ocorrencia FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencia (id_ocorrencia) ON DELETE CASCADE,
  CONSTRAINT fk_apoio_cidadao    FOREIGN KEY (id_cidadao)    REFERENCES cidadao (id_cidadao) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- HISTORICO_STATUS: linha do tempo do atendimento (preenchida por trigger)
-- ---------------------------------------------------------------------
CREATE TABLE historico_status (
  id_historico     NUMBER GENERATED ALWAYS AS IDENTITY,
  id_ocorrencia    NUMBER        NOT NULL,
  status_anterior  VARCHAR2(12),
  status_novo      VARCHAR2(12)  NOT NULL,
  observacao       VARCHAR2(300),
  dt_evento        DATE          DEFAULT SYSDATE NOT NULL,
  usuario_bd       VARCHAR2(60)  DEFAULT USER NOT NULL,
  CONSTRAINT pk_historico PRIMARY KEY (id_historico),
  CONSTRAINT fk_hist_ocorrencia FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencia (id_ocorrencia) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- AVALIACAO: nota do cidadão após a resolução (1:1 com OCORRENCIA)
-- ---------------------------------------------------------------------
CREATE TABLE avaliacao (
  id_avaliacao   NUMBER GENERATED ALWAYS AS IDENTITY,
  id_ocorrencia  NUMBER        NOT NULL,
  id_cidadao     NUMBER        NOT NULL,
  nota           NUMBER(1)     NOT NULL,
  comentario     VARCHAR2(300),
  dt_avaliacao   DATE          DEFAULT SYSDATE NOT NULL,
  CONSTRAINT pk_avaliacao PRIMARY KEY (id_avaliacao),
  CONSTRAINT uk_avaliacao_ocorrencia UNIQUE (id_ocorrencia),
  CONSTRAINT fk_aval_ocorrencia FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencia (id_ocorrencia) ON DELETE CASCADE,
  CONSTRAINT fk_aval_cidadao    FOREIGN KEY (id_cidadao)    REFERENCES cidadao (id_cidadao),
  CONSTRAINT ck_aval_nota CHECK (nota BETWEEN 1 AND 5)
);

-- ---------------------------------------------------------------------
-- INDICADOR_BAIRRO: fotografia diária dos indicadores (gerada por procedure)
-- ---------------------------------------------------------------------
CREATE TABLE indicador_bairro (
  id_indicador      NUMBER GENERATED ALWAYS AS IDENTITY,
  id_bairro         NUMBER       NOT NULL,
  dt_referencia     DATE         NOT NULL,
  total             NUMBER(8)    NOT NULL,
  abertas           NUMBER(8)    NOT NULL,
  resolvidas        NUMBER(8)    NOT NULL,
  atrasadas         NUMBER(8)    NOT NULL,
  taxa_resolucao    NUMBER(5,2)  NOT NULL,
  pct_no_prazo      NUMBER(5,2)  NOT NULL,
  tempo_medio_dias  NUMBER(6,2),
  satisfacao_media  NUMBER(3,2),
  indice_zeladoria  NUMBER(3)    NOT NULL,
  CONSTRAINT pk_indicador PRIMARY KEY (id_indicador),
  CONSTRAINT uk_indicador UNIQUE (id_bairro, dt_referencia),
  CONSTRAINT fk_ind_bairro FOREIGN KEY (id_bairro) REFERENCES bairro (id_bairro)
);

-- ---------------------------------------------------------------------
-- LOG_ERRO: auditoria de erros das rotinas PL/SQL
-- ---------------------------------------------------------------------
CREATE TABLE log_erro (
  id_log        NUMBER GENERATED ALWAYS AS IDENTITY,
  rotina        VARCHAR2(60)   NOT NULL,
  codigo_erro   NUMBER,
  mensagem      VARCHAR2(4000),
  parametros    VARCHAR2(1000),
  dt_erro       TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  usuario_bd    VARCHAR2(60)   DEFAULT USER NOT NULL,
  CONSTRAINT pk_log_erro PRIMARY KEY (id_log)
);

-- ---------------------------------------------------------------------
-- Índices para as consultas mais frequentes do app
-- ---------------------------------------------------------------------
CREATE INDEX ix_ocorr_status_bairro ON ocorrencia (id_bairro, status);
CREATE INDEX ix_ocorr_categoria     ON ocorrencia (id_categoria, status);
CREATE INDEX ix_ocorr_cidadao       ON ocorrencia (id_cidadao);
CREATE INDEX ix_ocorr_prazo         ON ocorrencia (dt_prazo);
CREATE INDEX ix_ocorr_geo           ON ocorrencia (latitude, longitude);
CREATE INDEX ix_hist_ocorrencia     ON historico_status (id_ocorrencia, dt_evento);
CREATE INDEX ix_apoio_cidadao       ON apoio (id_cidadao);
CREATE INDEX ix_cidadao_bairro      ON cidadao (id_bairro);
CREATE INDEX ix_categoria_orgao     ON categoria (id_orgao);
CREATE INDEX ix_aval_cidadao        ON avaliacao (id_cidadao);

-- ---------------------------------------------------------------------
-- Comentários (dicionário de dados)
-- ---------------------------------------------------------------------
COMMENT ON TABLE  ocorrencia             IS 'Problema urbano registrado pelo cidadão via app BairroAtivo';
COMMENT ON COLUMN ocorrencia.protocolo   IS 'Número público de acompanhamento (BA-AAAA-NNNNNN)';
COMMENT ON COLUMN ocorrencia.pontuacao   IS 'Pontuação de urgência 0..100 calculada pela triagem automática';
COMMENT ON COLUMN ocorrencia.qtd_apoios  IS 'Quantidade de cidadãos que declararam ser afetados (mantida por trigger)';
COMMENT ON COLUMN ocorrencia.dt_prazo    IS 'Prazo de atendimento = abertura + CATEGORIA.SLA_DIAS';
COMMENT ON TABLE  apoio                  IS 'Cidadãos afetados por uma ocorrência (N:N)';
COMMENT ON TABLE  historico_status       IS 'Linha do tempo do atendimento, gravada automaticamente por trigger';
COMMENT ON TABLE  palavra_chave_risco    IS 'Termos que elevam a prioridade na triagem automática';
COMMENT ON TABLE  indicador_bairro       IS 'Indicadores consolidados diariamente por PRC_GERAR_INDICADORES';

-- ---------------------------------------------------------------------
-- Visões de apoio
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_ocorrencias_abertas AS
SELECT o.protocolo, c.nome AS categoria, b.nome AS bairro, o.endereco,
       o.status, o.prioridade, o.pontuacao, o.qtd_apoios, o.afeta_acess,
       o.dt_abertura, o.dt_prazo,
       CASE WHEN SYSDATE > o.dt_prazo THEN TRUNC(SYSDATE - o.dt_prazo) ELSE 0 END AS dias_atraso,
       g.nome AS orgao_responsavel
  FROM ocorrencia o
  JOIN categoria c ON c.id_categoria = o.id_categoria
  JOIN orgao     g ON g.id_orgao     = c.id_orgao
  JOIN bairro    b ON b.id_bairro    = o.id_bairro
 WHERE o.status <> 'RESOLVIDA';

CREATE OR REPLACE VIEW vw_ranking_categorias AS
SELECT c.nome AS categoria,
       COUNT(o.id_ocorrencia)                                        AS total,
       SUM(CASE WHEN o.status = 'RESOLVIDA' THEN 1 ELSE 0 END)       AS resolvidas,
       ROUND(AVG(CASE WHEN o.status = 'RESOLVIDA'
                      THEN o.dt_resolucao - o.dt_abertura END), 1)   AS tempo_medio_dias,
       SUM(o.qtd_apoios)                                             AS cidadaos_afetados
  FROM categoria c
  LEFT JOIN ocorrencia o ON o.id_categoria = c.id_categoria
 GROUP BY c.nome;

PROMPT >>> 01_ddl.sql executado com sucesso.

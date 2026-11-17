-- =====================================================================
--  BairroAtivo - Script 04 - Carga de dados de referência e exemplo
--  (executar APÓS 02_pkg_bairro_ativo.sql e 03_triggers.sql, pois as
--   ocorrências usam o pacote e as triggers para calcular prazo,
--   pontuação e histórico — ver ordem no README)
-- =====================================================================
SET DEFINE OFF
SET SERVEROUTPUT ON

-- Bairros -------------------------------------------------------------
INSERT INTO bairro (nome, cidade, uf) VALUES ('Bela Vista',       'São Paulo', 'SP');
INSERT INTO bairro (nome, cidade, uf) VALUES ('Consolação',       'São Paulo', 'SP');
INSERT INTO bairro (nome, cidade, uf) VALUES ('Cerqueira César',  'São Paulo', 'SP');
INSERT INTO bairro (nome, cidade, uf) VALUES ('Jardim Paulista',  'São Paulo', 'SP');

-- Órgãos responsáveis -------------------------------------------------
INSERT INTO orgao (nome, telefone, email) VALUES ('Ilume / Subprefeitura',                 '156', 'ilume@prefeitura.sp.gov.br');
INSERT INTO orgao (nome, telefone, email) VALUES ('Subprefeitura - Zeladoria',             '156', 'zeladoria@prefeitura.sp.gov.br');
INSERT INTO orgao (nome, telefone, email) VALUES ('Secretaria da Pessoa com Deficiência',  '156', 'smped@prefeitura.sp.gov.br');
INSERT INTO orgao (nome, telefone, email) VALUES ('Limpeza Urbana',                        '156', 'limpeza@prefeitura.sp.gov.br');
INSERT INTO orgao (nome, telefone, email) VALUES ('Companhia de Saneamento',               '195', 'atendimento@saneamento.sp.gov.br');
INSERT INTO orgao (nome, telefone, email) VALUES ('Meio Ambiente',                         '156', 'verde@prefeitura.sp.gov.br');
INSERT INTO orgao (nome, telefone, email) VALUES ('Engenharia de Tráfego',                 '1188','cet@prefeitura.sp.gov.br');
INSERT INTO orgao (nome, telefone, email) VALUES ('Defesa Civil / Drenagem',               '199', 'defesacivil@prefeitura.sp.gov.br');

-- Categorias (mesmos códigos, SLA e pesos do app) --------------------
INSERT INTO categoria (codigo, nome, sla_dias, peso_risco, id_orgao)
  SELECT 'ILUMINACAO',  'Iluminação pública',       3, 25, id_orgao FROM orgao WHERE nome = 'Ilume / Subprefeitura';
INSERT INTO categoria (codigo, nome, sla_dias, peso_risco, id_orgao)
  SELECT 'BURACO',      'Buraco na via',            7, 25, id_orgao FROM orgao WHERE nome = 'Subprefeitura - Zeladoria';
INSERT INTO categoria (codigo, nome, sla_dias, peso_risco, id_orgao)
  SELECT 'CALCADA',     'Calçada / Acessibilidade', 10, 20, id_orgao FROM orgao WHERE nome = 'Secretaria da Pessoa com Deficiência';
INSERT INTO categoria (codigo, nome, sla_dias, peso_risco, id_orgao)
  SELECT 'LIXO',        'Lixo / Entulho',           2, 15, id_orgao FROM orgao WHERE nome = 'Limpeza Urbana';
INSERT INTO categoria (codigo, nome, sla_dias, peso_risco, id_orgao)
  SELECT 'AGUA',        'Vazamento de água',        1, 30, id_orgao FROM orgao WHERE nome = 'Companhia de Saneamento';
INSERT INTO categoria (codigo, nome, sla_dias, peso_risco, id_orgao)
  SELECT 'ARVORE',      'Árvore / Poda',            15, 20, id_orgao FROM orgao WHERE nome = 'Meio Ambiente';
INSERT INTO categoria (codigo, nome, sla_dias, peso_risco, id_orgao)
  SELECT 'SINALIZACAO', 'Sinalização / Semáforo',   2, 30, id_orgao FROM orgao WHERE nome = 'Engenharia de Tráfego';
INSERT INTO categoria (codigo, nome, sla_dias, peso_risco, id_orgao)
  SELECT 'ALAGAMENTO',  'Alagamento / Bueiro',      2, 35, id_orgao FROM orgao WHERE nome = 'Defesa Civil / Drenagem';

-- Palavras-chave de risco (triagem automática) ------------------------
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('FIO',        'ELETRICO',     30);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('FIACAO',     'ELETRICO',     30);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('CHOQUE',     'ELETRICO',     30);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('ACIDENTE',   'ACIDENTE',     25);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('QUEDA',      'ACIDENTE',     25);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('FERIDO',     'ACIDENTE',     25);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('ESCOLA',     'LOCAL_SENSIVEL', 15);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('CRECHE',     'LOCAL_SENSIVEL', 15);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('HOSPITAL',   'LOCAL_SENSIVEL', 15);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('UBS',        'LOCAL_SENSIVEL', 15);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('CRIANCA',    'VULNERAVEL',   15);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('IDOSO',      'VULNERAVEL',   15);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('CADEIRANTE', 'VULNERAVEL',   15);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('ESCURO',     'SEGURANCA',    12);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('ASSALTO',    'SEGURANCA',    12);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('PERIGO',     'SEGURANCA',    12);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('ALAGA',      'CLIMA',        20);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('ENCHENTE',   'CLIMA',        20);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('DESLIZ',     'CLIMA',        20);
INSERT INTO palavra_chave_risco (termo, grupo, peso) VALUES ('URGENTE',    'GRAVIDADE',     8);

-- Cidadãos --------------------------------------------------------------
INSERT INTO cidadao (nome, email, telefone, id_bairro, necessidade_acess, fonte_grande)
  SELECT 'Maria Souza', 'maria.souza@email.com', '11988887777', id_bairro, 'S', 'S' FROM bairro WHERE nome = 'Bela Vista';
INSERT INTO cidadao (nome, email, telefone, id_bairro)
  SELECT 'João Lima', 'joao.lima@email.com', '11977776666', id_bairro FROM bairro WHERE nome = 'Bela Vista';
INSERT INTO cidadao (nome, email, telefone, id_bairro)
  SELECT 'Ana Pereira', 'ana.pereira@email.com', '11966665555', id_bairro FROM bairro WHERE nome = 'Consolação';
INSERT INTO cidadao (nome, email, telefone, id_bairro, alto_contraste)
  SELECT 'Carlos Mendes', 'carlos.mendes@email.com', '11955554444', id_bairro, 'S' FROM bairro WHERE nome = 'Cerqueira César';
INSERT INTO cidadao (nome, email, telefone, id_bairro)
  SELECT 'Beatriz Rocha', 'beatriz.rocha@email.com', NULL, id_bairro FROM bairro WHERE nome = 'Jardim Paulista';
COMMIT;

-- Ocorrências: registradas pela PROCEDURE (mesmo caminho usado pela API) --
DECLARE
  v_id    ocorrencia.id_ocorrencia%TYPE;
  v_prot  ocorrencia.protocolo%TYPE;
  v_msg   VARCHAR2(400);

  FUNCTION cid(p_email VARCHAR2) RETURN NUMBER IS
    v NUMBER;
  BEGIN
    SELECT id_cidadao INTO v FROM cidadao WHERE email = p_email;
    RETURN v;
  END;
BEGIN
  pkg_bairro_ativo.prc_registrar_ocorrencia(cid('maria.souza@email.com'), 'CALCADA',
    'Calçada quebrada e com degrau alto, cadeirante não consegue passar. Perto da UBS.',
    'R. Treze de Maio, 1200 - Bela Vista', -23.563800, -46.646300, NULL, 'S', 'N', v_id, v_prot, v_msg);
  DBMS_OUTPUT.PUT_LINE(v_msg);

  pkg_bairro_ativo.prc_registrar_ocorrencia(cid('joao.lima@email.com'), 'ILUMINACAO',
    'Três postes apagados, trecho muito escuro e com relatos de assalto à noite.',
    'R. Frei Caneca, 820 - Consolação', -23.555200, -46.653900, NULL, 'N', 'N', v_id, v_prot, v_msg);
  DBMS_OUTPUT.PUT_LINE(v_msg);

  pkg_bairro_ativo.prc_registrar_ocorrencia(cid('ana.pereira@email.com'), 'ALAGAMENTO',
    'Bueiro entupido, a rua alaga sempre que chove e a água entra nas casas.',
    'R. Santo Antônio, 90 - Bixiga', -23.556900, -46.643000, NULL, 'N', 'N', v_id, v_prot, v_msg);
  DBMS_OUTPUT.PUT_LINE(v_msg);

  pkg_bairro_ativo.prc_registrar_ocorrencia(cid('carlos.mendes@email.com'), 'BURACO',
    'Buraco grande na faixa da direita, motos desviando bruscamente. Risco de acidente.',
    'Al. Santos, 455 - Cerqueira César', -23.567900, -46.648900, NULL, 'N', 'N', v_id, v_prot, v_msg);
  DBMS_OUTPUT.PUT_LINE(v_msg);

  pkg_bairro_ativo.prc_registrar_ocorrencia(cid('beatriz.rocha@email.com'), 'AGUA',
    'Vazamento de água limpa há dois dias, desperdício enorme.',
    'R. Augusta, 1508 - Consolação', -23.558500, -46.658100, NULL, 'N', 'N', v_id, v_prot, v_msg);
  DBMS_OUTPUT.PUT_LINE(v_msg);

  pkg_bairro_ativo.prc_registrar_ocorrencia(cid('maria.souza@email.com'), 'SINALIZACAO',
    'Semáforo de pedestres quebrado em frente à escola, crianças atravessando sem sinal.',
    'Av. Brigadeiro Luís Antônio, 2000', -23.568200, -46.648700, NULL, 'S', 'N', v_id, v_prot, v_msg);
  DBMS_OUTPUT.PUT_LINE(v_msg);

  pkg_bairro_ativo.prc_registrar_ocorrencia(cid('joao.lima@email.com'), 'LIXO',
    'Entulho de obra descartado na calçada bloqueando a passagem.',
    'R. Pamplona, 300 - Jardim Paulista', -23.566100, -46.655100, NULL, 'S', 'N', v_id, v_prot, v_msg);
  DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/

-- Simula a passagem do tempo: algumas ocorrências foram abertas há dias
-- (permite demonstrar atrasos, escalonamento e indicadores).
UPDATE ocorrencia SET dt_abertura = SYSDATE - 12, dt_prazo = SYSDATE - 2
 WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'CALCADA');
UPDATE ocorrencia SET dt_abertura = SYSDATE - 0.5, dt_prazo = SYSDATE + 0.5
 WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'AGUA');
UPDATE ocorrencia SET dt_abertura = SYSDATE - 8,  dt_prazo = SYSDATE - 5
 WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'ILUMINACAO');
UPDATE ocorrencia SET dt_abertura = SYSDATE - 15, dt_prazo = SYSDATE - 13
 WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'LIXO');
UPDATE historico_status h SET dt_evento = (SELECT o.dt_abertura FROM ocorrencia o WHERE o.id_ocorrencia = h.id_ocorrencia);
COMMIT;

PROMPT >>> 04_dml_carga.sql executado com sucesso.

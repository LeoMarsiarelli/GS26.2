-- =====================================================================
--  BairroAtivo - Script 05 - Demonstração das rotinas + Job agendado
--  Roteiro usado no vídeo técnico: mostra cada automação funcionando.
-- =====================================================================
SET DEFINE OFF
SET SERVEROUTPUT ON SIZE UNLIMITED
SET LINESIZE 200
SET PAGESIZE 100

PROMPT
PROMPT ===== 1) Triagem automática: função de pontuação =====
SELECT c.codigo,
       pkg_bairro_ativo.fn_calcular_pontuacao(c.id_categoria,
         'Poste apagado em frente à escola, rua escura e perigosa', 'N') AS pontos,
       pkg_bairro_ativo.fn_prioridade(
         pkg_bairro_ativo.fn_calcular_pontuacao(c.id_categoria,
           'Poste apagado em frente à escola, rua escura e perigosa', 'N')) AS prioridade
  FROM categoria c
 WHERE c.codigo = 'ILUMINACAO';

PROMPT
PROMPT ===== 2) Registro com detecção de duplicidade (vira APOIO) =====
DECLARE
  v_id   NUMBER;
  v_prot VARCHAR2(20);
  v_msg  VARCHAR2(400);
  v_cid  NUMBER;
BEGIN
  SELECT id_cidadao INTO v_cid FROM cidadao WHERE email = 'joao.lima@email.com';
  -- Mesmo problema de calçada registrado pela Maria, a ~20 m de distância:
  pkg_bairro_ativo.prc_registrar_ocorrencia(v_cid, 'CALCADA',
    'Degrau enorme na calçada, minha mãe idosa quase caiu.',
    'R. Treze de Maio, 1210', -23.563900, -46.646400, NULL, 'S', 'N', v_id, v_prot, v_msg);
  DBMS_OUTPUT.PUT_LINE('Resultado: ' || v_msg);
END;
/
SELECT protocolo, qtd_apoios, pontuacao, prioridade FROM ocorrencia
 WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'CALCADA');

PROMPT
PROMPT ===== 3) Apoios de vários cidadãos elevam a prioridade =====
DECLARE
  v_msg VARCHAR2(200);
  v_oc  NUMBER;
BEGIN
  SELECT id_ocorrencia INTO v_oc FROM ocorrencia
   WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'ALAGAMENTO');
  FOR c IN (SELECT id_cidadao FROM cidadao) LOOP
    pkg_bairro_ativo.prc_registrar_apoio(v_oc, c.id_cidadao, v_msg);
    DBMS_OUTPUT.PUT_LINE('Cidadão ' || c.id_cidadao || ': ' || v_msg);
  END LOOP;
END;
/
SELECT protocolo, qtd_apoios, pontuacao, prioridade FROM ocorrencia
 WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'ALAGAMENTO');

PROMPT
PROMPT ===== 4) Fluxo de atendimento + histórico automático =====
DECLARE
  v_oc NUMBER;
BEGIN
  SELECT id_ocorrencia INTO v_oc FROM ocorrencia
   WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'AGUA');
  pkg_bairro_ativo.prc_atualizar_status(v_oc, 'EM_ANALISE',  'Vistoria agendada pela concessionária.');
  pkg_bairro_ativo.prc_atualizar_status(v_oc, 'EM_EXECUCAO', 'Equipe 12 no local.');
  pkg_bairro_ativo.prc_atualizar_status(v_oc, 'RESOLVIDA',   'Tubulação substituída.');

  SELECT id_ocorrencia INTO v_oc FROM ocorrencia
   WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'LIXO');
  pkg_bairro_ativo.prc_atualizar_status(v_oc, 'RESOLVIDA', 'Entulho recolhido.');

  SELECT id_ocorrencia INTO v_oc FROM ocorrencia
   WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'BURACO');
  pkg_bairro_ativo.prc_atualizar_status(v_oc, 'EM_ANALISE');
END;
/
COLUMN observacao FORMAT A45
SELECT o.protocolo, h.status_anterior, h.status_novo, h.observacao,
       TO_CHAR(h.dt_evento, 'DD/MM HH24:MI') AS quando
  FROM historico_status h JOIN ocorrencia o ON o.id_ocorrencia = h.id_ocorrencia
 WHERE o.id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'AGUA')
 ORDER BY h.id_historico;

PROMPT
PROMPT ===== 5) Regras de negócio protegidas (erros esperados) =====
DECLARE
  v_oc NUMBER;
BEGIN
  SELECT id_ocorrencia INTO v_oc FROM ocorrencia
   WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'AGUA');
  pkg_bairro_ativo.prc_atualizar_status(v_oc, 'ABERTA');
EXCEPTION
  WHEN pkg_bairro_ativo.e_transicao_invalida THEN
    DBMS_OUTPUT.PUT_LINE('OK - bloqueado: ' || SQLERRM);
END;
/
DECLARE
  v_oc NUMBER; v_cid NUMBER;
BEGIN
  SELECT id_ocorrencia, id_cidadao INTO v_oc, v_cid FROM ocorrencia
   WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'BURACO');
  pkg_bairro_ativo.prc_avaliar(v_oc, v_cid, 5);
EXCEPTION
  WHEN pkg_bairro_ativo.e_avaliacao_nao_permit THEN
    DBMS_OUTPUT.PUT_LINE('OK - bloqueado: ' || SQLERRM);
END;
/

PROMPT
PROMPT ===== 6) Avaliação do atendimento =====
DECLARE
  v_oc NUMBER; v_cid NUMBER;
BEGIN
  SELECT id_ocorrencia, id_cidadao INTO v_oc, v_cid FROM ocorrencia
   WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'AGUA');
  pkg_bairro_ativo.prc_avaliar(v_oc, v_cid, 5, 'Resolveram no mesmo dia!');
  SELECT id_ocorrencia, id_cidadao INTO v_oc, v_cid FROM ocorrencia
   WHERE id_categoria = (SELECT id_categoria FROM categoria WHERE codigo = 'LIXO');
  pkg_bairro_ativo.prc_avaliar(v_oc, v_cid, 2, 'Demorou bastante.');
  DBMS_OUTPUT.PUT_LINE('Avaliações registradas.');
END;
/

PROMPT
PROMPT ===== 7) Escalonamento automático de atrasos (BULK COLLECT/FORALL) =====
DECLARE
  v_qtd NUMBER;
BEGIN
  pkg_bairro_ativo.prc_recalcular_prioridades(v_qtd);
  pkg_bairro_ativo.prc_relatorio_atrasadas;
END;
/

PROMPT
PROMPT ===== 8) Indicadores por bairro =====
EXEC pkg_bairro_ativo.prc_gerar_indicadores;
SELECT b.nome AS bairro, pkg_bairro_ativo.fn_indice_zeladoria(b.id_bairro) AS indice FROM bairro b ORDER BY 2 DESC NULLS LAST;
SELECT * FROM vw_ranking_categorias ORDER BY total DESC;

PROMPT
PROMPT ===== 9) Distância (Haversine) entre ocorrências =====
SELECT a.protocolo AS origem, b.protocolo AS destino,
       ROUND(pkg_bairro_ativo.fn_distancia_km(a.latitude, a.longitude, b.latitude, b.longitude) * 1000) AS metros
  FROM ocorrencia a CROSS JOIN ocorrencia b
 WHERE a.id_ocorrencia < b.id_ocorrencia
 ORDER BY metros
 FETCH FIRST 5 ROWS ONLY;

PROMPT
PROMPT ===== 10) Log de erros gravado em transação autônoma =====
COLUMN mensagem FORMAT A80
SELECT rotina, codigo_erro, mensagem FROM log_erro ORDER BY id_log;

PROMPT
PROMPT ===== 11) Job diário (DBMS_SCHEDULER) =====
BEGIN
  DBMS_SCHEDULER.DROP_JOB('JOB_BAIRRO_ATIVO_DIARIO', force => TRUE);
EXCEPTION
  WHEN OTHERS THEN NULL; -- job ainda não existe
END;
/
BEGIN
  DBMS_SCHEDULER.CREATE_JOB(
    job_name        => 'JOB_BAIRRO_ATIVO_DIARIO',
    job_type        => 'PLSQL_BLOCK',
    job_action      => 'DECLARE v NUMBER; BEGIN pkg_bairro_ativo.prc_recalcular_prioridades(v); pkg_bairro_ativo.prc_gerar_indicadores; END;',
    start_date      => SYSTIMESTAMP,
    repeat_interval => 'FREQ=DAILY; BYHOUR=6; BYMINUTE=0',
    enabled         => TRUE,
    comments        => 'BairroAtivo: escalona atrasos e consolida indicadores diariamente às 06h');
  DBMS_OUTPUT.PUT_LINE('Job JOB_BAIRRO_ATIVO_DIARIO criado.');
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Aviso: não foi possível criar o job (privilégio CREATE JOB?): ' || SQLERRM);
END;
/

PROMPT >>> 05_testes_e_job.sql executado com sucesso.

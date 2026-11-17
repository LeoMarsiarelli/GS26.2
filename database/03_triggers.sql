-- =====================================================================
--  BairroAtivo - Script 03 - Triggers de automação
-- =====================================================================
SET DEFINE OFF

-- ---------------------------------------------------------------------
-- TRG_OCORRENCIA_BIU
--  INSERT: gera protocolo (se ausente), calcula prazo pelo SLA da
--          categoria, força status inicial e calcula a triagem.
--  UPDATE: sincroniza prioridade com a pontuação, impede retrocesso de
--          status e registra/limpa a data de resolução.
-- ---------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_ocorrencia_biu
BEFORE INSERT OR UPDATE ON ocorrencia
FOR EACH ROW
DECLARE
  v_sla categoria.sla_dias%TYPE;
BEGIN
  IF INSERTING THEN
    -- IF explícito (NVL avaliaria a função sempre, consumindo a sequence à toa)
    IF :NEW.protocolo IS NULL THEN
      :NEW.protocolo := pkg_bairro_ativo.fn_gerar_protocolo;
    END IF;
    :NEW.dt_abertura := NVL(:NEW.dt_abertura, SYSDATE);
    :NEW.status      := 'ABERTA';
    :NEW.qtd_apoios  := 0;

    SELECT sla_dias INTO v_sla FROM categoria WHERE id_categoria = :NEW.id_categoria;
    :NEW.dt_prazo := :NEW.dt_abertura + v_sla;

    :NEW.pontuacao := pkg_bairro_ativo.fn_calcular_pontuacao(
                        :NEW.id_categoria, :NEW.descricao, :NEW.afeta_acess, 0, 0);
  END IF;

  IF UPDATING('STATUS') AND :NEW.status <> :OLD.status THEN
    IF pkg_bairro_ativo.fn_ordem_status(:NEW.status) < pkg_bairro_ativo.fn_ordem_status(:OLD.status) THEN
      RAISE_APPLICATION_ERROR(-20011, 'Não é permitido retroceder o status de '
                              || :OLD.status || ' para ' || :NEW.status || '.');
    END IF;
    IF :NEW.status = 'RESOLVIDA' THEN
      :NEW.dt_resolucao := SYSDATE;
    END IF;
  END IF;

  :NEW.prioridade := pkg_bairro_ativo.fn_prioridade(:NEW.pontuacao);
END;
/

-- ---------------------------------------------------------------------
-- TRG_OCORRENCIA_HIST
--  Grava automaticamente a linha do tempo (HISTORICO_STATUS) na abertura
--  e a cada mudança de status. A observação vem da variável de pacote
--  preenchida pelas procedures, com texto padrão quando ausente.
-- ---------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_ocorrencia_hist
AFTER INSERT OR UPDATE OF status ON ocorrencia
FOR EACH ROW
WHEN (OLD.status IS NULL OR NEW.status <> OLD.status)
DECLARE
  v_obs historico_status.observacao%TYPE;
BEGIN
  v_obs := NVL(pkg_bairro_ativo.gv_observacao,
               CASE :NEW.status
                 WHEN 'ABERTA'      THEN 'Ocorrência registrada.'
                 WHEN 'EM_ANALISE'  THEN 'Equipe técnica analisando a solicitação.'
                 WHEN 'EM_EXECUCAO' THEN 'Equipe de campo designada. Serviço em andamento.'
                 WHEN 'RESOLVIDA'   THEN 'Serviço concluído. Avalie o atendimento!'
               END);

  INSERT INTO historico_status (id_ocorrencia, status_anterior, status_novo, observacao)
  VALUES (:NEW.id_ocorrencia, :OLD.status, :NEW.status, v_obs);
END;
/

-- ---------------------------------------------------------------------
-- TRG_APOIO_AI
--  Cada novo apoio incrementa o contador e recalcula a pontuação da
--  ocorrência (impacto coletivo eleva a prioridade).
-- ---------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_apoio_ai
AFTER INSERT ON apoio
FOR EACH ROW
BEGIN
  UPDATE ocorrencia o
     SET o.qtd_apoios = o.qtd_apoios + 1,
         o.pontuacao  = pkg_bairro_ativo.fn_calcular_pontuacao(
                          o.id_categoria, o.descricao, o.afeta_acess, o.qtd_apoios + 1,
                          pkg_bairro_ativo.fn_dias_atraso(o.dt_prazo, o.status))
   WHERE o.id_ocorrencia = :NEW.id_ocorrencia;
END;
/

-- ---------------------------------------------------------------------
-- TRG_AVALIACAO_BI
--  Garante que só ocorrências RESOLVIDAS sejam avaliadas.
-- ---------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_avaliacao_biu
BEFORE INSERT OR UPDATE ON avaliacao
FOR EACH ROW
DECLARE
  v_status ocorrencia.status%TYPE;
BEGIN
  SELECT status INTO v_status FROM ocorrencia WHERE id_ocorrencia = :NEW.id_ocorrencia;
  IF v_status <> 'RESOLVIDA' THEN
    RAISE_APPLICATION_ERROR(-20030, 'A avaliação só é permitida após a resolução da ocorrência.');
  END IF;
END;
/

-- ---------------------------------------------------------------------
-- TRG_CIDADAO_BIU
--  Padroniza e-mail (minúsculas, sem espaços) para evitar duplicidades.
-- ---------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_cidadao_biu
BEFORE INSERT OR UPDATE OF email ON cidadao
FOR EACH ROW
BEGIN
  :NEW.email := LOWER(TRIM(:NEW.email));
END;
/

SHOW ERRORS
PROMPT >>> 03_triggers.sql executado com sucesso.

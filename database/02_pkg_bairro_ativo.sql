-- =====================================================================
--  BairroAtivo - Script 02 - Pacote PL/SQL PKG_BAIRRO_ATIVO
--  Automatiza: registro de ocorrências (com triagem e anti-duplicidade),
--  apoio comunitário, fluxo de status, avaliação, escalonamento de
--  atrasos e geração de indicadores por bairro.
-- =====================================================================
SET DEFINE OFF
SET SERVEROUTPUT ON

CREATE OR REPLACE PACKAGE pkg_bairro_ativo AS

  -- Constantes de negócio ---------------------------------------------
  c_raio_duplicidade_km CONSTANT NUMBER := 0.15;  -- 150 metros
  c_bonus_acess         CONSTANT NUMBER := 15;

  -- Observação usada pela trigger de histórico (preenchida pelas procedures)
  gv_observacao VARCHAR2(300);

  -- Exceções de negócio -----------------------------------------------
  e_cidadao_inexistente   EXCEPTION;  PRAGMA EXCEPTION_INIT(e_cidadao_inexistente,   -20001);
  e_categoria_inexistente EXCEPTION;  PRAGMA EXCEPTION_INIT(e_categoria_inexistente, -20002);
  e_descricao_curta       EXCEPTION;  PRAGMA EXCEPTION_INIT(e_descricao_curta,       -20003);
  e_ocorrencia_inexist    EXCEPTION;  PRAGMA EXCEPTION_INIT(e_ocorrencia_inexist,    -20010);
  e_transicao_invalida    EXCEPTION;  PRAGMA EXCEPTION_INIT(e_transicao_invalida,    -20011);
  e_ocorrencia_encerrada  EXCEPTION;  PRAGMA EXCEPTION_INIT(e_ocorrencia_encerrada,  -20012);
  e_avaliacao_nao_permit  EXCEPTION;  PRAGMA EXCEPTION_INIT(e_avaliacao_nao_permit,  -20030);

  -- Funções -----------------------------------------------------------
  /** Distância em km entre dois pontos (fórmula de Haversine). */
  FUNCTION fn_distancia_km (p_lat1 NUMBER, p_lon1 NUMBER, p_lat2 NUMBER, p_lon2 NUMBER) RETURN NUMBER DETERMINISTIC;

  /** Remove acentos e coloca em maiúsculas (normalização para a triagem). */
  FUNCTION fn_normalizar (p_texto VARCHAR2) RETURN VARCHAR2 DETERMINISTIC;

  /** Dias de atraso em relação ao prazo (0 se resolvida ou no prazo). */
  FUNCTION fn_dias_atraso (p_dt_prazo DATE, p_status VARCHAR2) RETURN NUMBER;

  /** Pontuação de urgência 0..100 (triagem automática). */
  FUNCTION fn_calcular_pontuacao (p_id_categoria NUMBER, p_descricao VARCHAR2, p_afeta_acess CHAR,
                                  p_qtd_apoios NUMBER DEFAULT 0, p_dias_atraso NUMBER DEFAULT 0) RETURN NUMBER;

  /** Converte pontuação em prioridade (BAIXA/MEDIA/ALTA/CRITICA). */
  FUNCTION fn_prioridade (p_pontuacao NUMBER) RETURN VARCHAR2 DETERMINISTIC;

  /** Ordem numérica do status no fluxo de atendimento. */
  FUNCTION fn_ordem_status (p_status VARCHAR2) RETURN NUMBER DETERMINISTIC;

  /** Gera o próximo número de protocolo (BA-AAAA-NNNNNN). */
  FUNCTION fn_gerar_protocolo RETURN VARCHAR2;

  /** Índice de Zeladoria (0..100) de um bairro. */
  FUNCTION fn_indice_zeladoria (p_id_bairro NUMBER) RETURN NUMBER;

  -- Procedures --------------------------------------------------------
  PROCEDURE prc_registrar_ocorrencia (
    p_id_cidadao      IN  NUMBER,
    p_codigo_categ    IN  VARCHAR2,
    p_descricao       IN  VARCHAR2,
    p_endereco        IN  VARCHAR2,
    p_latitude        IN  NUMBER,
    p_longitude       IN  NUMBER,
    p_foto_url        IN  VARCHAR2 DEFAULT NULL,
    p_afeta_acess     IN  CHAR     DEFAULT 'N',
    p_forcar          IN  CHAR     DEFAULT 'N',
    o_id_ocorrencia   OUT NUMBER,
    o_protocolo       OUT VARCHAR2,
    o_mensagem        OUT VARCHAR2);

  PROCEDURE prc_registrar_apoio (p_id_ocorrencia IN NUMBER, p_id_cidadao IN NUMBER, o_mensagem OUT VARCHAR2);

  PROCEDURE prc_remover_apoio (p_id_ocorrencia IN NUMBER, p_id_cidadao IN NUMBER);

  PROCEDURE prc_atualizar_status (p_id_ocorrencia IN NUMBER, p_novo_status IN VARCHAR2, p_observacao IN VARCHAR2 DEFAULT NULL);

  PROCEDURE prc_avaliar (p_id_ocorrencia IN NUMBER, p_id_cidadao IN NUMBER, p_nota IN NUMBER, p_comentario IN VARCHAR2 DEFAULT NULL);

  PROCEDURE prc_recalcular_prioridades (o_qtd_atualizadas OUT NUMBER);

  PROCEDURE prc_gerar_indicadores (p_dt_referencia IN DATE DEFAULT TRUNC(SYSDATE));

  PROCEDURE prc_relatorio_atrasadas;

  PROCEDURE prc_log_erro (p_rotina VARCHAR2, p_codigo NUMBER, p_mensagem VARCHAR2, p_parametros VARCHAR2 DEFAULT NULL);

END pkg_bairro_ativo;
/

CREATE OR REPLACE PACKAGE BODY pkg_bairro_ativo AS

  -- ===================================================================
  -- LOG DE ERROS (transação autônoma: grava mesmo se o chamador der ROLLBACK)
  -- ===================================================================
  PROCEDURE prc_log_erro (p_rotina VARCHAR2, p_codigo NUMBER, p_mensagem VARCHAR2, p_parametros VARCHAR2 DEFAULT NULL) IS
    PRAGMA AUTONOMOUS_TRANSACTION;
  BEGIN
    INSERT INTO log_erro (rotina, codigo_erro, mensagem, parametros)
    VALUES (p_rotina, p_codigo, SUBSTR(p_mensagem, 1, 4000), SUBSTR(p_parametros, 1, 1000));
    COMMIT;
  END prc_log_erro;

  -- ===================================================================
  -- FUNÇÕES
  -- ===================================================================
  FUNCTION fn_distancia_km (p_lat1 NUMBER, p_lon1 NUMBER, p_lat2 NUMBER, p_lon2 NUMBER) RETURN NUMBER DETERMINISTIC IS
    c_raio CONSTANT NUMBER := 6371;
    c_rad  CONSTANT NUMBER := ACOS(-1) / 180;
    v_dlat NUMBER := (p_lat2 - p_lat1) * c_rad;
    v_dlon NUMBER := (p_lon2 - p_lon1) * c_rad;
    v_h    NUMBER;
  BEGIN
    v_h := POWER(SIN(v_dlat / 2), 2)
         + COS(p_lat1 * c_rad) * COS(p_lat2 * c_rad) * POWER(SIN(v_dlon / 2), 2);
    RETURN 2 * c_raio * ASIN(LEAST(1, SQRT(v_h)));
  END fn_distancia_km;

  FUNCTION fn_normalizar (p_texto VARCHAR2) RETURN VARCHAR2 DETERMINISTIC IS
  BEGIN
    RETURN UPPER(TRANSLATE(p_texto,
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'));
  END fn_normalizar;

  FUNCTION fn_dias_atraso (p_dt_prazo DATE, p_status VARCHAR2) RETURN NUMBER IS
  BEGIN
    IF p_status = 'RESOLVIDA' OR SYSDATE <= p_dt_prazo THEN
      RETURN 0;
    END IF;
    RETURN TRUNC(SYSDATE - p_dt_prazo);
  END fn_dias_atraso;

  FUNCTION fn_prioridade (p_pontuacao NUMBER) RETURN VARCHAR2 DETERMINISTIC IS
  BEGIN
    RETURN CASE
             WHEN p_pontuacao >= 75 THEN 'CRITICA'
             WHEN p_pontuacao >= 50 THEN 'ALTA'
             WHEN p_pontuacao >= 30 THEN 'MEDIA'
             ELSE 'BAIXA'
           END;
  END fn_prioridade;

  FUNCTION fn_ordem_status (p_status VARCHAR2) RETURN NUMBER DETERMINISTIC IS
  BEGIN
    RETURN CASE p_status
             WHEN 'ABERTA'      THEN 0
             WHEN 'EM_ANALISE'  THEN 1
             WHEN 'EM_EXECUCAO' THEN 2
             WHEN 'RESOLVIDA'   THEN 3
           END;
  END fn_ordem_status;

  /*
   * Triagem automática (mesma regra do app - src/services/triagem.ts):
   *   peso da categoria
   * + maior peso de palavra-chave encontrada em CADA grupo de risco
   * + 15 se afeta acessibilidade
   * + 2 por apoio (máx. 20)
   * + 3 por dia de atraso (máx. 15)
   * limitado a 100.
   */
  FUNCTION fn_calcular_pontuacao (p_id_categoria NUMBER, p_descricao VARCHAR2, p_afeta_acess CHAR,
                                  p_qtd_apoios NUMBER DEFAULT 0, p_dias_atraso NUMBER DEFAULT 0) RETURN NUMBER IS
    v_peso_cat   categoria.peso_risco%TYPE;
    v_peso_texto NUMBER := 0;
    v_texto      VARCHAR2(600) := fn_normalizar(p_descricao);
  BEGIN
    SELECT peso_risco INTO v_peso_cat FROM categoria WHERE id_categoria = p_id_categoria;

    SELECT NVL(SUM(max_peso), 0)
      INTO v_peso_texto
      FROM (SELECT MAX(peso) AS max_peso
              FROM palavra_chave_risco
             WHERE INSTR(v_texto, termo) > 0
             GROUP BY grupo);

    RETURN LEAST(100,
             v_peso_cat
           + v_peso_texto
           + CASE WHEN p_afeta_acess = 'S' THEN c_bonus_acess ELSE 0 END
           + LEAST(20, NVL(p_qtd_apoios, 0) * 2)
           + LEAST(15, NVL(p_dias_atraso, 0) * 3));
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20002, 'Categoria ' || p_id_categoria || ' não encontrada.');
  END fn_calcular_pontuacao;

  FUNCTION fn_gerar_protocolo RETURN VARCHAR2 IS
  BEGIN
    RETURN 'BA-' || TO_CHAR(SYSDATE, 'YYYY') || '-' || LPAD(seq_protocolo.NEXTVAL, 6, '0');
  END fn_gerar_protocolo;

  /*
   * Índice de Zeladoria = 50% taxa de resolução + 30% % resolvidas no prazo
   *                     + 20% satisfação média (nota/5; 3 se não houver notas).
   */
  FUNCTION fn_indice_zeladoria (p_id_bairro NUMBER) RETURN NUMBER IS
    v_total      NUMBER;
    v_resolvidas NUMBER;
    v_no_prazo   NUMBER;
    v_satisf     NUMBER;
  BEGIN
    SELECT COUNT(*),
           SUM(CASE WHEN o.status = 'RESOLVIDA' THEN 1 ELSE 0 END),
           SUM(CASE WHEN o.status = 'RESOLVIDA' AND o.dt_resolucao <= o.dt_prazo THEN 1 ELSE 0 END),
           AVG(a.nota)
      INTO v_total, v_resolvidas, v_no_prazo, v_satisf
      FROM ocorrencia o
      LEFT JOIN avaliacao a ON a.id_ocorrencia = o.id_ocorrencia
     WHERE o.id_bairro = p_id_bairro;

    IF v_total = 0 THEN
      RETURN NULL;
    END IF;

    RETURN ROUND(100 * ( 0.5 * (v_resolvidas / v_total)
                       + 0.3 * CASE WHEN v_resolvidas > 0 THEN v_no_prazo / v_resolvidas ELSE 0 END
                       + 0.2 * (NVL(v_satisf, 3) / 5)));
  END fn_indice_zeladoria;

  -- ===================================================================
  -- PROCEDURES
  -- ===================================================================

  /*
   * Registra uma ocorrência.
   * 1) valida cidadão, categoria e descrição;
   * 2) procura duplicata (mesma categoria, em aberto, a até 150 m). Se
   *    existir e p_forcar = 'N', registra APOIO na ocorrência existente
   *    em vez de criar outra (evita retrabalho do órgão público);
   * 3) senão insere — a trigger calcula protocolo, prazo e pontuação e
   *    grava o primeiro evento do histórico.
   */
  PROCEDURE prc_registrar_ocorrencia (
    p_id_cidadao      IN  NUMBER,
    p_codigo_categ    IN  VARCHAR2,
    p_descricao       IN  VARCHAR2,
    p_endereco        IN  VARCHAR2,
    p_latitude        IN  NUMBER,
    p_longitude       IN  NUMBER,
    p_foto_url        IN  VARCHAR2 DEFAULT NULL,
    p_afeta_acess     IN  CHAR     DEFAULT 'N',
    p_forcar          IN  CHAR     DEFAULT 'N',
    o_id_ocorrencia   OUT NUMBER,
    o_protocolo       OUT VARCHAR2,
    o_mensagem        OUT VARCHAR2)
  IS
    v_id_bairro    cidadao.id_bairro%TYPE;
    v_id_categoria categoria.id_categoria%TYPE;
    v_orgao        orgao.nome%TYPE;
    v_msg_apoio    VARCHAR2(200);
    -- Pré-filtro por "caixa" de ~220 m usa o índice IX_OCORR_GEO antes do cálculo exato.
    c_delta CONSTANT NUMBER := 0.002;

    CURSOR c_duplicadas (p_categ NUMBER) IS
      SELECT id_ocorrencia, protocolo,
             fn_distancia_km(p_latitude, p_longitude, latitude, longitude) AS dist_km
        FROM ocorrencia
       WHERE id_categoria = p_categ
         AND status <> 'RESOLVIDA'
         AND latitude  BETWEEN p_latitude  - c_delta AND p_latitude  + c_delta
         AND longitude BETWEEN p_longitude - c_delta AND p_longitude + c_delta
       ORDER BY dist_km;
  BEGIN
    -- Validações
    BEGIN
      SELECT id_bairro INTO v_id_bairro FROM cidadao WHERE id_cidadao = p_id_cidadao;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20001, 'Cidadão ' || p_id_cidadao || ' não cadastrado.');
    END;

    BEGIN
      SELECT c.id_categoria, g.nome INTO v_id_categoria, v_orgao
        FROM categoria c JOIN orgao g ON g.id_orgao = c.id_orgao
       WHERE c.codigo = UPPER(p_codigo_categ);
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20002, 'Categoria "' || p_codigo_categ || '" inválida.');
    END;

    IF LENGTH(TRIM(p_descricao)) < 10 THEN
      RAISE_APPLICATION_ERROR(-20003, 'Descreva o problema com pelo menos 10 caracteres.');
    END IF;

    -- Anti-duplicidade
    IF NVL(p_forcar, 'N') = 'N' THEN
      FOR d IN c_duplicadas(v_id_categoria) LOOP
        EXIT WHEN d.dist_km > c_raio_duplicidade_km;
        prc_registrar_apoio(d.id_ocorrencia, p_id_cidadao, v_msg_apoio);
        o_id_ocorrencia := d.id_ocorrencia;
        o_protocolo     := d.protocolo;
        o_mensagem      := 'Já existe a ocorrência ' || d.protocolo || ' a '
                        || ROUND(d.dist_km * 1000) || ' m. ' || v_msg_apoio;
        RETURN;
      END LOOP;
    END IF;

    -- Inserção (trigger TRG_OCORRENCIA_BIU completa os campos calculados)
    gv_observacao := 'Ocorrência registrada e encaminhada para ' || v_orgao || '.';
    INSERT INTO ocorrencia (protocolo, id_cidadao, id_categoria, id_bairro, descricao, endereco,
                            latitude, longitude, foto_url, afeta_acess, dt_prazo)
    VALUES (fn_gerar_protocolo, p_id_cidadao, v_id_categoria, v_id_bairro, TRIM(p_descricao), TRIM(p_endereco),
            p_latitude, p_longitude, p_foto_url, NVL(p_afeta_acess, 'N'), SYSDATE)
    RETURNING id_ocorrencia, protocolo INTO o_id_ocorrencia, o_protocolo;
    gv_observacao := NULL;

    COMMIT;
    o_mensagem := 'Ocorrência ' || o_protocolo || ' registrada com sucesso.';
  EXCEPTION
    WHEN OTHERS THEN
      gv_observacao := NULL;
      ROLLBACK;
      prc_log_erro('PRC_REGISTRAR_OCORRENCIA', SQLCODE, SQLERRM,
                   'cidadao=' || p_id_cidadao || ' categ=' || p_codigo_categ);
      RAISE;
  END prc_registrar_ocorrencia;

  /*
   * "Também me afeta": registra o apoio. A trigger TRG_APOIO_AI atualiza o
   * contador e recalcula a pontuação/prioridade da ocorrência.
   */
  PROCEDURE prc_registrar_apoio (p_id_ocorrencia IN NUMBER, p_id_cidadao IN NUMBER, o_mensagem OUT VARCHAR2) IS
    v_status ocorrencia.status%TYPE;
    v_autor  ocorrencia.id_cidadao%TYPE;
  BEGIN
    BEGIN
      SELECT status, id_cidadao INTO v_status, v_autor FROM ocorrencia WHERE id_ocorrencia = p_id_ocorrencia;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20010, 'Ocorrência ' || p_id_ocorrencia || ' não encontrada.');
    END;

    IF v_status = 'RESOLVIDA' THEN
      RAISE_APPLICATION_ERROR(-20012, 'Ocorrência já resolvida não recebe apoios.');
    END IF;

    IF v_autor = p_id_cidadao THEN
      o_mensagem := 'Você é o autor desta ocorrência.';
      RETURN;
    END IF;

    INSERT INTO apoio (id_ocorrencia, id_cidadao) VALUES (p_id_ocorrencia, p_id_cidadao);
    COMMIT;
    o_mensagem := 'Seu apoio foi registrado e aumentou a prioridade do chamado.';
  EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
      o_mensagem := 'Você já apoia esta ocorrência.';
    WHEN OTHERS THEN
      ROLLBACK;
      prc_log_erro('PRC_REGISTRAR_APOIO', SQLCODE, SQLERRM, 'ocorr=' || p_id_ocorrencia || ' cid=' || p_id_cidadao);
      RAISE;
  END prc_registrar_apoio;

  PROCEDURE prc_remover_apoio (p_id_ocorrencia IN NUMBER, p_id_cidadao IN NUMBER) IS
  BEGIN
    DELETE FROM apoio WHERE id_ocorrencia = p_id_ocorrencia AND id_cidadao = p_id_cidadao;
    IF SQL%ROWCOUNT = 1 THEN
      UPDATE ocorrencia o
         SET o.qtd_apoios = GREATEST(0, o.qtd_apoios - 1),
             o.pontuacao  = fn_calcular_pontuacao(o.id_categoria, o.descricao, o.afeta_acess,
                                                  GREATEST(0, o.qtd_apoios - 1),
                                                  fn_dias_atraso(o.dt_prazo, o.status))
       WHERE o.id_ocorrencia = p_id_ocorrencia;
    END IF;
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      prc_log_erro('PRC_REMOVER_APOIO', SQLCODE, SQLERRM, 'ocorr=' || p_id_ocorrencia);
      RAISE;
  END prc_remover_apoio;

  /*
   * Avança o atendimento. Só permite ir PARA FRENTE no fluxo
   * ABERTA -> EM_ANALISE -> EM_EXECUCAO -> RESOLVIDA (pode pular etapas).
   * O histórico é gravado pela trigger TRG_OCORRENCIA_HIST.
   */
  PROCEDURE prc_atualizar_status (p_id_ocorrencia IN NUMBER, p_novo_status IN VARCHAR2, p_observacao IN VARCHAR2 DEFAULT NULL) IS
    v_atual ocorrencia.status%TYPE;
  BEGIN
    BEGIN
      SELECT status INTO v_atual FROM ocorrencia WHERE id_ocorrencia = p_id_ocorrencia FOR UPDATE;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20010, 'Ocorrência ' || p_id_ocorrencia || ' não encontrada.');
    END;

    IF fn_ordem_status(p_novo_status) IS NULL
       OR fn_ordem_status(p_novo_status) <= fn_ordem_status(v_atual) THEN
      RAISE_APPLICATION_ERROR(-20011, 'Transição inválida: ' || v_atual || ' -> ' || p_novo_status);
    END IF;

    gv_observacao := p_observacao;
    UPDATE ocorrencia SET status = p_novo_status WHERE id_ocorrencia = p_id_ocorrencia;
    gv_observacao := NULL;
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      gv_observacao := NULL;
      ROLLBACK;
      prc_log_erro('PRC_ATUALIZAR_STATUS', SQLCODE, SQLERRM, 'ocorr=' || p_id_ocorrencia || ' novo=' || p_novo_status);
      RAISE;
  END prc_atualizar_status;

  /*
   * Avaliação do atendimento (1 a 5). Só o autor ou um apoiador pode avaliar,
   * e somente após a resolução. MERGE permite corrigir a nota.
   */
  PROCEDURE prc_avaliar (p_id_ocorrencia IN NUMBER, p_id_cidadao IN NUMBER, p_nota IN NUMBER, p_comentario IN VARCHAR2 DEFAULT NULL) IS
    v_envolvido NUMBER;
  BEGIN
    SELECT COUNT(*) INTO v_envolvido
      FROM ocorrencia o
     WHERE o.id_ocorrencia = p_id_ocorrencia
       AND (o.id_cidadao = p_id_cidadao
            OR EXISTS (SELECT 1 FROM apoio a WHERE a.id_ocorrencia = o.id_ocorrencia AND a.id_cidadao = p_id_cidadao));

    IF v_envolvido = 0 THEN
      RAISE_APPLICATION_ERROR(-20030, 'Somente o autor ou apoiadores podem avaliar esta ocorrência.');
    END IF;

    MERGE INTO avaliacao a
    USING (SELECT p_id_ocorrencia AS id_ocorrencia FROM dual) s
       ON (a.id_ocorrencia = s.id_ocorrencia)
     WHEN MATCHED THEN
       UPDATE SET a.nota = p_nota, a.comentario = p_comentario, a.id_cidadao = p_id_cidadao, a.dt_avaliacao = SYSDATE
     WHEN NOT MATCHED THEN
       INSERT (id_ocorrencia, id_cidadao, nota, comentario) VALUES (p_id_ocorrencia, p_id_cidadao, p_nota, p_comentario);
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      prc_log_erro('PRC_AVALIAR', SQLCODE, SQLERRM, 'ocorr=' || p_id_ocorrencia || ' nota=' || p_nota);
      RAISE;
  END prc_avaliar;

  /*
   * Rotina diária (DBMS_SCHEDULER): recalcula a pontuação das ocorrências em
   * aberto considerando os dias de atraso — escalona automaticamente o que
   * está vencido. Usa BULK COLLECT com LIMIT e FORALL para processar em
   * lotes, reduzindo trocas de contexto SQL/PLSQL e o consumo de memória.
   */
  PROCEDURE prc_recalcular_prioridades (o_qtd_atualizadas OUT NUMBER) IS
    TYPE t_ids    IS TABLE OF ocorrencia.id_ocorrencia%TYPE;
    TYPE t_pontos IS TABLE OF ocorrencia.pontuacao%TYPE;
    TYPE t_prios  IS TABLE OF ocorrencia.prioridade%TYPE;

    CURSOR c_abertas IS
      SELECT id_ocorrencia, pontuacao, prioridade,
             fn_calcular_pontuacao(id_categoria, descricao, afeta_acess, qtd_apoios,
                                   fn_dias_atraso(dt_prazo, status)) AS nova_pontuacao
        FROM ocorrencia
       WHERE status <> 'RESOLVIDA';

    v_ids     t_ids;
    v_atual   t_pontos;
    v_prio    t_prios;
    v_nova    t_pontos;
    v_upd_ids t_ids    := t_ids();
    v_upd_pts t_pontos := t_pontos();
    v_escal   PLS_INTEGER := 0;
  BEGIN
    o_qtd_atualizadas := 0;
    OPEN c_abertas;
    LOOP
      FETCH c_abertas BULK COLLECT INTO v_ids, v_atual, v_prio, v_nova LIMIT 500;
      EXIT WHEN v_ids.COUNT = 0;

      v_upd_ids.DELETE;
      v_upd_pts.DELETE;
      FOR i IN 1 .. v_ids.COUNT LOOP
        IF v_nova(i) <> v_atual(i) THEN
          v_upd_ids.EXTEND; v_upd_ids(v_upd_ids.LAST) := v_ids(i);
          v_upd_pts.EXTEND; v_upd_pts(v_upd_pts.LAST) := v_nova(i);
          IF fn_prioridade(v_nova(i)) = 'CRITICA' AND v_prio(i) <> 'CRITICA' THEN
            v_escal := v_escal + 1;
          END IF;
        END IF;
      END LOOP;

      FORALL i IN 1 .. v_upd_ids.COUNT
        UPDATE ocorrencia SET pontuacao = v_upd_pts(i) WHERE id_ocorrencia = v_upd_ids(i);

      o_qtd_atualizadas := o_qtd_atualizadas + v_upd_ids.COUNT;
    END LOOP;
    CLOSE c_abertas;
    COMMIT;

    DBMS_OUTPUT.PUT_LINE('Prioridades recalculadas: ' || o_qtd_atualizadas ||
                         ' | escalonadas para CRÍTICA: ' || v_escal);
  EXCEPTION
    WHEN OTHERS THEN
      IF c_abertas%ISOPEN THEN CLOSE c_abertas; END IF;
      ROLLBACK;
      prc_log_erro('PRC_RECALCULAR_PRIORIDADES', SQLCODE, SQLERRM);
      RAISE;
  END prc_recalcular_prioridades;

  /*
   * Consolida os indicadores de cada bairro em INDICADOR_BAIRRO (MERGE:
   * idempotente, pode rodar várias vezes no mesmo dia) e imprime relatório.
   */
  PROCEDURE prc_gerar_indicadores (p_dt_referencia IN DATE DEFAULT TRUNC(SYSDATE)) IS
    CURSOR c_bairros IS
      SELECT b.id_bairro, b.nome,
             COUNT(o.id_ocorrencia)                                                       AS total,
             SUM(CASE WHEN o.status <> 'RESOLVIDA' THEN 1 ELSE 0 END)                     AS abertas,
             SUM(CASE WHEN o.status = 'RESOLVIDA' THEN 1 ELSE 0 END)                      AS resolvidas,
             SUM(CASE WHEN o.status <> 'RESOLVIDA' AND SYSDATE > o.dt_prazo THEN 1 ELSE 0 END) AS atrasadas,
             SUM(CASE WHEN o.status = 'RESOLVIDA' AND o.dt_resolucao <= o.dt_prazo THEN 1 ELSE 0 END) AS no_prazo,
             AVG(CASE WHEN o.status = 'RESOLVIDA' THEN o.dt_resolucao - o.dt_abertura END) AS tempo_medio,
             AVG(a.nota)                                                                   AS satisfacao
        FROM bairro b
        LEFT JOIN ocorrencia o ON o.id_bairro = b.id_bairro
        LEFT JOIN avaliacao  a ON a.id_ocorrencia = o.id_ocorrencia
       GROUP BY b.id_bairro, b.nome
       ORDER BY b.nome;

    v_taxa    NUMBER;
    v_prazo   NUMBER;
    v_indice  NUMBER;
  BEGIN
    DBMS_OUTPUT.PUT_LINE('==================== INDICADORES ' || TO_CHAR(p_dt_referencia, 'DD/MM/YYYY') || ' ====================');
    DBMS_OUTPUT.PUT_LINE(RPAD('BAIRRO', 20) || LPAD('TOTAL', 6) || LPAD('RESOLV', 8) || LPAD('ATRAS', 7)
                         || LPAD('TAXA%', 7) || LPAD('PRAZO%', 8) || LPAD('NOTA', 6) || LPAD('ÍNDICE', 8));

    FOR r IN c_bairros LOOP
      v_taxa  := CASE WHEN r.total > 0 THEN ROUND(100 * r.resolvidas / r.total, 2) ELSE 0 END;
      v_prazo := CASE WHEN r.resolvidas > 0 THEN ROUND(100 * r.no_prazo / r.resolvidas, 2) ELSE 0 END;
      v_indice := CASE WHEN r.total = 0 THEN 0
                       ELSE ROUND(0.5 * v_taxa + 0.3 * v_prazo + 0.2 * 100 * NVL(r.satisfacao, 3) / 5) END;

      MERGE INTO indicador_bairro i
      USING (SELECT r.id_bairro AS id_bairro, p_dt_referencia AS dt_ref FROM dual) s
         ON (i.id_bairro = s.id_bairro AND i.dt_referencia = s.dt_ref)
       WHEN MATCHED THEN UPDATE SET
            i.total = r.total, i.abertas = r.abertas, i.resolvidas = r.resolvidas, i.atrasadas = r.atrasadas,
            i.taxa_resolucao = v_taxa, i.pct_no_prazo = v_prazo, i.tempo_medio_dias = ROUND(r.tempo_medio, 2),
            i.satisfacao_media = ROUND(r.satisfacao, 2), i.indice_zeladoria = v_indice
       WHEN NOT MATCHED THEN INSERT
            (id_bairro, dt_referencia, total, abertas, resolvidas, atrasadas, taxa_resolucao,
             pct_no_prazo, tempo_medio_dias, satisfacao_media, indice_zeladoria)
            VALUES (r.id_bairro, p_dt_referencia, r.total, r.abertas, r.resolvidas, r.atrasadas, v_taxa,
                    v_prazo, ROUND(r.tempo_medio, 2), ROUND(r.satisfacao, 2), v_indice);

      DBMS_OUTPUT.PUT_LINE(RPAD(r.nome, 20) || LPAD(r.total, 6) || LPAD(r.resolvidas, 8) || LPAD(r.atrasadas, 7)
                           || LPAD(TO_CHAR(v_taxa, 'FM990'), 7) || LPAD(TO_CHAR(v_prazo, 'FM990'), 8)
                           || LPAD(NVL(TO_CHAR(r.satisfacao, 'FM0.0'), '-'), 6) || LPAD(v_indice, 8));
    END LOOP;
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      prc_log_erro('PRC_GERAR_INDICADORES', SQLCODE, SQLERRM);
      RAISE;
  END prc_gerar_indicadores;

  /* Relatório de ocorrências vencidas, da mais urgente para a menos urgente. */
  PROCEDURE prc_relatorio_atrasadas IS
    v_qtd PLS_INTEGER := 0;
  BEGIN
    DBMS_OUTPUT.PUT_LINE('=========== OCORRÊNCIAS FORA DO PRAZO ===========');
    FOR r IN (SELECT protocolo, categoria, endereco, prioridade, pontuacao, dias_atraso, orgao_responsavel
                FROM vw_ocorrencias_abertas
               WHERE dias_atraso > 0
               ORDER BY pontuacao DESC, dias_atraso DESC) LOOP
      v_qtd := v_qtd + 1;
      DBMS_OUTPUT.PUT_LINE(r.protocolo || ' | ' || RPAD(r.categoria, 26) || ' | ' || RPAD(r.prioridade, 7)
                           || ' (' || r.pontuacao || ' pts) | ' || r.dias_atraso || ' dia(s) | ' || r.orgao_responsavel);
    END LOOP;
    IF v_qtd = 0 THEN
      DBMS_OUTPUT.PUT_LINE('Nenhuma ocorrência atrasada.');
    END IF;
  END prc_relatorio_atrasadas;

END pkg_bairro_ativo;
/
SHOW ERRORS PACKAGE BODY pkg_bairro_ativo

PROMPT >>> 02_pkg_bairro_ativo.sql executado com sucesso.

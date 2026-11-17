-- =====================================================================
--  BairroAtivo - Instalação completa (SQL*Plus / SQLcl / SQL Developer F5)
--  Uso:  sqlplus usuario/senha@host:1521/servico @00_instalar_tudo.sql
-- =====================================================================
SET SERVEROUTPUT ON SIZE UNLIMITED
SET ECHO OFF
SET FEEDBACK ON
@@01_ddl.sql
@@02_pkg_bairro_ativo.sql
@@03_triggers.sql
@@04_dml_carga.sql
@@05_testes_e_job.sql

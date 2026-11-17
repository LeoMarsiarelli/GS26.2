=====================================================================
  BAIRROATIVO - Zeladoria urbana colaborativa e acessível
  Global Solution 2 - 2026 | CitizenTech: Tecnologia centrada no cidadão
  Turma: 3SIOA
=====================================================================

INTEGRANTES
---------------------------------------------------------------------
  Nome completo .......................... RM ......
  Nome completo .......................... RM ......
  Nome completo .......................... RM ......
  (preencha com os dados da equipe)

LINKS DE ENTREGA
---------------------------------------------------------------------
  Repositório GitHub ..... https://github.com/LeoMarsiarelli/GS26.2
  Vídeo Pitch de Venda ... ver entregaveis/link_video_pitch_venda.txt
  Vídeo Pitch Técnico .... ver entregaveis/link_video_pitch_tecnico.txt


1. O QUE É
---------------------------------------------------------------------
BairroAtivo é um aplicativo mobile (React Native + Expo) em que o
cidadão registra problemas do bairro (poste apagado, buraco, calçada
quebrada, bueiro entupido, vazamento de água...) em menos de 1 minuto,
com foto e GPS. O app:

  1. Registra a ocorrência com TRIAGEM AUTOMÁTICA de prioridade
     (explicada ao cidadão), prazo (SLA) e órgão responsável;
  2. DETECTA DUPLICIDADE (mesmo problema a até 150 m) e transforma
     reclamações repetidas em APOIO ("Também me afeta"), elevando a
     prioridade do chamado;
  3. Mostra as ocorrências PERTO DE MIM, ordenadas por distância, com
     filtros (raio, situação, categoria, acessibilidade);
  4. Permite ACOMPANHAR o protocolo (linha do tempo, prazo, atraso)
     e AVALIAR o atendimento;
  5. Exibe um PAINEL DE INDICADORES do bairro (Índice de Zeladoria,
     taxa de resolução, % no prazo, tempo médio, satisfação);
  6. Tem uma CENTRAL DE ACESSIBILIDADE: letras grandes, alto contraste
     e leitura em voz alta (para idosos e pessoas com deficiência).

ODS relacionados: 11 (principal), 10, 6 e 16.
Detalhes: docs/DOCUMENTACAO_TECNICA.md


2. ESTRUTURA DO REPOSITÓRIO
---------------------------------------------------------------------
  README.txt                     este arquivo
  README.md                      apresentação para o GitHub
  app/                           código-fonte do aplicativo (React Native)
     src/app/                    telas (Expo Router - cada arquivo é uma rota)
     src/components/             componentes de interface reutilizáveis
     src/context/                estado global (Context + useReducer)
     src/hooks/                  hooks (tema, localização, leitura em voz)
     src/services/               regras de negócio (triagem, geo, indicadores...)
     src/constants/              categorias, status, prioridades
     src/types/                  tipos de domínio (espelham as tabelas)
  database/                      scripts Oracle
     00_instalar_tudo.sql        executa todos os scripts na ordem
     01_ddl.sql                  tabelas, constraints, índices, views
     02_pkg_bairro_ativo.sql     pacote PL/SQL (functions e procedures)
     03_triggers.sql             triggers de automação
     04_dml_carga.sql            carga de dados de exemplo
     05_testes_e_job.sql         demonstração das rotinas + job agendado
     evidencia_execucao_oracle23ai.txt  saída real da execução
  docs/
     DOCUMENTACAO_TECNICA.md     funções, classes, memória, tecnologias, ODS
     modelo/MODELO_DE_DADOS.md   MER (conceitual) e DER (lógico)
     modelo/DER.png | DER.svg | DER.mmd   diagrama entidade-relacionamento
     screenshots/                capturas de tela do app
  entregaveis/                   TXTs com links + roteiros dos vídeos


3. COMO EXECUTAR O APLICATIVO
---------------------------------------------------------------------
Pré-requisitos:
  - Node.js 20 LTS ou superior (testado com Node 22)
  - Celular com o app "Expo Go" (Android/iOS) OU navegador

Passos:
  cd app
  npm install
  npx expo start

  - Celular: abra o Expo Go e escaneie o QR Code exibido no terminal
    (celular e computador na mesma rede Wi-Fi; se não funcionar use
     "npx expo start --tunnel").
  - Android Emulator: pressione "a" no terminal.
  - Navegador (demonstração): pressione "w" ou rode "npx expo start --web".

Verificação de tipos:
  npx tsc --noEmit

Primeiro acesso: informe seu nome e bairro. O app já vem com 10
ocorrências de exemplo na região da Av. Paulista (São Paulo). Se o GPS
for negado, o app usa essa região como padrão.
Na tela de uma ocorrência, o botão "Simular atualização do órgão"
avança o atendimento (somente para demonstração).
Em "Acessibilidade" > "Restaurar dados de exemplo" os dados voltam ao
estado inicial.


4. COMO EXECUTAR O BANCO DE DADOS (ORACLE)
---------------------------------------------------------------------
Compatível com Oracle 19c, 21c e 23ai (validado em Oracle 23ai Free).

Opção A - SQL Developer:
  Abra database/00_instalar_tudo.sql e execute como script (F5),
  com a pasta database como diretório de trabalho.
  (ou execute 01, 02, 03, 04 e 05 nessa ordem)

Opção B - SQL*Plus / SQLcl:
  cd database
  sqlplus usuario/senha@host:1521/servico @00_instalar_tudo.sql

Opção C - Docker (sem instalar Oracle):
  docker run -d --name ora -p 1521:1521 -e ORACLE_PASSWORD=Oracle123 \
     -e APP_USER=gs -e APP_USER_PASSWORD=gs123 \
     -v "$PWD/database:/sql" gvenzl/oracle-free:23-slim-faststart
  docker exec -e NLS_LANG=AMERICAN_AMERICA.AL32UTF8 -w /sql ora \
     sqlplus gs/gs123@localhost/FREEPDB1 @00_instalar_tudo.sql

Os scripts são reexecutáveis (01_ddl.sql remove os objetos antes de
recriar). O script 05 cria o job diário JOB_BAIRRO_ATIVO_DIARIO; se o
usuário não tiver o privilégio CREATE JOB, apenas um aviso é exibido.


5. JUSTIFICATIVAS TÉCNICAS
---------------------------------------------------------------------
- React Native + Expo: um único código para Android e iOS (e web),
  reduzindo custo - importante para soluções de interesse público.
  Expo Go permite testar no celular sem Android Studio/Xcode.
- TypeScript (strict): segurança de tipos; os tipos espelham as
  tabelas do banco, evitando inconsistências.
- Expo Router: navegação por arquivos, deep links e carregamento sob
  demanda de cada tela.
- Offline-first (AsyncStorage): funciona sem internet, essencial para
  quem tem plano de dados limitado. Em produção, a camada storage.ts
  seria trocada por uma API REST que chama as procedures Oracle.
- Mesma regra no app e no banco (triagem, Haversine, duplicidade,
  índice de zeladoria): resposta instantânea no app e o banco como
  fonte oficial.
- Triagem baseada em regras explicáveis (IA simbólica): transparente
  para o cidadão e auditável pelo poder público; a base de palavras-
  chave fica numa tabela e pode ser ajustada sem alterar código.
- Oracle + PL/SQL: integridade transacional, triggers para automação
  (histórico, contadores, prazos), pacote coeso, job agendado e log de
  erros com transação autônoma.
- Acessibilidade nativa (TalkBack/VoiceOver, fonte ampliada, alto
  contraste, voz): o público mais afetado por problemas urbanos
  (idosos e PcD) é também o mais excluído digitalmente.
- Boas práticas de memória: FlatList virtualizada, React.memo,
  useMemo/useCallback, cleanup de timers/GPS/voz, imagens comprimidas
  sem base64, BULK COLLECT/FORALL no banco. Ver seção 9 de
  docs/DOCUMENTACAO_TECNICA.md.


6. VERSÕES UTILIZADAS
---------------------------------------------------------------------
  Expo SDK 58 | React Native 0.88 | React 19.3 | TypeScript 6.0
  Expo Router 58 | Oracle Database 23ai Free

# BairroAtivo — Documentação Técnica

> **Global Solution 2 · 2026 — CitizenTech: Tecnologia centrada no cidadão**
> Zeladoria urbana colaborativa e acessível.

## Sumário
1. [Problema e proposta de valor](#1-problema-e-proposta-de-valor)
2. [Público beneficiado](#2-público-beneficiado)
3. [Relação com os ODS da ONU](#3-relação-com-os-ods-da-onu)
4. [Funcionalidades](#4-funcionalidades)
5. [Arquitetura](#5-arquitetura)
6. [Tecnologias adotadas e benefícios](#6-tecnologias-adotadas-e-benefícios)
7. [Descrição de classes, funções e métodos (app)](#7-descrição-de-classes-funções-e-métodos-app)
8. [Rotinas PL/SQL (banco)](#8-rotinas-plsql-banco)
9. [Gerenciamento de memória e eficiência](#9-gerenciamento-de-memória-e-eficiência)
10. [Interface, UX e acessibilidade](#10-interface-ux-e-acessibilidade)
11. [Segurança e privacidade (LGPD)](#11-segurança-e-privacidade-lgpd)
12. [Evolução futura](#12-evolução-futura)

---

## 1. Problema e proposta de valor

Postes apagados, buracos, calçadas quebradas, bueiros entupidos e vazamentos de água afetam diariamente a segurança e a mobilidade de quem vive nas cidades. Hoje, para reportar um problema, o cidadão precisa descobrir **qual órgão** é responsável, ligar para uma central, **não recebe retorno** e não sabe se outros vizinhos já reclamaram. Resultado:

- **Subnotificação**: muita gente desiste de reclamar;
- **Duplicidade**: o mesmo buraco vira dezenas de chamados desconexos;
- **Falta de priorização**: um fio caído perto de uma escola entra na mesma fila de uma lâmpada piscando;
- **Falta de transparência**: ninguém sabe se o bairro está sendo bem atendido;
- **Exclusão**: idosos e pessoas com deficiência — os mais afetados por calçadas ruins — são os que mais têm dificuldade com apps tradicionais.

**BairroAtivo** resolve isso com um app em que o cidadão registra o problema em **menos de 1 minuto** (foto + GPS), a **triagem automática** calcula a urgência, o sistema **detecta duplicidades** e transforma reclamações repetidas em **apoios** (força coletiva), o cidadão **acompanha o protocolo** com prazo e linha do tempo, e o bairro ganha um **Índice de Zeladoria** público.

## 2. Público beneficiado

- **Moradores de áreas urbanas**, especialmente de bairros periféricos com pouca zeladoria;
- **Idosos e pessoas com deficiência** (modo letras grandes, alto contraste, leitura em voz alta e prioridade extra para barreiras de acessibilidade);
- **Pessoas com baixa alfabetização ou baixa familiaridade digital** (fluxo guiado em 3 passos, ícones grandes, áudio);
- **Gestores públicos / subprefeituras**, que recebem demandas já triadas, sem duplicidade, com indicadores para planejar equipes.

## 3. Relação com os ODS da ONU

| ODS | Como o BairroAtivo contribui |
|---|---|
| **ODS 11 – Cidades e comunidades sustentáveis** (principal) | Meta 11.2 e 11.7: espaços públicos seguros, inclusivos e acessíveis. A plataforma acelera a manutenção da infraestrutura urbana (iluminação, vias, calçadas, drenagem) e estimula a participação cidadã na gestão do bairro (meta 11.3). |
| **ODS 10 – Redução das desigualdades** | Meta 10.2: inclusão social de pessoas com deficiência e idosos. Acessibilidade nativa no app e pontuação extra para problemas que bloqueiam a mobilidade dessas pessoas. O índice por bairro evidencia desigualdades de atendimento entre regiões. |
| **ODS 6 – Água potável e saneamento** | Meta 6.4: reduzir o desperdício de água. A categoria "Vazamento de água" tem o menor prazo (SLA de 1 dia) e alto peso de risco; bueiros entupidos (drenagem) também são priorizados. |
| **ODS 16 – Instituições eficazes e transparentes** | Meta 16.6/16.7: protocolos, prazos públicos, histórico auditável e indicadores abertos tornam o serviço público mais transparente e responsivo. |

## 4. Funcionalidades

> Login/cadastro **não** são contados. O primeiro acesso só pede nome e bairro (perfil local, sem senha).

| # | Funcionalidade | Onde no código | Valor para o cidadão |
|---|---|---|---|
| 1 | **Registro inteligente de ocorrência** — categoria, GPS + endereço automático, foto (câmera/galeria), descrição, marcação de acessibilidade, **triagem automática explicada** e prazo/órgão responsável | `src/app/nova.tsx`, `services/triagem.ts`, `services/ocorrenciaFactory.ts` | Reporta em menos de 1 minuto e já sabe a prioridade, o prazo e quem vai atender |
| 2 | **Anti-duplicidade + apoio comunitário ("Também me afeta")** — detecta chamado igual num raio de 150 m e oferece apoiar o existente; cada apoio eleva a prioridade | `nova.tsx`, `services/triagem.ts → encontrarDuplicada`, `OcorrenciasContext → ALTERNAR_APOIO` | Força coletiva: o problema que afeta mais gente sobe na fila |
| 3 | **Mapa "Perto de mim"** — ocorrências ordenadas por distância (Haversine) com filtros de raio, situação, categoria e acessibilidade | `src/app/(tabs)/proximas.tsx`, `services/geo.ts` | Saber o que está acontecendo na rua e no caminho que percorre |
| 4 | **Acompanhamento transparente** — protocolo, prazo (SLA), alerta de atraso, linha do tempo de status, motivo da prioridade e **avaliação** do atendimento (1–5 estrelas) | `src/app/ocorrencia/[id].tsx`, `components/LinhaDoTempo.tsx`, `(tabs)/index.tsx` | Fim do "reclamei e nunca soube o que aconteceu" |
| 5 | **Painel de indicadores do bairro** — Índice de Zeladoria (0–100), taxa de resolução, % no prazo, tempo médio, satisfação, ranking por categoria | `src/app/(tabs)/indicadores.tsx`, `services/indicadores.ts` | Transparência e controle social da gestão pública |
| 6 | **Central de acessibilidade** — letras grandes (+30%), alto contraste (AAA), leitura em voz alta (TTS pt-BR), compatível com TalkBack/VoiceOver | `src/app/(tabs)/perfil.tsx`, `hooks/useTema.ts`, `hooks/useLeitorVoz.ts` | Idosos e PcD usam o app com autonomia |

## 5. Arquitetura

```
┌──────────────────────────── App (React Native + Expo) ────────────────────────────┐
│  src/app (telas · Expo Router)                                                     │
│     ├─ (tabs)/index · proximas · indicadores · perfil                              │
│     ├─ nova (registro)   └─ ocorrencia/[id] (acompanhamento)                       │
│  src/components (UI reutilizável, memoizada)                                       │
│  src/hooks      (useTema · useLocalizacao · useLeitorVoz)                          │
│  src/context    (OcorrenciasContext · PreferenciasContext)  ← estado global        │
│  src/services   (triagem · geo · indicadores · ocorrenciaFactory · storage · seed) │
│                         │  regras de negócio puras (sem React) → fáceis de testar  │
└─────────────────────────┼──────────────────────────────────────────────────────────┘
                          │ hoje: AsyncStorage (offline-first)
                          │ produção: API REST → chamadas às procedures
                          ▼
┌──────────────────────────── Oracle Database ──────────────────────────────────────┐
│  Tabelas (3FN) · Triggers · PKG_BAIRRO_ATIVO · Views · JOB diário (DBMS_SCHEDULER) │
└────────────────────────────────────────────────────────────────────────────────────┘
```

**Princípios**
- **Separação de responsabilidades**: telas só exibem e disparam ações; regras ficam em `services/` (funções puras) e no pacote PL/SQL.
- **Mesma regra nos dois lados**: triagem, distância, duplicidade e índice de zeladoria têm implementação equivalente no app (para funcionar **offline** e dar resposta instantânea) e no banco (fonte oficial).
- **Offline-first**: o app funciona sem internet — essencial para quem tem plano de dados limitado.

## 6. Tecnologias adotadas e benefícios

| Tecnologia | Uso | Benefício para o projeto |
|---|---|---|
| **React Native 0.88** | Framework mobile | Um único código para **Android e iOS** (e web para demonstração) — menor custo, ideal para poder público |
| **Expo SDK 58** | Toolchain, módulos nativos | Execução imediata no celular via **Expo Go**, sem Android Studio/Xcode; builds na nuvem (EAS) |
| **TypeScript 6 (strict)** | Linguagem | Tipagem estática evita erros em tempo de execução; tipos espelham as tabelas do banco |
| **Expo Router** | Navegação baseada em arquivos | Rotas claras (`src/app`), deep links (`bairroativo://ocorrencia/ID`) e *lazy loading* de telas |
| **expo-location** | GPS + geocodificação reversa | Endereço preenchido automaticamente — menos digitação para idosos |
| **expo-image-picker** | Câmera/galeria | Foto comprimida como evidência do problema |
| **expo-speech** | Text-to-speech pt-BR | Leitura em voz alta para baixa visão/baixa alfabetização |
| **AsyncStorage** | Persistência local | Funciona offline; dados ficam no aparelho (LGPD) |
| **@expo/vector-icons (Ionicons)** | Ícones | Fonte vetorial: nítida em qualquer tamanho e leve |
| **Oracle Database + PL/SQL** | Banco e automações | Integridade transacional, triggers, pacotes, jobs agendados; padrão em órgãos públicos |
| **Mermaid** | DER versionado como código | Diagrama sempre sincronizado com o repositório |

## 7. Descrição de classes, funções e métodos (app)

> O app usa **componentes funcionais** e **funções puras** (paradigma funcional do React moderno). Os "tipos/classes" de domínio são `interface`s TypeScript.

### 7.1 Tipos de domínio — `src/types/index.ts`
| Tipo | Descrição |
|---|---|
| `Ocorrencia` | Problema registrado: id (protocolo), categoria, descrição, endereço, coordenada, foto, status, prioridade, pontuação, apoios, datas, avaliação, histórico |
| `EventoHistorico` | Item da linha do tempo (status, data, observação) |
| `Perfil` | Nome, bairro e se a pessoa tem necessidade de acessibilidade |
| `PreferenciasAcessibilidade` | `fonteGrande`, `altoContraste`, `leituraVoz` |
| `NovaOcorrenciaInput` | Dados digitados no formulário de registro |
| `CategoriaId`, `StatusOcorrencia`, `Prioridade` | Uniões literais (equivalentes às CHECK constraints do banco) |

### 7.2 Constantes — `src/constants/categorias.ts`
| Item | Descrição |
|---|---|
| `CATEGORIAS` | Catálogo congelado (`Object.freeze`) com nome, ícone, cor, SLA, peso de risco e órgão |
| `STATUS_INFO`, `PRIORIDADE_INFO` | Rótulos e cores de status/prioridade |
| `ORDEM_STATUS` | Sequência do fluxo ABERTA → EM_ANALISE → EM_EXECUCAO → RESOLVIDA |

### 7.3 Serviços (regras de negócio puras) — `src/services/`
| Função | Arquivo | Descrição |
|---|---|---|
| `distanciaKm(a, b)` | `geo.ts` | Distância em km pela fórmula de Haversine |
| `formatarDistancia(km)` | `geo.ts` | "350 m" / "1,2 km" |
| `calcularTriagem({categoria, descricao, afetaAcessibilidade, apoios, diasAtraso})` | `triagem.ts` | Retorna `{pontuacao, prioridade, motivos[]}`: peso da categoria + palavras-chave de risco (por grupo) + 15 se acessibilidade + 2/apoio (máx. 20) + 3/dia de atraso (máx. 15), limitado a 100 |
| `prioridadePorPontuacao(p)` | `triagem.ts` | ≥75 Crítica · ≥50 Alta · ≥30 Média · senão Baixa |
| `retriar(ocorrencia)` | `triagem.ts` | Recalcula a triagem de uma ocorrência existente (após apoio/atraso) |
| `encontrarDuplicada(lista, categoria, coord)` | `triagem.ts` | Ocorrência aberta da mesma categoria a ≤150 m |
| `criarOcorrencia(input)` | `ocorrenciaFactory.ts` | *Factory*: monta a ocorrência com protocolo, triagem, prazo (SLA) e histórico inicial |
| `avancarStatus(o)` / `proximoStatus(s)` | `ocorrenciaFactory.ts` | Avança o fluxo de atendimento de forma **imutável** |
| `gerarProtocolo()` | `ocorrenciaFactory.ts` | Gera `BA-AAAA-NNNNNN` |
| `calcularIndicadores(lista)` | `indicadores.ts` | Todos os indicadores em **uma única passada O(n)** |
| `gerarOcorrenciasDemo()` | `seed.ts` | Dados de demonstração com datas relativas a "agora" |
| `storage.*` | `storage.ts` | Leitura/gravação JSON no AsyncStorage com tratamento de erro |

### 7.4 Estado global — `src/context/`
| Elemento | Descrição |
|---|---|
| `OcorrenciasProvider` | Provider com `useReducer`. Ações: `CARREGAR`, `ADICIONAR`, `ALTERNAR_APOIO`, `AVANCAR_STATUS`, `AVALIAR`, `RESTAURAR_DEMO`. Persistência com *debounce* de 300 ms |
| `reducer(estado, acao)` | Função pura de transição de estado |
| `atualizarItem(lista, id, fn)` | Atualiza só o item alterado, preservando a referência dos demais |
| `useOcorrencias()` | Hook de acesso: `lista`, `registrar`, `alternarApoio`, `avancarStatus`, `avaliar`, `restaurarDemo` |
| `useOcorrencia(id)` | Seletor memoizado de uma ocorrência |
| `PreferenciasProvider` / `usePreferencias()` | Perfil e acessibilidade: `salvarPerfil`, `alterarAcessibilidade`, `sair` |

### 7.5 Hooks — `src/hooks/`
| Hook | Descrição |
|---|---|
| `useTema()` | Retorna `{cores, fs(), escala, altoContraste}` memoizado; `fs(16)` escala a fonte quando "letras grandes" está ativo |
| `useLocalizacao({buscarEndereco})` | Pede permissão, lê o GPS **uma vez** (precisão *Balanced*), faz geocodificação reversa opcional, protege contra *setState* após desmontagem; cai para local padrão se negado |
| `useLeitorVoz()` | `falar(texto)`, `parar()`, `falando`; interrompe a fala ao desmontar a tela |

### 7.6 Componentes — `src/components/`
| Componente | Descrição |
|---|---|
| `Texto` | Texto tipográfico (titulo, subtitulo, corpo, legenda, destaque) com escala e cores do tema |
| `Botao` | Botão acessível (≥52 dp, `accessibilityRole/State/Hint`), variantes primário/secundário/perigo, estado carregando |
| `Cartao`, `Selo`, `Chip`, `IconeCategoria` | Blocos visuais reutilizáveis |
| `CardOcorrencia` | Card da lista com rótulo acessível completo e botão de apoio — `React.memo` |
| `LinhaDoTempo` | Etapas concluídas/pendentes do atendimento — `React.memo` |

### 7.7 Telas — `src/app/`
| Rota | Arquivo | Descrição |
|---|---|---|
| `/onboarding` | `onboarding.tsx` | Perfil simples (nome, bairro, necessidade de acessibilidade) |
| `/` | `(tabs)/index.tsx` | Início: botão de registro, resumo e abas Minhas/Apoiadas/Urgentes |
| `/proximas` | `(tabs)/proximas.tsx` | Perto de mim com filtros |
| `/indicadores` | `(tabs)/indicadores.tsx` | Painel do bairro |
| `/perfil` | `(tabs)/perfil.tsx` | Central de acessibilidade |
| `/nova` | `nova.tsx` | Registro em 3 passos (modal) |
| `/ocorrencia/[id]` | `ocorrencia/[id].tsx` | Acompanhamento |

## 8. Rotinas PL/SQL (banco)

Scripts em [`/database`](../database) — executados e validados em **Oracle Database 23ai Free** (saída em `database/evidencia_execucao_oracle23ai.txt`).

### 8.1 Pacote `PKG_BAIRRO_ATIVO`
| Rotina | Tipo | O que automatiza |
|---|---|---|
| `fn_distancia_km` | Function (DETERMINISTIC) | Haversine no banco |
| `fn_normalizar` | Function | Remove acentos/maiúsculas para a triagem |
| `fn_calcular_pontuacao` | Function | **Triagem automática** usando a tabela `PALAVRA_CHAVE_RISCO` (maior peso por grupo, via SQL agregado) |
| `fn_prioridade`, `fn_ordem_status`, `fn_dias_atraso` | Functions | Regras auxiliares |
| `fn_gerar_protocolo` | Function | Protocolo `BA-AAAA-NNNNNN` via SEQUENCE |
| `fn_indice_zeladoria` | Function | Índice 0–100 por bairro |
| `prc_registrar_ocorrencia` | Procedure | **Registro de solicitações**: valida, **detecta duplicidade** (cursor com pré-filtro geográfico indexado + Haversine) e converte em apoio, ou insere |
| `prc_registrar_apoio` / `prc_remover_apoio` | Procedures | Apoio comunitário (trata `DUP_VAL_ON_INDEX`) |
| `prc_atualizar_status` | Procedure | **Acompanhamento de atendimento**: só avança o fluxo (`SELECT ... FOR UPDATE`) |
| `prc_avaliar` | Procedure | Avaliação com `MERGE` (só autor/apoiador, só resolvidas) |
| `prc_recalcular_prioridades` | Procedure | **Escalonamento de atrasos** com `BULK COLLECT ... LIMIT 500` e `FORALL` |
| `prc_gerar_indicadores` | Procedure | **Geração de indicadores** por bairro (`MERGE` idempotente em `INDICADOR_BAIRRO`) + relatório |
| `prc_relatorio_atrasadas` | Procedure | Relatório de vencidas ordenado por urgência |
| `prc_log_erro` | Procedure (`AUTONOMOUS_TRANSACTION`) | Log de erros que persiste mesmo após ROLLBACK |
| Exceções nomeadas | `-20001…-20030` | `e_transicao_invalida`, `e_avaliacao_nao_permit`, etc. |

### 8.2 Triggers
| Trigger | Evento | Automação |
|---|---|---|
| `trg_ocorrencia_biu` | BEFORE INSERT/UPDATE em OCORRENCIA | Protocolo, prazo pelo SLA, status inicial, pontuação; sincroniza prioridade; bloqueia retrocesso de status; registra data de resolução |
| `trg_ocorrencia_hist` | AFTER INSERT/UPDATE OF status | Grava a **linha do tempo** em HISTORICO_STATUS |
| `trg_apoio_ai` | AFTER INSERT em APOIO | Incrementa `qtd_apoios` e recalcula a prioridade |
| `trg_avaliacao_biu` | BEFORE INSERT/UPDATE em AVALIACAO | Só permite avaliar ocorrência resolvida |
| `trg_cidadao_biu` | BEFORE INSERT/UPDATE em CIDADAO | Padroniza e-mail |

### 8.3 Outros objetos
- **Views**: `vw_ocorrencias_abertas` (com dias de atraso e órgão), `vw_ranking_categorias`.
- **Job** `JOB_BAIRRO_ATIVO_DIARIO` (DBMS_SCHEDULER, 06h): recalcula prioridades e consolida indicadores.

## 9. Gerenciamento de memória e eficiência

### 9.1 No aplicativo

| Prática | Onde | Por que |
|---|---|---|
| **`FlatList` virtualizada** (`initialNumToRender=6`, `windowSize=7`, `maxToRenderPerBatch=8`, `removeClippedSubviews`) | `index.tsx`, `proximas.tsx` | Só os itens visíveis (e uma pequena janela) ficam montados; listas longas não estouram memória |
| **`keyExtractor` estável** (protocolo) | Listas | React reaproveita as células ao invés de recriá-las |
| **`React.memo`** em `CardOcorrencia`, `LinhaDoTempo` e componentes de UI | `components/` | Ao apoiar uma ocorrência, só aquele card re-renderiza |
| **`useCallback`** para `renderItem`, `abrir`, ações do contexto | Telas e contextos | Funções com referência estável não quebram a memoização dos filhos |
| **`useMemo`** para filtros, distâncias, indicadores e triagem | Telas | Cálculos refeitos só quando as dependências mudam (ex.: distâncias só quando a posição muda; filtros rodam sobre o array já ordenado) |
| **Atualização imutável seletiva** (`atualizarItem`) | `OcorrenciasContext` | Copia o array (rasa) e substitui só o item alterado — os demais mantêm a mesma referência |
| **Contextos separados** (ocorrências × preferências) | `context/` | Mudar o tema não re-renderiza listas e vice-versa |
| **Valor do contexto memoizado** (`useMemo`) | Providers | Evita re-render em cascata de todos os consumidores |
| **Persistência com *debounce* (300 ms)** + `clearTimeout` no cleanup | `OcorrenciasContext` | Agrupa várias alterações em uma escrita; o timer é sempre limpo (sem vazamento) |
| **Flags `ativo`/`montado`** em operações assíncronas | Providers, `useLocalizacao` | Evita *setState* em componente desmontado (vazamento clássico em RN) |
| **GPS lido uma vez** (sem `watchPositionAsync`) e precisão *Balanced* | `useLocalizacao` | Sem *listener* contínuo: economiza bateria, CPU e memória |
| **Fala interrompida no unmount** (`Speech.stop()`) | `useLeitorVoz` | Libera o recurso nativo de TTS |
| **Imagens comprimidas** (`quality: 0.5`, recorte 4:3, `base64: false`, `exif: false`) | `nova.tsx` | Guarda apenas a **URI** do arquivo; nunca carrega o base64 (MBs) na memória do JavaScript |
| **Constantes congeladas e fora dos componentes** (`Object.freeze`, `StyleSheet.create`, `Intl.DateTimeFormat` criado uma vez) | Vários | Criadas uma única vez no carregamento do módulo, não a cada render |
| **Pré-normalização das palavras-chave** | `triagem.ts` | Termos normalizados uma vez, não a cada tecla digitada |
| **Indicadores em uma única passada O(n)** com `Map` | `indicadores.ts` | Evita vários `.filter()` encadeados que criariam arrays intermediários |
| **Rotas com carregamento sob demanda** (Expo Router) | `src/app` | Cada tela é um *chunk* separado (ver tamanhos no export web: 3–17 KB por tela) |
| **Tratamento de erro no storage** | `storage.ts` | Falha de leitura não derruba o app |

### 9.2 No banco de dados

| Prática | Onde | Por que |
|---|---|---|
| `BULK COLLECT ... LIMIT 500` + `FORALL` | `prc_recalcular_prioridades` | Processa em lotes: memória da PGA limitada e menos trocas de contexto SQL↔PL/SQL |
| Cursores explícitos fechados também no `EXCEPTION` | `prc_recalcular_prioridades` | Evita cursores abertos (ORA-01000) |
| Pré-filtro geográfico indexado antes do Haversine | `prc_registrar_ocorrencia` | Calcula distância só para poucas linhas candidatas |
| Funções `DETERMINISTIC` | `fn_distancia_km`, `fn_prioridade` … | Permitem cache de resultado pelo otimizador |
| Contadores desnormalizados mantidos por trigger | `qtd_apoios`, `pontuacao` | Listas do app sem `COUNT(*)` por linha |
| Índices compostos alinhados às consultas | `01_ddl.sql` | Consultas por bairro/status/categoria/prazo sem *full scan* |
| `MERGE` idempotente | Indicadores e avaliação | Rodar o job duas vezes não duplica dados |
| `SEQUENCE NOCACHE` + `IF` em vez de `NVL` na trigger | Protocolo | Não desperdiça números de protocolo |

## 10. Interface, UX e acessibilidade

- **Fluxo de registro em 3 passos** numerados ("Qual é o problema?", "Onde fica?", "Conte um pouco mais") com ícones grandes coloridos — compreensível sem leitura fluente.
- **Botão principal gigante** na tela inicial ("Registrar problema").
- **Feedback imediato**: triagem explicada em linguagem simples ("Menção a 'escola' (+15)").
- **Áreas de toque ≥ 48 dp**, contraste AA no tema padrão e AAA no alto contraste.
- **Letras grandes (+30%)** aplicadas a todo o app em tempo real; ativadas automaticamente para quem declara necessidade no primeiro acesso.
- **Leitura em voz alta** dos detalhes da ocorrência e do resumo dos indicadores.
- **Leitores de tela**: `accessibilityRole`, `accessibilityLabel`, `accessibilityHint` e `accessibilityState` em todos os controles; cards com descrição completa ("Iluminação pública, Em análise, prioridade Alta, a 350 m de você, 12 pessoas afetadas").
- **Layout responsivo** (`maxWidth` 720) — funciona em celular, tablet e web.

Capturas de tela: [`docs/screenshots`](screenshots).

## 11. Segurança e privacidade (LGPD)

- Perfil sem senha e **armazenado só no aparelho**; botão "Sair e apagar dados".
- Permissões de câmera/localização solicitadas **somente no uso** e com justificativa (`app.json`).
- No banco: `CHECK`s, FKs e validação nas procedures; erros auditados em `LOG_ERRO` com usuário e data.

## 12. Evolução futura

- API REST (Node/Java) expondo as procedures e sincronização offline→online;
- Notificações *push* a cada mudança de status;
- Classificação de imagem por IA (sugere a categoria a partir da foto);
- Painel web para subprefeituras e mapa de calor;
- Integração com o 156 / sistemas municipais existentes.

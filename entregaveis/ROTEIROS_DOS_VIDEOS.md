# Roteiros dos vídeos — BairroAtivo

> Lembretes da entrega: publicar no YouTube como **Não listado**; colar os links em `link_video_pitch_venda.txt` e `link_video_pitch_tecnico.txt`. No pitch de venda é **obrigatório aparecer o rosto e a voz** de pelo menos um integrante.

---

## 🎤 Vídeo 1 — Pitch de Venda (máx. 3:00)

| Tempo | Cena | Fala sugerida |
|---|---|---|
| 0:00–0:20 | **Integrante na câmera** (de preferência em frente a uma calçada quebrada ou poste apagado) | "Quantas vezes você passou por um poste apagado, um buraco ou uma calçada quebrada e pensou: 'alguém já deve ter reclamado'? Pois é. Quase ninguém reclama — e quem reclama nunca recebe resposta." |
| 0:20–0:50 | Integrante + imagens de problemas urbanos | "O problema é real: o cidadão não sabe para quem ligar, o mesmo buraco vira dezenas de chamados repetidos, um fio caído perto de uma escola entra na mesma fila de uma lâmpada piscando, e quem mais sofre — idosos, cadeirantes, pessoas cegas — é quem tem mais dificuldade de usar os aplicativos atuais." |
| 0:50–1:10 | Logo/tela inicial do app | "Nós criamos o **BairroAtivo**: o aplicativo que transforma cada morador em um fiscal do seu bairro — de forma simples, coletiva e acessível." |
| 1:10–1:55 | Gravação de tela: registrar → triagem → duplicidade → "Também me afeta" | "Em menos de um minuto você tira a foto, o GPS preenche o endereço e o app já diz a prioridade e o prazo. Se o vizinho já reclamou, você não cria outro chamado: você **apoia** o existente — e quanto mais gente afetada, mais rápido ele sobe na fila." |
| 1:55–2:20 | Tela de acompanhamento + indicadores | "Você acompanha tudo com protocolo, prazo e linha do tempo, avalia o atendimento, e o bairro inteiro ganha um **Índice de Zeladoria** público. Transparência que cobra resultado." |
| 2:20–2:40 | Modo alto contraste + leitura em voz | "E ninguém fica de fora: letras grandes, alto contraste e leitura em voz alta, compatível com leitores de tela." |
| 2:40–3:00 | **Integrante na câmera** | "BairroAtivo contribui para os ODS 11, 10 e 6 da ONU: cidades mais seguras, inclusivas e sem desperdício. Para a prefeitura, chamados triados e sem duplicidade; para o cidadão, voz e resposta. **BairroAtivo: o seu bairro, cuidado por todos.**" |

**Proposta de valor em uma frase:** reportar em 1 minuto, acompanhar até a solução, e somar forças com os vizinhos — com acessibilidade para todos.

---

## 🛠️ Vídeo 2 — Pitch Técnico (máx. 5:00)

| Tempo | Conteúdo | O que mostrar |
|---|---|---|
| 0:00–0:20 | Apresentação | Nome do projeto, equipe, problema em uma frase, ODS 11/10/6 |
| 0:20–0:55 | **Tecnologias e arquitetura** | `README.md` e diagrama da seção 5 da documentação: React Native + Expo SDK 58, TypeScript strict, Expo Router, AsyncStorage (offline-first), expo-location / image-picker / speech, Oracle + PL/SQL. Justificar: um código para Android/iOS, Expo Go, funciona sem internet |
| 0:55–1:20 | **Estrutura do código** | VS Code: `src/app` (rotas), `components`, `context`, `hooks`, `services` (regras puras) e `types` (espelham as tabelas) |
| 1:20–2:40 | **Demonstração das funcionalidades** (celular/Expo Go ou web) | 1) Registro: categoria → GPS → descrição com "escola" e "perigosa" → triagem ao vivo explicando pontos → enviar → protocolo. 2) Duplicidade: nova ocorrência perto de uma existente → "Apoiar chamado existente". 3) Perto de mim: filtros de raio/categoria/acessibilidade. 4) Acompanhamento: "Simular atualização" até Resolvida → avaliar com estrelas. 5) Indicadores. 6) Acessibilidade: letras grandes + alto contraste + "Ouvir detalhes" |
| 2:40–3:20 | **Gerenciamento de memória** | Mostrar no código: `FlatList` com `initialNumToRender/windowSize/removeClippedSubviews`, `React.memo(CardOcorrencia)`, `useCallback/useMemo`, `atualizarItem` imutável, debounce com `clearTimeout`, flag `montado` no `useLocalizacao`, `Speech.stop()` no cleanup, imagem `quality: 0.5` e `base64: false` |
| 3:20–4:30 | **Banco de dados e PL/SQL** | `docs/modelo/DER.png` (entidades e cardinalidades); `02_pkg_bairro_ativo.sql`: `fn_calcular_pontuacao` (tabela de palavras-chave), `prc_registrar_ocorrencia` com anti-duplicidade, `prc_recalcular_prioridades` com BULK COLLECT/FORALL, `prc_gerar_indicadores` com MERGE; `03_triggers.sql` (histórico automático, contador de apoios). Rodar `05_testes_e_job.sql` e mostrar a saída: duplicidade virando apoio, transição inválida bloqueada, relatório de indicadores, job criado |
| 4:30–5:00 | Encerramento | Próximos passos (API REST, push, IA de imagem, painel da prefeitura) e link do GitHub |

**Dica de gravação:** para a demo no navegador, `cd app && npx expo start --web`; para o banco, use o comando Docker do `README.txt` (seção 4, opção C) — a saída esperada está em `database/evidencia_execucao_oracle23ai.txt`.

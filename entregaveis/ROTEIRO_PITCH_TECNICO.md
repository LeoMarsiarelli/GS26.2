# 🎬 Roteiro de gravação: Pitch Técnico do BairroAtivo

**Duração-alvo:** 4min40s (limite: 5min) · **Apresentador:** Leonardo Marsiarelli (RM 555366, 3SIOA)
**Formato:** gravação de tela com voz (a câmera é opcional neste vídeo, mas aparecer no início e no fim causa boa impressão).

> Como ler este roteiro: **🖥️ TELA** é o que deve aparecer no vídeo; **🎙️ FALA** é o texto para ler em voz alta, num ritmo calmo. O texto falado tem cerca de 640 palavras, o que dá uns 4min40s de fala.

---

## ✅ Antes de gravar: preparação (15 min)

1. **App rodando**
   ```bash
   cd app
   npm install
   npx expo start --web
   ```
   - No Chrome, abra o modo celular: `F12` → ícone de celular (Ctrl+Shift+M) → escolha **iPhone 12 Pro** ou **Pixel 7**. Ou use o próprio celular com o **Expo Go** espelhado na tela (pelo scrcpy no Android ou pelo AirPlay/QuickTime no iPhone).
   - Na primeira tela, **ainda não** preencha o nome: o cadastro aparece na gravação.
   - Se o app já foi aberto antes, vá em **Acessibilidade → Sair e apagar dados** para começar do zero.
2. **VS Code** aberto na pasta do projeto, com estas abas já abertas, nesta ordem:
   1. `app/src/app/(tabs)/proximas.tsx` (linha 130)
   2. `app/src/components/CardOcorrencia.tsx` (linha 91)
   3. `app/src/context/OcorrenciasContext.tsx` (linhas 32 e 97)
   4. `app/src/app/nova.tsx` (linha 63)
   5. `database/02_pkg_bairro_ativo.sql` (linhas 160, 253, 465)
   6. `database/03_triggers.sql` (linha 55)
   - Aumente a fonte do editor (**Ctrl + =** duas ou três vezes) para o código ficar legível no vídeo.
3. **Imagens/arquivos abertos** numa aba do navegador ou visualizador:
   - `docs/modelo/DER.png`
   - `database/evidencia_execucao_oracle23ai.txt` (saída real do banco). Se tiver Oracle/SQL Developer, pode rodar `05_testes_e_job.sql` ao vivo.
4. **Gravação:** OBS Studio ou a barra de jogos do Windows (Win+Alt+R), em 1080p, microfone a 15–20 cm, notificações desligadas.
5. Feche abas e janelas com dados pessoais.

---

## 🎞️ Cenas

### CENA 1 · Abertura (0:00 – 0:20)
🖥️ **TELA:** seu rosto pela webcam ou a tela inicial do app no modo celular.

🎙️ **FALA:**
> "Olá! Eu sou o Leonardo Marsiarelli, RM 555366, da turma 3SIOA. Este é o pitch técnico do **BairroAtivo**, um aplicativo de zeladoria urbana colaborativa e acessível. Com ele, o cidadão registra problemas do bairro, como poste apagado, buraco ou calçada quebrada, e acompanha a solução. O projeto se relaciona principalmente com o ODS 11, além dos ODS 10 e 6."

---

### CENA 2 · Tecnologias e arquitetura (0:20 – 0:50)
🖥️ **TELA:** o `README.md` no GitHub ou a seção **5. Arquitetura** de `docs/DOCUMENTACAO_TECNICA.md`.

🎙️ **FALA:**
> "O app foi desenvolvido em **React Native com Expo SDK 58 e TypeScript** no modo estrito. Assim, um único código roda em Android, iOS e na web, e dá para testar no celular pelo Expo Go. A navegação usa o **Expo Router**, baseado em arquivos. Os dados ficam no **AsyncStorage**, então o app funciona offline, o que é importante para quem tem pouco plano de dados. Uso também GPS, câmera e leitura em voz alta, com módulos nativos do Expo. O banco de dados oficial é **Oracle**, com as automações em **PL/SQL**."

---

### CENA 3 · Organização do código (0:50 – 1:10)
🖥️ **TELA:** o explorador de arquivos do VS Code, com a pasta `app/src` expandida. Passe o mouse em cada pasta enquanto fala.

🎙️ **FALA:**
> "O código está separado por responsabilidade: em `app` ficam as telas, onde cada arquivo é uma rota; em `components`, os componentes reutilizáveis; em `context`, o estado global com `useReducer`; e em `hooks`, tema, localização e voz. As regras de negócio ficam em `services`, como funções puras e fáceis de testar. Os tipos em `types` espelham as tabelas do banco."

---

### CENA 4 · Demonstração do app (1:10 – 2:45) ⭐ parte principal
🖥️ **TELA:** o app no modo celular. Faça as ações **enquanto** fala cada trecho.

| Ação na tela | 🎙️ FALA |
|---|---|
| Digite seu nome, deixe o bairro "Bela Vista" e toque em **Começar** | "No primeiro acesso, peço só o nome e o bairro, sem senha. Os dados ficam no aparelho, seguindo a LGPD." |
| Toque em **Registrar problema** → escolha **Iluminação pública** | "Primeira funcionalidade: o registro inteligente, em três passos. Escolho a categoria..." |
| Mostre a faixa do GPS e digite no endereço: `Av. Paulista, 1000` | "...o GPS captura a localização e, no celular, preenche o endereço sozinho..." |
| Digite na descrição: `Poste apagado em frente à escola, rua muito escura e perigosa.` Role até o cartão **Triagem automática** | "...e descrevo o problema. Repare na **triagem automática**: enquanto eu digito, o app calcula a prioridade e explica o motivo: categoria iluminação, mais 25 pontos; menção a escola, mais 15; perigo, mais 12. Ele também mostra o prazo e o órgão responsável." |
| Toque em **Enviar ocorrência** | "Ao enviar, recebo um protocolo." |
| Volte ao início → **Registrar problema** de novo → **Iluminação pública** → aparece o cartão laranja "Já existe um chamado parecido aqui perto" | "Segunda funcionalidade: a **detecção de duplicidade**. Se alguém tenta registrar o mesmo problema a até 150 metros, o app sugere **apoiar** o chamado existente em vez de criar outro. Isso evita retrabalho para a prefeitura e soma a força dos vizinhos." |
| Volte (seta ←) → aba **Perto de mim** → toque no ícone de pessoas de um card | "Terceira funcionalidade: **Perto de mim**. As ocorrências aparecem ordenadas pela distância, calculada pela fórmula de Haversine, com filtros de raio, situação, categoria e acessibilidade. Quando toco em 'também me afeta', o apoio aumenta a prioridade do chamado." |
| Aba **Início** → toque no card da sua ocorrência → role até a **Linha do tempo** → toque 3 vezes em **Simular atualização do órgão** → dê **5 estrelas** | "Quarta funcionalidade: o **acompanhamento**. Tenho prazo, motivo da prioridade e a linha do tempo. Para a demonstração, simulo a atualização do órgão até 'Resolvida'... e avalio o atendimento." |
| Aba **Indicadores** | "Quinta funcionalidade: o **painel do bairro**, com o Índice de Zeladoria, que combina taxa de resolução, cumprimento de prazo e satisfação, além do ranking dos problemas mais frequentes." |
| Aba **Acessibilidade** → ative **Letras grandes** e **Alto contraste** → volte ao **Início** | "Por fim, a **central de acessibilidade**: letras 30% maiores, alto contraste e leitura em voz alta, compatível com TalkBack e VoiceOver. Pensado para idosos e pessoas com deficiência." |

> 💡 Depois da cena, desative o alto contraste para as próximas gravações.

---

### CENA 5 · Gerenciamento de memória (2:45 – 3:25)
🖥️ **TELA:** o VS Code. Troque de aba a cada frase, na ordem indicada.

| Aba do VS Code | 🎙️ FALA |
|---|---|
| `proximas.tsx`, linha 130 | "Agora, as boas práticas de memória. As listas usam **FlatList virtualizada**: só os itens visíveis ficam montados, com `initialNumToRender`, `windowSize` e `removeClippedSubviews`." |
| `CardOcorrencia.tsx`, linha 91 | "O card usa **React.memo** e os callbacks usam **useCallback**, então, ao apoiar uma ocorrência, só aquele card é renderizado de novo." |
| `OcorrenciasContext.tsx`, linhas 32 e 97 | "No estado global, a atualização é imutável e seletiva: só o item alterado ganha uma nova referência. A gravação em disco tem *debounce* de 300 milissegundos, e o timer é limpo no *cleanup* para não vazar memória." |
| `nova.tsx`, linha 63 | "A foto é comprimida em 50% e **nunca carregamos o base64** na memória do JavaScript: guardamos só o endereço do arquivo. O GPS é lido uma única vez, sem ficar escutando a posição, e a fala é interrompida quando a tela fecha." |

---

### CENA 6 · Banco de dados e PL/SQL (3:25 – 4:35)
🖥️ **TELA:** primeiro `docs/modelo/DER.png`, depois o VS Code e, por último, a saída do banco.

| Tela | 🎙️ FALA |
|---|---|
| `DER.png`: aponte para OCORRENCIA, depois APOIO, HISTORICO e AVALIACAO | "Este é o DER. A entidade central é a **Ocorrência**, ligada a cidadão, categoria e bairro. **Apoio** é a tabela associativa do relacionamento N para N entre cidadão e ocorrência. O histórico guarda a linha do tempo, e a avaliação tem relação de 1 para 1. O modelo está na terceira forma normal." |
| `02_pkg_bairro_ativo.sql`, linha 160 | "As automações estão no pacote **PKG_BAIRRO_ATIVO**. A função de pontuação faz a mesma triagem do app, usando uma tabela de palavras-chave de risco que pode ser ajustada sem mudar o código." |
| mesmo arquivo, linha 253 | "A procedure de registro tem um cursor que primeiro filtra por uma área próxima, usando índice, e depois calcula a distância exata. Se encontra duplicata, transforma o registro em apoio." |
| mesmo arquivo, linha 465 | "A rotina diária de escalonamento usa **BULK COLLECT com LIMIT e FORALL**, processando em lotes para economizar memória. Os indicadores são gerados com **MERGE**." |
| `03_triggers.sql`, linha 55 | "As **triggers** calculam o prazo e a prioridade, gravam o histórico a cada mudança de status, atualizam o contador de apoios e bloqueiam avaliações antes da resolução." |
| `evidencia_execucao_oracle23ai.txt`: role até "===== 2)", depois "===== 5)" e "===== 8)" | "Aqui está a execução real no Oracle 23ai: a duplicidade virou apoio, a transição inválida foi bloqueada com exceção própria e registrada no log, e o relatório de indicadores por bairro foi gerado. Também criei um **job no DBMS_SCHEDULER** que roda tudo isso todos os dias às 6 horas." |

---

### CENA 7 · Encerramento (4:35 – 4:55)
🖥️ **TELA:** o repositório no GitHub (página inicial com as capturas de tela) ou a webcam.

🎙️ **FALA:**
> "Como próximos passos, quero criar uma API REST ligando o app às procedures, enviar notificações push e usar IA para sugerir a categoria a partir da foto. O código completo, a documentação e o modelo de dados estão no GitHub, no link da entrega. Obrigado!"

---

## 📌 Dicas finais

- **Ensaie uma vez** com cronômetro. Se passar de 4min50s, encurte as falas da Cena 4: a demonstração costuma levar mais tempo que o previsto.
- Se errar uma fala, **pare, respire e repita a frase**; depois corte o erro no editor (Clipchamp, CapCut ou o próprio editor de vídeo do YouTube).
- **Plano B para a duplicidade:** se o cartão laranja não aparecer, confira se a primeira ocorrência ainda **não** foi resolvida. Chamados resolvidos não contam como duplicata. Por isso, mostre a duplicidade **antes** de simular a resolução.
- **Publicação:** YouTube → Criar → Enviar vídeo → em Visibilidade, escolha **Não listado**. Copie o link e cole em `entregaveis/link_video_pitch_tecnico.txt`.

# 🎙️ Falas da apresentação do BairroAtivo

Texto corrido para ler em voz alta, como num teleprompter. Os trechos entre colchetes **[assim]** indicam o que mostrar na tela e **não devem ser lidos**.
Duração estimada: **4min30s** num ritmo calmo (cerca de 620 palavras).

---

### 1. Apresentação
**[webcam ou tela inicial do app]**

Olá! Eu sou o Leonardo Marsiarelli, RM 555366, da turma 3SIOA. Vou apresentar o **BairroAtivo**, o projeto que desenvolvi para a Global Solution de 2026 com o tema CitizenTech: tecnologia centrada no cidadão.

### 2. O problema

Todo mundo já passou por um poste apagado, um buraco na rua ou uma calçada quebrada. O problema é que quase ninguém reclama. O cidadão não sabe para qual órgão ligar, o mesmo buraco vira dezenas de reclamações repetidas, e um fio caído na frente de uma escola entra na mesma fila de uma lâmpada piscando. E quem mais sofre com calçadas ruins, que são os idosos e as pessoas com deficiência, é justamente quem tem mais dificuldade para usar os aplicativos.

### 3. A solução

O BairroAtivo é um aplicativo de zeladoria urbana colaborativa e acessível. Com ele, o morador registra o problema em menos de um minuto, acompanha a solução e soma forças com os vizinhos. O projeto contribui principalmente com o **ODS 11**, de cidades sustentáveis, e também com o **ODS 10**, pela inclusão de idosos e pessoas com deficiência, e com o **ODS 6**, ao combater o desperdício de água com a prioridade para vazamentos.

### 4. As funcionalidades
**[demonstrar no app enquanto fala]**

A primeira funcionalidade é o **registro inteligente**. Escolho a categoria, o GPS captura a localização e eu descrevo o problema. Enquanto digito, o app faz uma **triagem automática**: calcula a prioridade e explica o motivo. Por exemplo, se eu escrevo que o poste fica em frente a uma escola e que a rua é perigosa, a pontuação sobe. O app também mostra o prazo de atendimento e o órgão responsável. Ao enviar, recebo um número de protocolo.

A segunda é a **detecção de duplicidade**. Se alguém tenta registrar o mesmo problema a até 150 metros de um chamado aberto, o app sugere apoiar o chamado existente. Cada apoio de "também me afeta" aumenta a prioridade. Assim, o problema que atinge mais gente sobe na fila, e a prefeitura não recebe reclamações repetidas.

A terceira é o **Perto de mim**: as ocorrências aparecem ordenadas pela distância, com filtros de raio, situação, categoria e acessibilidade.

A quarta é o **acompanhamento**. O cidadão vê o protocolo, o prazo, a linha do tempo do atendimento e, quando o problema é resolvido, avalia o serviço com estrelas.

A quinta é o **painel de indicadores do bairro**, com o Índice de Zeladoria, que combina a taxa de resolução, o cumprimento de prazo e a satisfação dos moradores. É transparência para o cidadão cobrar resultado.

E a sexta é a **central de acessibilidade**: letras maiores, alto contraste e leitura em voz alta, além de compatibilidade com os leitores de tela do celular.

### 5. As tecnologias
**[mostrar o código no VS Code]**

O app foi desenvolvido em **React Native com Expo e TypeScript**, então um único código funciona em Android, iOS e na web. A navegação usa o Expo Router, e os dados ficam salvos no próprio aparelho, o que permite usar o app mesmo sem internet. O código é organizado em telas, componentes, estado global, hooks e serviços com as regras de negócio.

### 6. Gerenciamento de memória

Cuidei também do uso de memória. As listas são virtualizadas, ou seja, só os itens visíveis ficam carregados. Os componentes são memorizados para não serem redesenhados sem necessidade. As fotos são comprimidas e o app guarda só o endereço do arquivo, não a imagem inteira na memória. Os temporizadores, o GPS e a leitura em voz são encerrados quando a tela fecha.

### 7. Banco de dados
**[mostrar o DER e os scripts SQL]**

O banco de dados é **Oracle**. A entidade central é a ocorrência, ligada ao cidadão, à categoria e ao bairro, e o apoio é a tabela que liga cidadãos e ocorrências num relacionamento de muitos para muitos. As automações estão em **PL/SQL**: há procedures para registrar ocorrências, detectar duplicidade, atualizar o status e gerar indicadores; triggers que gravam o histórico e recalculam a prioridade; e uma tarefa agendada que, todos os dias, eleva a prioridade dos chamados atrasados.

### 8. Encerramento
**[webcam ou página do GitHub]**

Como próximos passos, quero conectar o app ao banco por meio de uma API, enviar notificações e usar inteligência artificial para reconhecer o problema pela foto. O código e a documentação completa estão no GitHub. BairroAtivo: o seu bairro, cuidado por todos. Obrigado!

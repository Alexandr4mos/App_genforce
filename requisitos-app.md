# Requisitos do App — Melhorias sobre o 8Confirma

> Documento vivo. Atualize esta lista conforme forem surgindo novas ideias durante o desenvolvimento.

## Status
- [ ] Pendente
- [ ] Andamento
- [ ] Concluída
- [ ] Finalizado

---

## 1. Cadastro de Cliente
- [ ] Dados básicos: nome, razão social, CNPJ, endereço, telefone, e-mail
- [ ] Suporte a múltiplas unidades/locais por cliente (ex: cliente com vários prédios)

## 2. Cadastro de Equipamento (Gerador)
- [ ] Placa do motor
- [ ] Placa do alternador
- [ ] Data de início do contrato de manutenção
- [ ] Numeração dos filtros utilizados (óleo, combustível, ar, separador — cada um com seu código)
- [ ] Dados técnicos: fabricante, modelo, nº de série (motor e alternador), tensão, potência (KVA), tipo de GMG

## 3. Pendências
- [ ] Técnico solicita item a trocar durante a manutenção → vira pendência automaticamente
- [ ] Pendência fica vinculada ao equipamento (não à OS) — aparece em toda visita seguinte
- [ ] Fluxo de status: solicitada → aguardando comercial → proposta enviada → aprovada (ou recusada) → resolvida
- [ ] Baixa manual: só o técnico que executa o serviço encerra a pendência
- [ ] Pendência recusada fica registrada no histórico, não é apagada

## 4. Relatório de Peças
- [ ] Campo dentro da OS para registrar peça trocada
- [ ] Cada registro tem: peça, quantidade, observação, técnico responsável, data e hora
- [ ] Serve como prova para o cliente em caso de questionamento ("não foi trocado")
- [ ] Pode vincular a troca a uma pendência de origem (quando aplicável)

## 5. Logística dos Funcionários
- [ ] Check-in/check-out com geolocalização
- [ ] Distribuição de OS por técnico com visão de agenda do dia
- [ ] Perfis de acesso: técnico, supervisor, admin (hoje: 5 técnicos, 1 supervisor, 2 admin)

## 6. Clareza para o Cliente
- [ ] Status da OS em tempo real
- [ ] Envio automático de PDF/recibo ao concluir (WhatsApp ou e-mail)
- [ ] Histórico de manutenções do equipamento acessível

## 6b. Painel Web (Supervisor/Admin) ★
- [ ] Painel separado, acessado pelo navegador do computador
- [ ] Supervisor revisa a OS concluída (checklist, fotos, pendências, peças) antes de liberar
- [ ] Botão de aprovar/reprovar a OS
- [ ] Só após aprovação a OS é liberada/enviada ao cliente
- [ ] Mesmo banco de dados do app mobile (Supabase) — sem duplicar dados

## 6c. Relatório Final da OS ★
- [ ] Gerado ao concluir a manutenção (botão "Finalizar OS")
- [ ] Combina: checklist preenchido + fotos tiradas em cada item + assinatura do cliente
- [ ] Foto pode ser tirada na hora pela câmera (não só escolhida da galeria depois)
- [ ] Serve de base para o que é enviado ao cliente e para o que o supervisor revisa no painel web

## 7. Migração de Dados
- [ ] Verificar com o 8Confirma se é possível exportar clientes, equipamentos e histórico de OS
- [ ] Definir formato de exportação (CSV/Excel/API)
- [ ] Planejar migração ou digitação manual dos dados mais recentes

---

## Ideias em aberto (ainda não estruturadas)
<!-- Adicione aqui rascunhos de ideias antes de formalizar em uma seção acima -->

### Análise comparativa com o 8Confirma — 13/08/2026
> Obs.: não tenho acesso direto ao app 8Confirma de vocês. Essa análise é baseada no que
> encontrei publicamente sobre o "Confirm8" (Uplogic), que parece ser o software por trás do
> nome, mais boas práticas comuns em apps de manutenção de campo. Confirma se bate com o app
> de vocês antes de levar qualquer item a sério.

**Logística da equipe (reforça a seção 5)**
- [ ] Mapa com localização em tempo real dos técnicos (visão do supervisor/admin)
- [ ] Visão em calendário/agenda pra evitar dois técnicos com OS sobreposta no mesmo horário
- [ ] Reatribuir OS pra outro técnico rapidamente (hoje só dá pra editar campo a campo)
- [ ] Sugestão de técnico mais próximo ao criar/atribuir uma OS

**Evidências e fechamento pro cliente (reforça as seções 4 e 6)**
- [ ] Assinatura digital do cliente na tela ao final da OS — banco já tem a tabela `assinaturas` pronta (cliente/técnico), só falta a tela
- [ ] Alternativa quando não dá pra assinar: foto do responsável ou do local como prova
- ~~QR code no gerador pra identificação rápida na hora de abrir a OS~~ — **eliminado a pedido do Alexandre (14/08): não usam QR code no fluxo deles, princípio não implementar**
- [ ] Geração automática de PDF do relatório final (checklist + fotos + assinatura) ao finalizar a OS
- [ ] Envio automático desse PDF por WhatsApp ou e-mail pro cliente

**Painel web (seção 6b)** — ainda não iniciado; é hoje o maior gap em relação ao 8Confirma, que tem dashboard completo

**Sincronização** — hoje o "Atualizar" na OS é manual; 8Confirma atualiza mapa/status ao vivo (Realtime é melhoria futura já anotada)

**Fora do que vi no 8Confirma, mas comum em apps de manutenção de campo (ideia extra, não confirmada com vocês):**
- [ ] Modo offline pra preencher checklist e tirar foto sem sinal (casa de máquina/subsolo costuma pegar mal), sincronizando depois
- [ ] Controle simples de estoque de peças/filtros por técnico ou almoxarifado, pra saber se a peça tá disponível antes de prometer troca ao cliente
- [ ] Notificação push: técnico avisado de nova OS atribuída; supervisor avisado de OS aguardando aprovação; pendência avisando quando muda de status

**Fora de escopo por enquanto (o 8Confirma tem, mas não parece fazer sentido pra vocês agora):**
- Integração com ERP / faturamento automático / boleto — só faz sentido se a Genforce cobrar por OS individualmente

---

### Observações de print real do 8Confirma — tela de lista de OS (13/08/2026)
> Este print é do app de verdade (não é mais suposição minha). Confirma o QR code que eu tinha
> só especulado antes, e traz várias coisas que eu não tinha visto.

O que aparece na tela de lista de OS do 8Confirma:
- Barra superior com: voltar, ícone de **QR code**, ícone de **assinatura** (caneta riscada — parece indicador de pendência/status de assinatura), ícone de **nuvem/upload** (status de sincronização), ícone de perfil
- Bloco "Hoje — 13 AGO 2026" em destaque no topo, com botão de atualizar
- **Resumo com contadores por status**, em chips coloridos: vermelho = urgente/atrasada (1), azul = agendada (0), laranja-relógio = em aberto (4), laranja-pausa = pausada (0), verde = concluída (0), cinza = arquivada/outro (0) — ou seja, 6 categorias de status, mais granular que o nosso `pendente/andamento/pausada/concluida`
- Barra de **busca + Filtros + Ordenar + Status** (dropdowns) na lista
- Cada card de OS mostra:
  - Número da OS com ícone do status
  - **Janela de data/hora prevista** (início → fim, ex: "12 AGO 08h00 → 13 AGO 17h00"), não só uma data
  - Nome do cliente em destaque + linha com nome completo/razão social embaixo
  - Chip com o tipo de manutenção (ex: "MANUTENÇÃO PREVENTIVA")
  - Um chip por equipamento, no formato "[GRUPO GERADOR] TAG | MARCA-MODELO" (ex: "GMG-01 | CAT-C27") — mostra a marca/modelo junto com a tag, direto no card
  - Descrição livre da OS

**Comparando com o que o nosso app já tem hoje:**
- [x] Já temos: tipo, status, cliente e descrição no card
- [ ] Falta: janela de data/hora prevista (início → fim), hoje só temos uma data prevista solta
- [ ] Falta: resumo com contadores por status no topo da lista
- [ ] Falta: busca + filtro + ordenação na lista de OS (hoje é só a lista corrida)
- [ ] Falta: status mais granular (ex: separar "pausada" e ter algo tipo "arquivada")
- [ ] Falta: chip de equipamento mostrando marca/modelo junto com a tag no card (hoje só aparece o grupo, sem detalhe do equipamento na lista)
- [ ] Falta: indicador de pendência de assinatura visível na tela (ícone de caneta riscada)
- [ ] Falta: indicador visual de status de sincronização (ícone de nuvem/upload)

*(Se tiver mais prints de outras telas do 8Confirma — checklist, tela de assinatura, cadastro de equipamento, etc. — manda que eu vou documentando aqui do mesmo jeito, sem mexer em código.)*

---

### Ideias que o Alexandre foi pedindo na conversa (vou acumulando aqui, sem mexer no código ainda)
<!-- Cada vez que você me passar uma ideia nesta conversa, registro aqui como item novo -->

**1. Editar OS não permite mexer no(s) gerador(es) da OS — CONFIRMADO: quer as duas coisas**
- Hoje o `EditarOS.js` só tem: tipo, status, data prevista e descrição da OS
- O `NovaOS.js` tem, além disso: selecionar gerador(es) existentes da unidade (checkbox) e cadastrar gerador novo ali mesmo (tag, fabricante do GMG, potência)
- Alexandre testou, criou um gerador sem preencher um campo (ex: fabricante/potência) e não tem como voltar e completar, porque isso não existe em nenhuma tela de edição
- **(a) Cadastro/vínculo de geradores na OS:** trazer pra Editar OS a mesma seleção de geradores do Criar OS (trocar/adicionar/remover quais geradores estão vinculados àquela OS) — cobre também corrigir se algo deu errado no cadastro feito ali (ex: marcou o gerador errado)
- **(b) Editar dados do gerador em si:** poder editar os campos cadastrais do gerador já existente (fabricante, potência etc.) — hoje não existe em lugar nenhum do app, só cadastro novo
- As duas confirmadas por Alexandre. Ainda sem implementar — só registrando.

**2. Quer a dinâmica e a aparência da tela de lista de OS do 8Confirma (print reenviado) + modo escuro/claro**
- Confirmou que quer a dinâmica descrita lá em cima em "Observações de print real do 8Confirma" (resumo com contadores por status, busca/filtro/ordenar, cards mais ricos com chips)
- Motivo: acha que a tela de lista de OS do nosso app hoje está "muito vazia" visualmente perto da do 8Confirma
- **Novo pedido: suporte a modo escuro e modo claro** (alternável) — não existia antes na lista de requisitos
- **Escopo confirmado (18/08):** afeta o app inteiro (tema global, não só a lista de OS), e a opção de alternar fica dentro do menu ☰ (item 4)
- Ainda sem implementar — só registrando

**3. Tela de login: capa com foto dos geradores + fundo branco + animação**
- **Capa:** vai usar uma foto que a Genforce já tem, focando só nos geradores (mandou um exemplo de banner promocional "5 DICAS..." só como referência de imagem — não quer o texto/faixa promocional, só o foco nos geradores; a foto definitiva escolhida ainda vai ser enviada)
- **Animação ao logar** — quer alguma animação de entrada na tela de login (ainda sem detalhe de como)
- **Layout confirmado com rascunho (18/08) — corrige minha suposição anterior:** não é foto em cima + card branco embaixo. É a foto cobrindo a tela **inteira** de fundo; por cima dela, a logo dentro de uma caixa escura (preta/cinza-escura, pra dar contraste — na versão dele a logo ficou branca sobre essa caixa) perto do topo; e os campos de "Login" e "Senha" como pílulas brancas arredondadas, soltas, flutuando direto sobre a foto (sem card/fundo branco por trás delas) — mais ou menos centralizados na metade de cima da tela
- Ele deixou claro que é só a ideia de layout — a cor exata da caixa da logo e outros detalhes finos ainda podem mudar, e ele está aberto a sugestão de algo parecido mas melhor
- **Sugestão aprovada (18/08):** manter exatamente esse layout (foto cheia + caixa escura da logo + campos em pílula flutuando), com o gradiente escuro sutil da metade pra baixo da foto pra legibilidade. Combinado: "vamos ver como fica, depois qualquer coisa mudamos" — ou seja, implementa assim e ajusta depois se precisar
- Referência antiga: usar a logo da Genforce trocando "Energia" por "Manutenções" — ainda vale, fica pra somar com a capa
- **Foto definitiva recebida (17/08):** mandou a foto dos geradores (fileira de GMGs FG Wilson, sem a faixa "5 DICAS"). **Atenção:** o arquivo que chegou é um print da galeria do celular dele, com um contador "1/1" no canto superior esquerdo gravado na própria imagem — preciso da foto limpa (sem esse indicador) e, se possível, na maior resolução que ele tiver, pra não ficar granulada em tela grande de computador
- **Sobre o tamanho pros dois acessos (celular e computador):** não preciso de arquivos em tamanhos diferentes — a forma certa de fazer isso numa PWA responsiva é usar uma imagem só, em boa resolução, e deixar o layout se ajustar sozinho (a imagem "cobre" o espaço disponível e corta as bordas de forma centralizada, então não distorce nem em tela estreita de celular nem em tela larga de computador). Só me falta a foto limpa em boa qualidade
- **Foto limpa recebida (17/08):** mandou uma segunda versão, 1080x1080, sem o "1/1" da galeria — só que essa vem com um filtro/tom azulado aplicado por cima da foto original
- **Cor confirmada (17/08):** não quer o tom azulado — prefere no estilo do primeiro print que mandou (o do banner "5 DICAS"), com a cor mais natural/original da foto, sem esse filtro forte
- **Logo da Genforce:** Alexandre confirmou que já tinha mandado antes (em outra conversa), mas esse arquivo não chegou aqui nesta sessão — preciso que reenvie a logo aqui pra eu poder usar
- **Logo recebida (17/08), mas ainda não aprovada:** mandou a logo atual ("genforce" em azul + "ENERGIA" espaçado embaixo, fundo branco) — ainda é a versão com "Energia" (não trocada por "Manutenções" ainda) e ele mesmo achou que não ficou legal; vai procurar uma versão com fundo transparente. Aguardando a versão final antes de formalizar
- **Logo final recebida (17/08):** versão em alta resolução com fundo transparente (PNG), salva em `assets-login/genforce-logo-transparente.png`. Essa é a que vai usar
- **Pendente pra quando formos implementar:** trocar o texto "ENERGIA" por "MANUTENÇÃO" na logo — como é uma imagem já finalizada (não um arquivo editável tipo vetor), vou precisar recriar esse texto por cima com fonte/estilo parecido, já que não dá simplesmente "editar" o texto de um PNG. Anotado, não esquecendo
- **Plano B combinado:** se "MANUTENÇÃO" não ficar bom visualmente (ex: não couber direito, ficar desproporcional), volta pra "ENERGIA" mesmo — não é regra fixa, é pra ficar bonito primeiro
- Foto de capa também já salva em `assets-login/foto-geradores-capa.jpg`, pronta pra quando formos implementar
- **Campos de login/senha:** bordas arredondadas — confirmado
- **Animação confirmada (17/08):** as duas juntas — efeito Ken Burns sutil (zoom lento) na foto de fundo + campos de login surgindo com fade/slide de baixo pra cima, **e** um brilho/pulso de luz atravessando a logo ao abrir (como se "ligasse"). Combinado que é só pra testar — se não ficar legal na prática, a gente troca depois
- **Confirmado (18/08): a animação se mantém igual**, mesmo depois de ajustar o entendimento do layout (foto cheia + caixa da logo + campos flutuantes). A correção foi só sobre a estrutura visual (onde fica cada elemento), não sobre a animação

**4. Menu hambúrguer (☰) na lista de OS: navegação + Relatório + Criar OS**
- Depois do login, na tela de lista de OS, adicionar um ícone de três barras (☰) no canto superior — abre um menu com as funções/telas do app (tipo configurações/navegação)
- Dentro desse menu:
  - Opção **"Relatório"**: escolhe/busca um cliente e vê todas as pendências daquele cliente — serve de controle pra quando o cliente pergunta se uma peça foi trocada e não lembra. **Regra confirmada:** só entra pendência já baixada (resolvida) pelo técnico; pendência aberta continua só na OS
  - Opção **"Criar OS"**: tira o botão fixo "+ Nova OS" que hoje fica solto na tela de lista, e move essa ação pra dentro do menu
  - Opção **"Importar clientes"** (confirmado 14/08): a telinha de importar arquivo do item 5 fica aqui dentro do menu, em vez de solta em algum lugar da tela — faz sentido, é uma função administrativa, não algo do dia a dia do técnico
- Alexandre vai adicionando mais opções no menu conforme surgirem (ex: mencionou lista mensal de clientes com dias de manutenção — feature futura já anotada na seção 5)
- Ainda sem implementar — só registrando. Visual do menu (como abre, o que aparece) também ainda não foi definido, fica pra quando formalizarmos

**5. Importar lista de clientes já pronta (em vez de cadastrar um por um)**
- Alexandre fez uma lista com todos os clientes da Genforce
- Quer que essa lista já esteja carregada no banco, pra na hora de criar uma OS o cliente já aparecer pra selecionar (sem precisar cadastrar manualmente cada um antes)
- Vai mandar um vídeo + a lista pra dar mais clareza de como estão organizados os dados (provavelmente for planilha/lista solta — formato exato ainda não sei)
- **Escopo confirmado:** por enquanto é só o nome do cliente cadastrado mesmo, o essencial. Endereço ele manda depois ou completa manualmente aos poucos — não é bloqueio, só ajuda já ter o cliente na lista pra selecionar
- **Vídeo e lista recebidos (14/08):** vídeo mostra o 8Confirma de verdade (confirma o domínio `genforce.confirm8.com` — é mesmo o Confirm8 da Uplogic, como eu tinha desconfiado); e o PDF `Genforce | Clientes` traz a lista completa exportada do 8Confirma: código, nome fantasia, razão social **e endereço completo** de ~50 clientes (embaixadas, condomínios, hospitais, shoppings, escritórios etc. — a maioria em Brasília/DF)
- Ou seja, já tenho o essencial (nome) **e** o endereço de bônus pra maioria — não preciso esperar mais nada pra montar a importação
- Não vi CNPJ nem gerador/unidade vinculado no PDF — só código, nome, razão social e endereço. Se precisar de CNPJ depois, cadastra manualmente aos poucos
- **Confirmado (14/08):** quer a telinha de "importar arquivo" dentro do app (não só um script único) — pra poder repetir a importação no futuro com novas levas de clientes, sem precisar de mim toda vez
- O vídeo também mostra a tela "Criar OS" do 8Confirma (campos: Cliente*, Item/Tag do Item + busca + QR code, Prioridade, Modalidade(s), Informações) e o seletor de cliente busca (campo "Procurar...", lista com nome + razão social) — é esse tipo de busca de cliente que você quer replicar
- Ainda sem implementar — só registrando

**6. "QR code" eliminado do escopo — "Modalidade" CORRIGIDO (18/08), não está mais eliminado**
- No vídeo do 8Confirma aparecem os campos "Modalidade(s)" e o botão de QR code na tela Criar OS
- QR code: mantido eliminado — a Genforce não usa, não implementar
- **Correção sobre Modalidade (18/08):** Alexandre revisou e percebeu que "Modalidade" no 8Confirma é a mesma coisa que o nosso campo "tipo de OS" (`TIPOS_OS` em `NovaOS.js`/`EditarOS.js`), só com outro nome — não é uma feature nova, é um relabel/realinhamento de algo que já existe
- **Quer continuar usando os valores de modalidade do 8Confirma como as opções de tipo de OS:** ATENDIMENTO DE EMERGÊNCIA, MANUTENÇÃO CORRETIVA, VISITA TÉCNICA, TESTE COM CARGA PROGRAMADO, MANUTENÇÃO PREVENTIVA — no lugar dos 4 que temos hoje (preventiva, corretiva, visita_tecnica, observacao)
- **Confirmado (18/08): multi-seleção.** Pode marcar mais de uma modalidade/tipo na mesma OS (ex: "Teste com Carga Programado" + "Manutenção Preventiva" juntas), com checkbox e chips removíveis — igual ao print que ele mandou de propósito pra mostrar como quer. O campo `tipo` no banco vai precisar virar uma lista (array ou tabela própria) em vez de um texto único
- Observação à parte (não é pedido, só documentando): no print aparece uma mensagem "Para a criação de OS é necessário ter pelo menos uma checklist selecionada" — sugere que no 8Confirma a Modalidade decide qual checklist é usado na OS. Nosso app já faz algo parecido, mas via o gerador/equipamento (cada equipamento tem seu `template_id`), não pela modalidade — não estou propondo mudar isso agora, só registrando a diferença
- Isso NÃO cancela mais nada da análise comparativa — só o QR code lá em cima continua marcado como eliminado

**7. Filtro de período com presets + calendário personalizado (Date Range Picker) — spec técnica recebida (17/08)**
- Alexandre mandou um documento (`especificacao-date-range-picker.md`, salvo na pasta do projeto) escrito por outro agente de IA, bem detalhado, especificando o mecanismo de seleção de período usado no 8Confirma
- **O que entendi da spec:**
  - Um filtro de período que abre um Bottom Sheet com presets rápidos: Hoje, Ontem, Amanhã, Mês Atual, Mês Anterior, Próximo Mês, e "Personalizado"
  - "Personalizado" abre um calendário mensal (navegação mês a mês, cabeçalho com mês/ano, dias da semana em pt-BR) onde o usuário toca a data inicial, o calendário continua aberto aguardando a segunda data, e ao tocar a segunda data o intervalo é destacado e aplicado **automaticamente** (sem botão "Aplicar")
  - Regra pra quando a segunda data é anterior à primeira: vira um novo início e o sistema volta a aguardar a data final
  - Datas dos presets sempre calculadas dinamicamente (nunca fixas tipo "hoje - 30 dias"), usando operações reais de calendário (trata dezembro→janeiro, fevereiro, ano bissexto etc. corretamente)
  - Separação entre intervalo "aplicado" (o que está valendo/consultando dados) e intervalo "em edição" (enquanto o usuário ainda está escolhendo) — evita mudar o filtro de verdade no meio da seleção
  - Ao mudar o intervalo aplicado: entra em loading, busca os dados de novo, e atualiza tudo que depende do período (contadores, lista) — navegar entre meses sem concluir a seleção NÃO deve disparar busca
  - Proteção contra resposta antiga de requisição sobrescrever uma busca mais nova (concorrência), estados de loading/vazio/erro bem diferenciados, e timezone explícito (não usar UTC sem querer)
  - Recomendação de usar uma biblioteca pronta de date range picker em vez de reinventar o motor de calendário
- **Como isso se conecta com o que já tínhamos:** esse é provavelmente o mecanismo por trás do bloco "Hoje — 13 AGO 2026" com botão de atualizar que eu já tinha documentado no item 2 (observações do print da lista de OS) — ali eu só tinha visto o resultado visual, agora tenho a lógica completa de como funciona
- **Escopo confirmado (17/08):** entra na tela de lista de OS, pra filtrar por período de forma prática (bate com o bloco "Hoje" que já tinha visto no print)
- **Uso do modo "Personalizado" confirmado pelo Alexandre (18/08):** escolhe uma data de início e uma data de fim, e no meio desse intervalo aparecem as manutenções agendadas que ele for cadastrando — é exatamente o uso que ele quer dar pra planejar/ver as manutenções do mês. Bate 100% com a spec técnica recebida (item acima) e com o item 8 (agenda) — confirma que o "Personalizado" resolve a necessidade de planejamento mensal sem precisar de nada além do que já está especificado
- Ainda sem implementar — só registrando e entendendo

**8. Calendário de agenda na tela inicial + status "Agendado" + remanejar OS pelo menu**
- Na tela inicial (lista de OS), quer um campo de calendário onde escolhe um dia do mês e vê quais manutenções estão agendadas pra aquele dia
- **Novo status: "Agendado"** — a adicionar na lista de status da OS (hoje é só pendente/andamento/pausada/concluída)
- **Objetivo (praticidade):** em vez de criar OS uma por uma no dia a dia, Alexandre quer criar as OS de vários clientes de uma vez, já com a data de manutenção definida, planejando o mês inteiro adiantado
- Essas OS ficam salvas também pros próximos meses (não é só do mês corrente)
- **Remanejar:** precisa de uma opção de remanejar a data da OS sem ter que excluir e criar de novo — Alexandre pediu pra colocar essa opção no menu de três pontos (⋮) de cada OS na lista (mesmo menu que já tem "Editar OS" e "Excluir OS")
- **Motivo:** ele faz muitas manutenções e precisa de um jeito de organizar/filtrar por dia acompanhando o calendário — hoje o campo `data_inicio_prevista` já existe no banco, mas não tem essa visão de calendário nem o atalho de remanejar rápido
- **Confirmado com vídeo (18/08): item 7 e item 8 são a MESMA peça.** Assisti ao vídeo de demonstração (arquivo cortado, `lv_0_202608170936494.mp4`) e o mecanismo de presets (Hoje/Ontem/Amanhã/Mês Atual/Mês Anterior/Próximo Mês/Personalizado) do item 7 é exatamente o que navega a "agenda": ao escolher "Amanhã", a lista mostrou a OS #10285 (Banco Central - Unibacen, "APOIO PROGRAMADO") já criada com data futura — ou seja, criar OS com data futura + usar esse filtro de período é como se vê a agenda de cada dia
- **Confirmado no vídeo: o chip azul (ícone de calendário) na barra de contadores é o status "Agendado"** — no print de "Amanhã" ele foi de 0 pra 1 exatamente na OS futura, então esse é o ícone/cor desse status (os outros já eram conhecidos: vermelho=urgente, laranja-relógio=em aberto, laranja-pausa=pausada, verde=concluída, cinza=arquivada)
- Não precisa de uma tela de calendário separada, então — o "escolher o dia e ver o que tem" é resolvido pelo próprio filtro do item 7 (incluindo o modo "Personalizado" pra escolher uma data específica fora dos atalhos)
- Ainda faltam confirmar/implementar: o "remanejar" no menu de três pontos, e o status "Agendado" entrando na lista de status do nosso app
- Ainda sem implementar — só registrando

**9. Cards da lista de OS: cor por status + bordas redondas (18/08)**
- Mandou mais dois vídeos (`lv_0_202608170936495.mp4`, `lv_0_202608170936496.mp4`) mostrando o 8Confirma
- No primeiro: cada card da lista tem uma borda lateral colorida batendo com o status daquela OS (ex: azul pro status "Agendado"), e essa borda é bem arredondada, acompanhando o card inteiro — não é uma linha reta simples
- No segundo: dá pra ver a tela de detalhe da OS do 8Confirma também — cabeçalho inteiro colorido pelo status (ex: verde quando "CONCLUÍDO"), com barra de progresso "Todas Atividades 185/230 [80%]", check-in/check-out, lista de colaboradores (vários técnicos na mesma OS), e abas embaixo (Informações, Cliente, Resumo). Isso não foi pedido ainda, só documentando o que vi — nosso app já mostra check-in/check-out e afins, mas de um jeito bem mais simples
- **Pedido confirmado:** aplicar cor por status nos cards da lista de OS (já temos uma versão disso — borda colorida por status — mas precisa cobrir todos os status, incluindo "Agendado" do item 8) **e** deixar as bordas dos cards redondas
- Ainda sem implementar — já entra no checklist de implementação, junto com o resto da lista de OS (item 3 do checklist)

**10. Tela de detalhe da OS: cabeçalho colorido por status + lista de técnicos com acesso (18/08, confirmado mas de baixa prioridade agora)**
- Confirmado: quer o cabeçalho da tela de detalhe da OS colorido pelo status também (igual o vídeo mostrou — verde quando concluída, etc.), mesma lógica de cor do item 9
- Confirmado: quer mostrar os técnicos que têm acesso àquela OS (como "colaboradores" no vídeo)
- **Pré-requisito:** pra isso funcionar direito, precisa primeiro cadastrar as outras contas de usuário no sistema (hoje provavelmente só a conta do Alexandre existe) — a equipe é 5 técnicos + 1 supervisor + 2 admin, já mapeado lá na seção 5 do requisitos, mas ainda não foi feito
- **Combinado:** isso fica pra mais pra frente. Prioridade agora é rodar/testar o que já existe no app antes de continuar empilhando mudanças
- Ainda sem implementar — registrado, baixa prioridade por enquanto
-
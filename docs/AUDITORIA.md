# Auditoria GenForce — UX, visual e técnica

Escopo auditado: app Expo/React Native Web (`app/`), testado em localhost:8081 (mesmo Supabase do app ao vivo).
Telas vistas no navegador: Login, Lista de OS (home), menu, Detalhe da OS (finalizada), Importar clientes.
Telas avaliadas **só pelo código** nesta rodada: Desempenho, Lista de OS (relatório), Lista de peças, Nova/Editar OS, Clientes, Gestão de usuários.
Screenshots "antes": `docs/screenshots/antes/`.

## Problemas

| # | Sev. | Tela | Problema | Correção proposta |
|---|------|------|----------|-------------------|
| 1 | Alto | Global | Não há design system. ~290 cores hex soltas em 24 arquivos (OSDetail 77, ListaOS 32, EditarOS 22…). Paleta padrão iOS (#007AFF), cinza sem critério. | Tokens únicos em `lib/tema.js` + componentes base. |
| 2 | Alto | Navegação | Só existe menu hambúrguer em texto puro; no desktop a tela vira uma coluna esticada em 1440px. Sem sidebar, sem indicação de onde o usuário está. | Sidebar fixa no desktop, drawer no mobile, item ativo destacado, ícones. |
| 3 | Alto | Desempenho | "Dashboard" é só ranking de assinaturas. Não responde "como está a operação agora?". | Painel com KPIs por status, pendências/atrasadas em destaque, ranking mantido. |
| 4 | Alto | Global | `avisar`/`confirmarAcao` usam `window.alert/confirm` na web: bloqueantes, feios, sem identidade. | Toast e modal de confirmação próprios (mantendo a mesma API). |
| 5 | Médio | Global | Loading é spinner solto ou tela branca (detalhe da OS). | Skeletons nas listas e no detalhe. |
| 6 | Médio | Lista de OS | Filtros de status como chips com contagem ok, mas cores de status fortes e saturadas (vermelho/amarelo/azul-escuro) sem sistema; card com título azul gritante. | Badge de status suave (fundo tingido + texto), hierarquia de card revista. |
| 7 | Médio | Lista de OS | Estado vazio é só texto ("Nenhum resultado…"). | Empty state com ícone e ação. |
| 8 | Médio | Acessibilidade | Só 5 ocorrências de `accessibility*`/`hitSlop` em todo o código; vários alvos de toque < 44px (chips, "⋮"). | Alvos ≥44px, `accessibilityRole/Label` nos componentes base. |
| 9 | Médio | Global | Emojis como ícones (📄 🌙 ☀️ ⊖ ▶) e glifos de texto (☰ ↻). Aparência inconsistente entre plataformas. | Conjunto de ícones SVG inline único. |
| 10 | Baixo | Console | Warnings: `shadow*` deprecated, `props.pointerEvents` deprecated (react-native-web). | Trocar por `boxShadow` / `style.pointerEvents`. |
| 11 | Baixo | Tipografia | Sem `fontFamily` definida em nenhum lugar: cai na fonte do sistema. | Inter (web) como padrão, números tabulares em métricas. |
| 12 | Baixo | Arquitetura | `OSDetail.js` com 2.877 linhas; navegação por ~10 flags de estado em `App.js` (sem URL: refresh volta à home, botão voltar do navegador não funciona). | **Não** mexer agora (risco); registrado como dívida. |
| 13 | Baixo | Repo | Sem lint, typecheck ou testes. | Listar como pendência; não adicionado nesta rodada. |
| 14 | Info | Dados | Contagem "Finalizado" divergiu entre dois acessos (1 no Chrome do usuário, 0 no painel local) no mesmo dia. Suspeita: fuso/intervalo de "Hoje". Precisa investigar. | Investigar `limitesConsulta`/`hojeNoTimezone`. |

## Diagnóstico visual
O app parece "comum" porque: (a) usa o azul padrão do iOS e cinzas neutros sem temperatura; (b) tudo tem o mesmo peso — título, card, filtro e botão competem; (c) bordas finas em todos os elementos no lugar de superfícies em camadas; (d) nenhum elemento de marca fora do login; (e) layout de celular esticado no desktop.

**Direção:** clean e confiável, acento **azul-índigo elétrico** (energia sem clichê industrial) sobre neutros frios calibrados; superfícies brancas sobre fundo cinza-azulado muito claro; sombras leves em camadas; raios médios (10–14px); status em badges suaves; Inter; números tabulares.

## Plano em lotes
1. **Fundação:** tokens (cores, raios, sombras, espaçamento, tipografia) em `lib/tema.js`; componentes base em `components/ui`.
2. **Quick wins:** toast/confirmação próprios, badges de status, empty states, skeletons, warnings do console.
3. **Estrutura:** sidebar/drawer, home (lista de OS) redesenhada.
4. **Painel operacional** (substitui "Desempenho" mantendo o ranking).
5. **Propagação** da paleta nas demais telas via tokens.
6. **Verificação** e relatório.

## Status após a implementação
Resolvidos: 1 (tokens), 2 (sidebar/barra inferior), 3 (painel), 4 (toast/confirmação), 5 (skeletons nas listas e detalhe), 6, 7, 10, 11, 14 parcial (não investigado).
Parcial: 8 (componentes novos acessíveis; telas antigas não auditadas), 9 (ícones novos nas telas redesenhadas; emojis seguem nas demais).
Não tratados: 12, 13. Ver `docs/RELATORIO.md`.

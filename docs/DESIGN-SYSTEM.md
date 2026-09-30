# Design system GenForce

Fonte única de verdade: `app/lib/tema.js` (tokens) e `app/components/ui/` (componentes base).

## Princípios
1. **Clean e confiável:** muito espaço em branco, superfícies brancas sobre fundo cinza-azulado, poucas cores com propósito.
2. **Uma cor de marca:** azul elétrico `#2F55E8` (próximo ao azul do logotipo), usado em ação principal, item ativo e foco.
3. **Status sempre legível:** cor do status = ponto colorido + badge de fundo suave com texto de contraste AA. Nunca só cor.
4. **Mobile é primeira classe:** alvos de toque ≥ 44px, barra inferior no celular, sidebar no desktop (≥ 1024px).
5. **Sem estilos soltos:** cores vêm de `useTema().cores`; raios, espaços e sombras dos tokens.

## Tokens (`lib/tema.js`)
| Token | Uso |
|---|---|
| `cores.fundo` / `fundoCard` / `fundoSecundario` | Página / cartão / áreas recuadas |
| `cores.texto` / `textoSecundario` / `textoSuave` | Texto principal / apoio / auxiliar (todos ≥ 4.5:1 sobre o fundo claro) |
| `cores.primario`, `primarioFundo`, `primarioTexto`, `sobrePrimario` | Marca |
| `cores.sucesso/alerta/erro/info` (+ `…Fundo`) | Semânticas |
| `cores.borda`, `bordaInput`, `foco` | Bordas e anel de foco |
| `RAIO` | `sm 8`, `md 12`, `lg 16`, `pill` |
| `ESPACO` | `4, 8, 12, 16, 24, 32` |
| `FONTE` | Inter (carregada no web), escala `12–28`; números tabulares globais |
| `SOMBRA` | `sm`, `md`, `lg` em camadas (`boxShadow`) |
| `MOVIMENTO` | 150ms / 200ms |
| `ALVO_TOQUE` | 44 |
| `COR_MARCA` | Azul de marca estático, para `StyleSheet` que não acessa o tema |

Modo claro e escuro têm o mesmo conjunto de chaves. Status de OS: `lib/constantes.js` (`COR_STATUS`, `estiloBadgeStatus`).

| Status | Cor sólida |
|---|---|
| Agendado | azul `#3B82F6` |
| Pendente | vermelho `#EF4444` |
| Andamento | âmbar `#F59E0B` |
| Pausada | roxo `#A855F7` |
| Concluída | verde `#22C55E` |
| Finalizado | cinza-azulado `#94A3B8` |

## Componentes (`components/ui`)
- **`Botao`** — `variante`: `primario | secundario | fantasma | perigo`; `tamanho`: `md | sm`; `icone`, `carregando`, `desabilitado`, `cheio`.
  `<Botao titulo="Nova OS" icone="plus" onPress={...} />`
- **`Badge` / `BadgeStatus`** — `<BadgeStatus status="andamento" />`; `<Badge tom="sucesso">Ok</Badge>`.
- **`Icone`** — conjunto único de ícones SVG (web). `<Icone nome="search" tamanho={18} cor={cores.textoSuave} />`. Nomes em `Icone.js`.
- **`FeedbackHost`** — montado em `App.js`; dá vida a `avisar()` (toast) e `confirmarAcao()` (modal) de `lib/avisos.js`. A API antiga foi mantida.
- **`Skeleton`** — `SkeletonBloco`, `SkeletonCardOS`, `SkeletonListaOS`.
- **`EstadoVazio`** — ícone + título + texto + ação; `tom="erro"` para falhas.
- **`AppShell`** (`components/AppShell.js`) — sidebar (desktop) / barra inferior + folha "Mais" (mobile). Itens definidos em `App.js`.

## Regras de uso
- Uma ação primária por tela (`Botao` primário). Ações destrutivas sempre via `confirmarAcao`.
- Listas: skeleton ao carregar, `EstadoVazio` quando vazio, `EstadoVazio tom="erro"` com "Tentar de novo" em falha.
- Não usar emoji como ícone; usar `Icone`.
- Toda cor nova entra primeiro em `TEMAS`, nos dois modos.

## Limites conhecidos
- `Icone` renderiza SVG só na web (no nativo reserva o espaço). O app hoje é servido na web (Vercel).
- Telas de formulário longas (Nova OS, Editar OS, detalhe da OS em profundidade) herdam a nova paleta pelos tokens, mas ainda não usam todos os componentes base.

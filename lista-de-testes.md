# Lista de Testes — App Genforce (manutenção de geradores)

> Documento vivo. Marque ✅ (ok) ou ❌ (bug) em cada item e anote observações na frente.
> Gerada em 13/08/2026 com base no código atual do app.

## 1. Login
- [ ] Login com e-mail/senha válidos entra normalmente
- [ ] Login com senha errada mostra mensagem de erro clara
- [ ] App carrega a lista de OS automaticamente após o login

## 2. Lista inicial de OS
- [ ] Card de cada OS mostra número, status, cliente, tipo e descrição
- [ ] Borda colorida bate com o status: vermelho (não iniciada), amarelo (check-in feito), verde (check-out feito)
- [ ] Botão "+ Nova OS" abre a tela de criação
- [ ] Menu de três pontos (⋮) abre com opções "Editar OS" e "Excluir OS"
- [ ] Excluir OS pede confirmação antes de apagar
- [ ] Excluir uma OS que tinha pendência vinculada: a pendência continua existindo (só perde a referência à OS)
- [ ] Botão "Sair" desloga corretamente

## 3. Nova OS
- [ ] Consigo selecionar um cliente já existente
- [ ] Consigo cadastrar um cliente novo direto na tela
- [ ] Consigo selecionar uma unidade já existente
- [ ] Consigo cadastrar uma unidade nova direto na tela
- [ ] Endereço/localização da unidade aparece ao selecionar ou cadastrar
- [ ] Consigo marcar um gerador já existente
- [ ] Consigo marcar mais de um gerador na mesma OS
- [ ] Consigo cadastrar um gerador novo direto na tela
- [ ] Os 4 tipos de OS aparecem certos: Preventiva, Corretiva, Visita Técnica, Observação
- [ ] Campo de data prevista da manutenção funciona
- [ ] Campo de descrição salva certo
- [ ] OS criada aparece na lista inicial com status correto

## 4. Editar OS
- [ ] Consigo mudar o tipo da OS
- [ ] Consigo mudar o status da OS
- [ ] Consigo mudar a descrição
- [ ] Alterações refletem na lista inicial depois de salvar

## 5. Check-in / Check-out
- [ ] Botão de check-in registra horário e pede permissão de localização
- [ ] Horário do check-in aparece na tela depois de registrado
- [ ] Status da OS muda pra "andamento" após check-in
- [ ] Checklist só pode ser preenchido depois do check-in (tentar antes deve travar)
- [ ] Check-out só libera se o relatório estiver salvo e completo (testar tentar sem preencher tudo)
- [ ] Editar algo no checklist depois de já ter salvo invalida a liberação do check-out até salvar de novo
- [ ] Horário do check-out aparece na tela depois de registrado
- [ ] Status da OS muda pra "concluída" após check-out

## 6. Checklist
- [ ] Itens carregam certos pro template "Preventiva Completa GMG" (67 itens no total)
- [ ] Itens de múltipla escolha (opções) funcionam
- [ ] Itens numéricos (tensão, RPM, pressão, temperatura) aceitam valor numérico
- [ ] Campo de observação por item salva certo
- [ ] Campo de observação geral no fim da OS salva certo
- [ ] Botão único "Salvar Relatório" salva tudo de uma vez (respostas + observações)
- [ ] Indicador visual mostra se o relatório está salvo ou não
- [ ] Recarregar a página mantém as respostas salvas
- [ ] Com mais de um gerador na mesma OS, as respostas de um gerador não aparecem no outro (mesmo usando o mesmo template)
- [ ] Botão "🔄 Atualizar" busca dados frescos do servidor

## 7. Fotos no checklist
- [ ] Ícone de câmera tira foto na hora
- [ ] Ícone de galeria permite escolher foto já existente
- [ ] Miniatura da foto aparece depois de anexada
- [ ] Consigo colocar legenda na foto (ícone de lápis)
- [ ] Consigo excluir a foto (ícone de X)
- [ ] Foto funciona certo acessando pelo navegador do celular (PWA)

## 8. Pendências
- [ ] Consigo registrar uma pendência nova durante a manutenção
- [ ] Pendências antigas do equipamento aparecem em manutenções seguintes
- [ ] Contador de dias em aberto aparece certo em cada pendência
- [ ] Botão "Realizado" dá baixa na pendência
- [ ] Observação é obrigatória pra dar baixa (não deve deixar salvar em branco)
- [ ] Consigo editar o texto de uma pendência já relatada (ícone de lápis)
- [ ] Consigo anexar foto/galeria no campo da pendência
- [ ] Aba de pendências aparece na tela inicial

## 9. Geral / PWA
- [ ] Acesso via link no navegador do celular funciona sem precisar instalar nada
- [ ] Não trava em nenhuma tela por causa de `Alert.alert` no navegador (esse bug já foi corrigido antes, mas vale reconferir se apareceu de novo em alguma tela nova)
- [ ] App funciona bem tanto no celular quanto no computador (painel ainda não existe, mas o app mobile via navegador do PC)

---

## Anotações livres
<!-- Espaço pra anotar bugs, comportamento estranho ou ideias que surgirem durante o teste -->
-

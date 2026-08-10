# Requisitos do App — Melhorias sobre o 8Confirma

> Documento vivo. Atualize esta lista conforme forem surgindo novas ideias durante o desenvolvimento.

## Status
- [ ] Não iniciado
- [ ] Em desenvolvimento
- [ ] Em teste piloto
- [ ] Em produção

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
-
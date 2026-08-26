# CRM Comercial 360 CIAFAL — Auditoria de Template (Fase 1)

## Componentes Mantidos

- Chat/Conversas (WhatsApp inbox, mensagens, mídias)
- CRM (contatos, empresas, pipeline Kanban, stages customizáveis)
- Tarefas (Kanban, drag-drop, prioridades, vinculação a mensagens)
- Agentes IA (configuráveis com Skip AI)
- Multi-usuário (accounts, account_members, account_invites)
- Categorias (tags coloridas)
- Filtros e busca
- Realtime (WebSocket via PocketBase)
- Hooks de dados (use-whatsapp, use-crm, use-tasks, use-categories, etc.)

## Componentes Adaptados

- Design system: verde → azul CIAFAL (Pantone 2945 C)
- Layout: logo e navegação ajustados para identidade CIAFAL
- Home: conceito "Meu Dia" iniciado
- Index/Landing: mantida funcional, cores ajustadas

## Componentes a Substituir (fases futuras)

- Acoplamento direto à Evolution API → WhatsAppProvider (Fase 4)
- CRM pipeline simples → Pipeline Comercial CIAFAL (Fase 6)
- Auth PocketBase direto → IdentityProvider abstrato (Fase 2)

## Componentes a Remover (fases futuras)

- Cadastro público de conta (quando AD/SSO for integrado)

## Arquitetura de Providres (criada na Fase 1)

- `src/providers/IdentityProvider.ts`
- `src/providers/ERPProvider.ts` (SAP ECC)
- `src/providers/WhatsAppProvider.ts` (Meta/Evolution)
- `src/providers/TelephonyProvider.ts` (VoIP/PABX)
- `src/providers/AIProvider.ts` (AI Gateway)
- `src/providers/NotificationProvider.ts`
- `src/providers/FileStorageProvider.ts`

## Banco de Dados (PocketBase — existente)

- 55 migrations aplicadas
- Coleções: users, accounts, whatsapp_instances, conversations, whatsapp_messages, crm_contacts, crm_companies, crm_stages, ai_agents, tasks, categories, account_members, account_invites, mark_read_queue

## Próximas Fases

- Fase 2: Segurança e Usuários (RBAC, RLS, hierarquia)
- Fase 3: Cliente 360 + SAP Read
- Fase 4: WhatsApp Meta Provider
- Fase 5: IA WhatsApp (áudio, transcrição, intenção)
- Fase 6: Pipeline Comercial completo

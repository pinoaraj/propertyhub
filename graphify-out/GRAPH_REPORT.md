# Graph Report - C:\Users\JP\Documents\Default Project  (2026-10-01)

## Corpus Check
- Corpus is ~26,856 words - fits in a single context window. You may not need a graph.

## Summary
- 200 nodes · 194 edges · 8 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 27 edges
2. `getCalendarProvider()` - 9 edges
3. `formatDate()` - 8 edges
4. `formatDateTime()` - 8 edges
5. `createAuditLogEntry()` - 8 edges
6. `scoreMaintenanceUrgency()` - 6 edges
7. `GoogleCalendarProvider` - 6 edges
8. `MicrosoftCalendarProvider` - 6 edges
9. `getAllCalendarProviders()` - 6 edges
10. `formatTime()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `createAuditLogEntry()`  [INFERRED]
  src/app/api/tickets/route.ts → src/lib/db/repositories/audit-log-repository.ts
- `PATCH()` --calls--> `createAuditLogEntry()`  [INFERRED]
  src/app/api/tickets/[id]/route.ts → src/lib/db/repositories/audit-log-repository.ts
- `DELETE()` --calls--> `createAuditLogEntry()`  [INFERRED]
  src/app/api/tickets/[id]/route.ts → src/lib/db/repositories/audit-log-repository.ts
- `PATCH()` --calls--> `createAuditLogEntry()`  [INFERRED]
  src/app/api/tickets/[id]/status/route.ts → src/lib/db/repositories/audit-log-repository.ts
- `createMaintenanceTicketWithAI()` --calls--> `createAuditLogEntry()`  [INFERRED]
  src/lib/ai/services.ts → src/lib/db/repositories/audit-log-repository.ts

## Communities (44 total, 5 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (7): handleQuickAction(), handleSubmit(), formatDate(), formatDateTime(), formatTime(), getInitials(), truncate()

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (12): generateStructuredJson(), isAIConfigured(), buildUrgencyPrompt(), createMaintenanceTicketWithAI(), normalizeUrgencyAssessment(), scheduleMaintenanceVisitWithAI(), scoreMaintenanceUrgency(), DELETE() (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.19
Nodes (8): checkAvailabilityWithAI(), getDailyAgendaWithAI(), getAllCalendarProviders(), getCalendarProvider(), GoogleCalendarProvider, isTokenExpired(), refreshGoogleToken(), refreshMicrosoftToken()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `getCalendarProvider()` connect `Community 3` to `Community 2`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `getCalendarProvider()` (e.g. with `scheduleMaintenanceVisitWithAI()` and `checkAvailabilityWithAI()`) actually correct?**
  _`getCalendarProvider()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `createAuditLogEntry()` (e.g. with `POST()` and `PATCH()`) actually correct?**
  _`createAuditLogEntry()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
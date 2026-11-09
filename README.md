# Claude Token Audit

Audit local de ta consommation Claude Code : ce qui passe par le modèle, ce que ça coûte, où ça fuit, et un plan d'action rédigé par Claude.

Tout est lu depuis `~/.claude/projects/**` (les transcripts JSONL de Claude Code, sous-agents compris). Rien ne sort de ta machine, sauf le résumé chiffré envoyé à `claude -p` quand tu demandes des conseils.

## Lancer

```bash
pnpm install
pnpm dev          # API sur 127.0.0.1:4747 + dashboard Vite sur http://127.0.0.1:5174
```

En CLI, sans dashboard :

```bash
pnpm report       # constats des 30 derniers jours dans le terminal
pnpm advise       # plan d'action de Claude (1 appel Sonnet, quelques centimes)
```

`pnpm start` construit le front et sert tout depuis `127.0.0.1:4747`.

## Ce que l'audit mesure

| Constat | Ce qui est détecté |
|---|---|
| Contexte fixe | Tokens chargés avant ton premier message : prompt système, définitions d'outils, skills, outils MCP différés, CLAUDE.md, MEMORY.md, découpés bloc par bloc |
| Serveurs MCP inutilisés | Serveurs et connecteurs dont les outils sont injectés à chaque requête mais (presque) jamais appelés |
| Skills jamais invoqués | Descriptions de skills relues à chaque requête sans un seul appel sur la période |
| Cache réécrit | Requêtes qui repaient tout le contexte au prix d'écriture, avec la cause : pause > TTL, compaction, changement de modèle, outils modifiés |
| Gros résultats d'outils | Résultats > 5k tokens, multipliés par le nombre de requêtes qui les ont relus |
| Contexte trop chargé | Sessions qui tournent au-delà de 130k tokens de contexte moyen |
| Relectures | Mêmes fichiers lus 3 fois ou plus dans une session |
| Échecs d'outils | Chaque échec coûte un aller-retour modèle |
| Sous-agents | Coût par type d'agent et par exécution |

## Mesurer l'effet d'un changement

Onglet **Avant / après** : note ce que tu as changé (connecteur coupé, `MEMORY.md` élagué, agents passés sur Sonnet…), à la date où tu l'as fait et pour un projet ou pour tous. L'audit compare les 7, 14 ou 30 jours d'avant et d'après sur des indicateurs ramenés au message et à la session (coût par message, contexte moyen, contexte fixe, cache réécrit, gros résultats d'outils, taux d'échec), pour que le volume d'activité ne fausse pas la lecture. Moins de 5 sessions d'un côté = résultat signalé comme à confirmer. Les changements apparaissent aussi en pointillés sur le graphique du coût par jour.

Les changements sont stockés dans `data/markers.json`.

## Comment les coûts sont calculés

Les montants sont en **équivalent prix API**, même sur un abonnement : c'est une unité commune pour comparer, pas une facture.

- Les tokens viennent de l'`usage` exact de chaque réponse (dédupliqué par message).
- Le prix d'entrée par modèle est **calibré** sur les `cost-state` que Claude Code enregistre lui-même. À défaut, on prend le prix par défaut de la famille (Opus, Sonnet, Haiku).
- Multiplicateurs : écriture cache ×1,25 (5 min) ou ×2 (1 h), lecture cache ×0,1, sortie ×5.
- Les tailles de blocs de contexte et de résultats d'outils sont estimées depuis les caractères, puis recalées sur le vrai nombre de tokens du premier appel.

## Structure

```
server/   cœur TS sans dépendance (Node 24, type stripping)
  src/transcripts/   parsing streaming des JSONL → SessionSummary
  src/ingest/        découverte + cache incrémental (data/sessions/)
  src/cost/          calibration des prix, coût par requête
  src/analysis/      métriques par session, détecteurs, rapport
  src/advice/        résumé chiffré → claude -p --json-schema
  src/server/        API HTTP locale
web/      Vite + React 19 + Tailwind v4 + shadcn (Base UI) + TanStack Query + Recharts
data/     cache et conseils générés (ignoré par git)
```

Ajouter un constat = un fichier dans `server/src/analysis/detectors/` qui retourne un `Finding`, puis l'enregistrer dans `all-detectors.ts`.

Variables : `CLAUDE_TRANSCRIPTS_DIR`, `AUDIT_API_PORT` (4747), `PORT` (Vite, 5174), `ADVICE_MODEL` (`sonnet`).

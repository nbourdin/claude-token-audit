# Claude Token Audit

Audit local de ta consommation Claude Code : ce qui passe par le modèle, ce que ça coûte, où ça fuit, et surtout **les actions pour corriger**, appliquées d'un clic, réversibles, et dont l'effet est mesuré.

La boucle : **analyser** (constats chiffrés) → **agir** (onglet Actions) → **mesurer** (onglet Avant / après, alimenté automatiquement par chaque action).

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
pnpm actions      # actions proposées ; `pnpm actions <clé>` en applique une
```

## Actions

Chaque action montre exactement ce qu'elle change avant d'être appliquée, se défait d'un clic (journal dans `data/actions.json`), et pose un repère dans « Avant / après ». Les propositions sont recalculées à partir de l'usage réel sur tout l'historique : rien n'est proposé pour ce qui sert.

| Action | Ce qu'elle change | Annuler |
|---|---|---|
| Garde-fou de contexte | Ajoute un hook `UserPromptSubmit` dans `~/.claude/settings.json` : alerte au-delà de 150k tokens de contexte (puis tous les 100k) et à la reprise d'une session après plus d'une heure (cache expiré). Ne bloque jamais, 60 ms. | Retire le hook |
| Retirer un serveur MCP | Retire de `~/.claude.json` un serveur jamais appelé ; sa config est gardée dans le journal | Remet la config exacte |
| Désactiver un plugin | `enabledPlugins[plugin] = false` dans `~/.claude/settings.json` | Remet la valeur d'avant |
| Archiver des skills | Déplace des skills jamais invoqués de `~/.claude/skills/` vers `~/.claude/skills-archived-by-token-audit/` | Les remet en place |
| Agent sur Sonnet | Ajoute `model: sonnet` dans le frontmatter d'un agent qui coûte cher (fichier versionné du projet) | Retire la ligne |
| Alléger un fichier | Pour chaque CLAUDE.md, MEMORY.md ou note mémoire au-dessus de sa cible : prompt adapté au type de fichier, à lancer dans Claude Code, puis « Marquer comme fait ». La vérification compare la taille par chargement avant / après | Retire le repère |
| Actions manuelles | Connecteurs claude.ai à couper, règle de sortie courte : instructions + prompt prêt à coller dans Claude Code, puis « Marquer comme fait » | Retire le repère |

### Vérification

Chaque action appliquée est vérifiée dans les transcripts des sessions démarrées après elle, et le journal affiche son statut :

- **Vérifiée** : l'élément a quitté le contexte (outils MCP, skills, plugin), le fichier allégé est chargé à sa nouvelle taille, ou l'agent tourne sur le nouveau modèle.
- **Effet partiel** ou **Sans effet** : il est encore chargé. L'outil cherche alors pourquoi (serveur aussi déclaré dans un `.mcp.json` ou pour un projet, plugin activé dans un `settings.json` de projet, skill revenu, connecteur claude.ai).
- **En place** ou **Retirée à la main** : pour le garde-fou, on vérifie la présence du hook ; son effet se lit dans Avant / après.

L'**économie mesurée** compare le contexte (ou le coût des exécutions d'agent) des sessions suivantes à la moyenne des 30 jours d'avant, sur l'activité réelle, ramenée au mois. Moins de 5 sessions observées = à confirmer.

### Ce que l'outil touche sur ta machine

- **Lecture seule** : `~/.claude/projects/**` (transcripts). Rien n'est envoyé ailleurs, sauf le résumé chiffré passé à `claude -p` quand tu demandes des conseils.
- **Écriture, seulement quand tu cliques sur « Appliquer »** : `~/.claude.json`, `~/.claude/settings.json`, `~/.claude/skills/`, et le frontmatter d'un fichier d'agent. Chaque écriture est atomique et réversible depuis le journal.
- **Journal local** : `data/actions.json` garde la config exacte des serveurs MCP retirés pour pouvoir les remettre, **jetons d'accès compris**. Le fichier est créé avec les droits `0600` et `data/` est exclu de git ; ne le partage pas.
- **API locale** : elle n'écoute que sur `127.0.0.1` et refuse les requêtes dont l'hôte n'est pas `localhost` (protection contre le DNS rebinding) ou qui viennent d'un autre site (protection CSRF).

Pour tester sans toucher ta config : `AUDIT_CLAUDE_HOME`, `AUDIT_CLAUDE_JSON` et `AUDIT_DATA_DIR` pointent l'outil vers des copies.

`pnpm start` construit le front et sert tout depuis `127.0.0.1:4747`.

## Ce que l'audit mesure

| Constat | Ce qui est détecté |
|---|---|
| Contexte fixe | Tokens chargés avant ton premier message : prompt système, définitions d'outils, skills, outils MCP différés, CLAUDE.md, MEMORY.md, découpés bloc par bloc |
| Fichiers trop lourds | CLAUDE.md, MEMORY.md, notes mémoire et fichiers `.claude` au-delà de leur taille cible, qu'ils soient chargés au démarrage, ajoutés quand Claude entre dans un dossier (CLAUDE.md imbriqués) ou lus par Claude. Détail par fichier dans l'onglet Contexte |
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

## Licence

MIT, voir [LICENSE](LICENSE).

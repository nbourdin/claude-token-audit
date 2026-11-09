export const DEMO_HOME = '/Users/demo'
export const DEMO_DAYS = 30
export const DEMO_SESSIONS = 64
export const LEGACY_SERVER_REMOVED_DAYS_AGO = 12

export type DemoProject = {
  name: string
  cwd: string
  branches: string[]
  titles: string[]
  memoryChars: number
  instructionsChars: number
  nestedInstructions: { path: string; chars: number } | null
  hotFiles: string[]
}

export const DEMO_PROJECTS: DemoProject[] = [
  {
    name: 'acme-shop',
    cwd: `${DEMO_HOME}/code/acme-shop`,
    branches: ['main', 'feat/checkout-v2', 'feat/search-filters', 'fix/cart-rounding'],
    titles: ['Refonte du tunnel de paiement', 'Filtres de recherche produits', 'Arrondi du panier en devise', 'Tests e2e du checkout', 'Migration vers React 19', 'Page compte client'],
    memoryChars: 16_500,
    instructionsChars: 7_000,
    nestedInstructions: { path: `${DEMO_HOME}/code/acme-shop/apps/web/CLAUDE.md`, chars: 24_000 },
    hotFiles: ['apps/web/src/features/checkout/checkout-form.tsx', 'apps/web/src/features/cart/cart-total.ts', 'apps/api/src/orders/order-service.ts'],
  },
  {
    name: 'billing-api',
    cwd: `${DEMO_HOME}/code/billing-api`,
    branches: ['main', 'feat/invoices-pdf', 'fix/vat-rates'],
    titles: ['Génération des factures PDF', 'Taux de TVA par pays', 'Webhooks de paiement', 'Index sur les écritures comptables'],
    memoryChars: 6_000,
    instructionsChars: 5_200,
    nestedInstructions: null,
    hotFiles: ['src/invoices/invoice-renderer.ts', 'src/payments/webhook-handler.ts'],
  },
  {
    name: 'mobile-app',
    cwd: `${DEMO_HOME}/code/mobile-app`,
    branches: ['main', 'feat/offline-mode'],
    titles: ['Mode hors ligne', 'Notifications push', 'Écran de profil'],
    memoryChars: 4_000,
    instructionsChars: 9_500,
    nestedInstructions: null,
    hotFiles: ['lib/sync/offline_queue.dart', 'lib/profile/profile_screen.dart'],
  },
]

export const BUILT_IN_TOOLS = [
  { name: 'Bash', chars: 9_000 },
  { name: 'Read', chars: 3_200 },
  { name: 'Edit', chars: 2_600 },
  { name: 'Write', chars: 1_800 },
  { name: 'Grep', chars: 3_400 },
  { name: 'Glob', chars: 1_300 },
  { name: 'Task', chars: 6_500 },
  { name: 'Skill', chars: 1_500 },
  { name: 'WebFetch', chars: 1_700 },
  { name: 'TodoWrite', chars: 5_200 },
]

export const MCP_SERVERS = [
  { name: 'browser-devtools', toolNames: ['navigate', 'click', 'take_screenshot', 'list_console_messages', 'evaluate_script', 'fill'], toolChars: 1_900, usedProbability: 0.25 },
  { name: 'jira', toolNames: ['search_issues', 'get_issue', 'create_issue', 'add_comment', 'transition_issue'], toolChars: 2_200, usedProbability: 0 },
  { name: 'postgres-explorer', toolNames: ['query', 'list_tables', 'describe_table'], toolChars: 2_000, usedProbability: 0 },
]

export const LEGACY_SERVER = { name: 'legacy-search', toolNames: ['search', 'index_status', 'reindex', 'get_document', 'list_sources', 'suggest'], toolChars: 2_600 }

export const NOTION_CONNECTOR_ID = '5f0c2a9e-7b1d-4c3e-9a2f-1e8d6b4c0a17'
export const NOTION_TOOLS = ['notion-search', 'notion-fetch', 'notion-create-pages', 'notion-update-page', 'notion-get-comments']

export const USER_SKILLS = [
  { name: 'commit-helper', usedProbability: 0.5 },
  { name: 'review-pr', usedProbability: 0.3 },
  { name: 'release-notes', usedProbability: 0.08 },
  { name: 'pdf-export', usedProbability: 0 },
  { name: 'slides-builder', usedProbability: 0 },
  { name: 'okr-tracker', usedProbability: 0 },
  { name: 'invoice-templates', usedProbability: 0 },
]

export const DEMO_PLUGIN = { id: 'design-kit@demo-plugins', name: 'design-kit', skills: ['wireframe', 'palette', 'icon-set', 'type-scale'] }

export const DEMO_AGENT = { type: 'code-reviewer', description: 'Revue de code avant merge' }

export const MAIN_MODEL = 'claude-opus-5-5'
export const SECONDARY_MODEL = 'claude-sonnet-5-5'

export const PROMPTS = [
  'Ajoute la validation du code postal dans le formulaire',
  'Les tests du panier échouent depuis ce matin, regarde',
  'Refactore ce service pour séparer le calcul des taxes',
  'Écris les tests manquants pour ce module',
  'Pourquoi cette requête est lente ?',
  'Corrige le typage, il reste des erreurs tsc',
  'Ok, applique la même chose aux autres écrans',
  'Fais une passe de revue avant que je merge',
  'Mets à jour la doc et le changelog',
]

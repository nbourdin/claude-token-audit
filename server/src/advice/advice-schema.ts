export type AdviceAction = {
  title: string
  why: string
  steps: string[]
  estimatedMonthlySavingUSD: number
  effort: 'S' | 'M' | 'L'
}

export type Advice = {
  headline: string
  actions: AdviceAction[]
  habits: string[]
}

export type StoredAdvice = {
  createdAt: number
  model: string
  filter: { sinceDays: number | null; project: string | null }
  costUSD: number
  advice: Advice
}

export const ADVICE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string', description: 'Le diagnostic en une phrase.' },
    actions: {
      type: 'array',
      minItems: 3,
      maxItems: 7,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          why: { type: 'string', description: 'Le chiffre du rapport qui justifie l’action.' },
          steps: { type: 'array', items: { type: 'string' }, description: 'Étapes concrètes : fichier, commande ou réglage exact.' },
          estimatedMonthlySavingUSD: { type: 'number' },
          effort: { type: 'string', enum: ['S', 'M', 'L'] },
        },
        required: ['title', 'why', 'steps', 'estimatedMonthlySavingUSD', 'effort'],
      },
    },
    habits: { type: 'array', items: { type: 'string' }, maxItems: 5, description: 'Habitudes de travail à changer.' },
  },
  required: ['headline', 'actions', 'habits'],
}

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const PERIODS = [
  { value: '7', label: '7 j' },
  { value: '30', label: '30 j' },
  { value: '90', label: '90 j' },
  { value: 'all', label: 'Tout' },
]

type PeriodFilterProps = {
  sinceDays: number | null
  onChange: (sinceDays: number | null) => void
}

export function PeriodFilter({ sinceDays, onChange }: PeriodFilterProps) {
  const current = sinceDays === null ? 'all' : String(sinceDays)
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      spacing={0}
      value={[current]}
      onValueChange={(values) => {
        const next = values[0]
        if (next) onChange(next === 'all' ? null : Number(next))
      }}
      aria-label="Période"
    >
      {PERIODS.map((period) => (
        <ToggleGroupItem key={period.value} value={period.value}>
          {period.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

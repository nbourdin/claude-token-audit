import { Card, CardContent } from '@/components/ui/card'

type KpiTileProps = {
  label: string
  value: string
  hint: string
}

export function KpiTile({ label, value, hint }: KpiTileProps) {
  return (
    <Card size="sm">
      <CardContent className="grid gap-0.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </CardContent>
    </Card>
  )
}

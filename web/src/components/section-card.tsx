import type { ReactNode } from 'react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type SectionCardProps = {
  title: string
  description?: ReactNode
  action?: ReactNode
  children?: ReactNode
}

export function SectionCard({ title, description, action, children }: SectionCardProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      {children && <CardContent className="min-w-0">{children}</CardContent>}
    </Card>
  )
}

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type ConfirmButtonProps = {
  label: ReactNode
  confirmLabel: string
  onConfirm: () => void
  isPending: boolean
  variant?: 'default' | 'outline' | 'destructive'
}

export function ConfirmButton({ label, confirmLabel, onConfirm, isPending, variant = 'default' }: ConfirmButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  if (!isConfirming) {
    return (
      <Button variant={variant} size="sm" onClick={() => setIsConfirming(true)} disabled={isPending}>
        {label}
      </Button>
    )
  }
  return (
    <span className="inline-flex gap-2">
      <Button
        variant={variant === 'outline' ? 'default' : variant}
        size="sm"
        disabled={isPending}
        onClick={() => {
          onConfirm()
          setIsConfirming(false)
        }}
      >
        {confirmLabel}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setIsConfirming(false)}>
        Annuler
      </Button>
    </span>
  )
}

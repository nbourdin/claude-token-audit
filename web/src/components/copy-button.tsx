import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const COPIED_FEEDBACK_MS = 1500

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [hasCopied, setHasCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setHasCopied(true)
    setTimeout(() => setHasCopied(false), COPIED_FEEDBACK_MS)
  }
  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {hasCopied ? <Check /> : <Copy />}
      {hasCopied ? 'Copié' : label}
    </Button>
  )
}

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useSessionDetailQuery } from '@/hooks/use-session-detail-query'
import { formatDateTime } from '@/lib/format'
import { SessionDetailContent } from './session-detail-content'

type SessionDetailSheetProps = {
  sessionId: string | null
  onClose: () => void
}

export function SessionDetailSheet({ sessionId, onClose }: SessionDetailSheetProps) {
  const detail = useSessionDetailQuery(sessionId)
  return (
    <Sheet open={sessionId !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="overflow-y-auto bg-muted data-[side=right]:w-full data-[side=right]:sm:max-w-5xl">
        <SheetHeader>
          <SheetTitle>{detail.data?.title ?? 'Session'}</SheetTitle>
          <SheetDescription>
            {detail.data
              ? `${detail.data.projectName}${detail.data.worktree ? ` · ${detail.data.worktree}` : ''} · ${detail.data.gitBranch} · ${formatDateTime(detail.data.startedAt)}`
              : 'Chargement…'}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          {detail.isError && <p className="text-destructive">{detail.error.message}</p>}
          {detail.isPending && <Skeleton className="h-80 w-full" />}
          {detail.data && <SessionDetailContent detail={detail.data} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}

const INLINE_CODE_PATTERN = /(`[^`]+`)/g

export function InlineCodeText({ text }: { text: string }) {
  return (
    <>
      {text.split(INLINE_CODE_PATTERN).map((part, index) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}

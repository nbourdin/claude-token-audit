# Claude Token Audit

Local audit of Claude Code token usage. See `README.md` for what it measures and how costs are computed.

- `server/` is dependency-free TypeScript run directly by Node 24 (type stripping): use only erasable syntax, `.ts` import extensions, no enums or parameter properties.
- `web/` imports server types only (`import type` from `@claude-token-audit/server/*`), never runtime code.
- One component, hook or detector per file. English names; UI copy in French.
- Never use `as any` / `as unknown`.
- A new waste pattern = a new file in `server/src/analysis/detectors/`, registered in `all-detectors.ts`.
- Transcript format changes between Claude Code versions: parsers must tolerate missing fields.
- Verify with `pnpm typecheck` and `pnpm report`; check the UI with `pnpm dev`.

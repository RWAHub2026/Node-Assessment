# Transfers — Node.js Exercise

A short Node.js exercise: add transfer fees and idempotent transfer handling to a small HTTP API.

Requirements are in [`ISSUE.md`](./ISSUE.md).

---

## Setup

```bash
npm install
npm test
```

Optional local server (localhost only):

```bash
npm run dev
```

All quality checks:

```bash
make check
```

Verify behavior primarily through the tests in `tests/`. Use `npm run dev` only for manual exploration.

---

## Files

```
src/
  transfer.ts   Types, fee helpers, validation
  store.ts      In-memory accounts and transfers
  app.ts        HTTP routing and handlers
  dev.ts        Local dev server entry point
tests/
  transfer.test.ts   Unit tests
  api.test.ts        HTTP integration tests
```

---

## Commands

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start a local server on `127.0.0.1:3000` |
| `npm test`           | Run tests                                |
| `npm run test:watch` | Watch mode                               |
| `make check`         | Format, lint, and test                   |

---

## Submit

- Updated source and tests
- Completed `DESIGN.md` (rename from `DESIGN.md.template`)

Preserve Git history if possible.

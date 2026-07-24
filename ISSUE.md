# Exercise: Transfer Fees and Idempotency

## Task

Extend a small in-memory transfer API. When money moves between accounts, support a configurable fee and safe retries via idempotency keys.

The starter code is intentionally incomplete. Focus on HTTP semantics, domain logic, concurrency, and tests.

---

## Requirements

### Transfer behavior

- `POST /transfers` moves money from one account to another.
- Request body:

```json
{
  "fromAccountId": "alice",
  "toAccountId": "bob",
  "amountCents": 10000,
  "idempotencyKey": "payroll-2026-04-01"
}
```

- A configurable **transfer fee percentage** applies to each transfer.
- Maximum fee is **5%**.
- The fee is deducted from the requested transfer amount.
- The recipient receives the remaining amount.
- The sender balance decreases by the full transfer amount.

Example — transfer **$100.00** with a **1%** fee:

|                         | Amount  |
| ----------------------- | ------- |
| Recipient receives      | $99.00  |
| Fee                     | $1.00   |
| Sender balance decrease | $100.00 |

### Idempotency

- Reusing the same `idempotencyKey` must **not** process the transfer twice.
- A retry with the same key and the same payload should return the original transfer with HTTP **200**.
- A retry with the same key but a **different payload** should return HTTP **409**.
- Store idempotency records in memory. No database required.

### Concurrency

- Two concurrent transfer requests from the same account must not overdraw the balance.
- The starter store is not safe under concurrency. Fix that.

### API surface

Implement or finish:

| Method  | Path             | Purpose                     |
| ------- | ---------------- | --------------------------- |
| `GET`   | `/health`        | Health check                |
| `GET`   | `/accounts/:id`  | Account balance             |
| `PATCH` | `/settings`      | Update `transferFeePercent` |
| `POST`  | `/transfers`     | Create a transfer           |
| `GET`   | `/transfers/:id` | Fetch a transfer by id      |

Use clear HTTP status codes and JSON error bodies.

### Validation

Reject:

- fee above 5%
- transfer amounts that exceed the sender balance
- transfers to the same account
- missing or blank `idempotencyKey`
- unknown accounts

Return useful error messages in JSON.

### Testing

Update the test suite to cover:

- transfer with a fee
- zero fee
- maximum fee
- invalid fee
- insufficient balance
- idempotent replay
- idempotency payload conflict
- concurrent transfers that would overdraw if handled naively

### Design notes

Complete `DESIGN.md` with assumptions, key decisions, concurrency approach, and trade-offs. Keep it brief.

---

## Constraints

- Stay within the existing files where possible.
- In-memory storage only — no database, queues, or external services.
- Node.js built-in modules only — no Express, Fastify, or similar frameworks.
- Avoid unnecessary abstractions.

---

## Time expectation

About **60–90 minutes**.

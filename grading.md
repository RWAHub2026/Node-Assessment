# Grading Guide

## Correctness (35)

- Fee calculation
- Fee validation
- Balance accounting
- Idempotent replay and conflict handling
- Existing tests still pass

## Concurrency (20)

- No overdraw under parallel requests
- Reasonable locking or serialization strategy
- No deadlocks or lost updates in the starter scope

## API Design (15)

- Appropriate status codes
- Consistent JSON shapes
- Useful error messages

## Tests (20)

- Happy path
- Failure path
- Edge cases
- Concurrency coverage

## Maintainability (5)

- Readability
- Naming
- Consistency

## Design (5)

- `DESIGN.md` completed
- Assumptions documented

import { describe, expect, it } from "vitest";

import {
  calculateTransferBreakdown,
  MAX_TRANSFER_FEE_PERCENT,
  validateFeePercent,
  validateTransferInput,
} from "@/transfer";

describe("transfer helpers", () => {
  it("validates fee percent", () => {
    expect(validateFeePercent(0)).toBeNull();
    expect(validateFeePercent(MAX_TRANSFER_FEE_PERCENT)).toBeNull();
    expect(validateFeePercent(MAX_TRANSFER_FEE_PERCENT + 1)).not.toBeNull();
    expect(validateFeePercent(-1)).not.toBeNull();
  });

  it("validates transfer input", () => {
    expect(
      validateTransferInput({
        fromAccountId: "alice",
        toAccountId: "bob",
        amountCents: 100,
        idempotencyKey: "key-1",
      }),
    ).toBeNull();

    expect(
      validateTransferInput({
        fromAccountId: "alice",
        toAccountId: "alice",
        amountCents: 100,
        idempotencyKey: "key-1",
      }),
    ).not.toBeNull();

    expect(
      validateTransferInput({
        fromAccountId: "alice",
        toAccountId: "bob",
        amountCents: 0,
        idempotencyKey: "key-1",
      }),
    ).not.toBeNull();
  });

  it("calculates transfer breakdown with a fee", () => {
    const breakdown = calculateTransferBreakdown(10_000, 1);

    expect(breakdown.amountCents).toBe(10_000);
    expect(breakdown.feeCents).toBe(100);
    expect(breakdown.netCents).toBe(9_900);
  });

  it("calculates transfer breakdown with zero fee", () => {
    const breakdown = calculateTransferBreakdown(5_000, 0);

    expect(breakdown.feeCents).toBe(0);
    expect(breakdown.netCents).toBe(5_000);
  });

  it("calculates transfer breakdown at the maximum fee", () => {
    const breakdown = calculateTransferBreakdown(
      10_000,
      MAX_TRANSFER_FEE_PERCENT,
    );

    expect(breakdown.feeCents).toBe(500);
    expect(breakdown.netCents).toBe(9_500);
  });
});

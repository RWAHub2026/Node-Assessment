export interface Account {
  id: string;
  balanceCents: number;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  feeCents: number;
  netCents: number;
  idempotencyKey: string;
  createdAt: string;
}

export interface AppSettings {
  transferFeePercent: number;
}

export interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  idempotencyKey: string;
}

export interface TransferBreakdown {
  amountCents: number;
  feeCents: number;
  netCents: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  transferFeePercent: 0,
};

export const MAX_TRANSFER_FEE_PERCENT = 5;

export function calculateTransferBreakdown(
  amountCents: number,
  feePercent: number,
): TransferBreakdown {
  // TODO: apply the configured fee percentage.
  return {
    amountCents,
    feeCents: 0,
    netCents: amountCents,
  };
}

export function validateFeePercent(feePercent: number): string | null {
  if (!Number.isFinite(feePercent) || feePercent < 0) {
    return "Fee must be zero or greater.";
  }

  if (feePercent > MAX_TRANSFER_FEE_PERCENT) {
    return `Fee cannot exceed ${MAX_TRANSFER_FEE_PERCENT}%.`;
  }

  return null;
}

export function validateTransferInput(
  input: CreateTransferInput,
): string | null {
  if (!input.idempotencyKey.trim()) {
    return "Idempotency key is required.";
  }

  if (input.fromAccountId === input.toAccountId) {
    return "Cannot transfer to the same account.";
  }

  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return "Transfer amount must be a positive integer number of cents.";
  }

  return null;
}

export function createTransferId(): string {
  return `tr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function stableTransferPayload(input: CreateTransferInput): string {
  return JSON.stringify({
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    amountCents: input.amountCents,
  });
}

import {
  calculateTransferBreakdown,
  createTransferId,
  DEFAULT_SETTINGS,
  stableTransferPayload,
  type Account,
  type AppSettings,
  type CreateTransferInput,
  type Transfer,
} from "./transfer.js";

export interface IdempotencyRecord {
  payloadHash: string;
  transferId: string;
}

export type CreateTransferResult =
  | { status: "created"; transfer: Transfer }
  | { status: "replay"; transfer: Transfer };

export class IdempotencyConflictError extends Error {
  constructor() {
    super("Idempotency key already used with a different payload.");
    this.name = "IdempotencyConflictError";
  }
}

export interface StoreSnapshot {
  accounts: Account[];
  transfers: Transfer[];
  settings: AppSettings;
}

export class TransferStore {
  private accounts = new Map<string, Account>();
  private transfers = new Map<string, Transfer>();
  private idempotencyRecords = new Map<string, IdempotencyRecord>();
  private accountLocks = new Map<string, Promise<void>>();
  private settings: AppSettings = { ...DEFAULT_SETTINGS };

  constructor(seedAccounts: Account[] = []) {
    for (const account of seedAccounts) {
      this.accounts.set(account.id, { ...account });
    }
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  setTransferFeePercent(transferFeePercent: number): void {
    this.settings = { ...this.settings, transferFeePercent };
  }

  getAccount(accountId: string): Account | undefined {
    const account = this.accounts.get(accountId);

    if (!account) {
      return undefined;
    }

    return { ...account };
  }

  getTransfer(transferId: string): Transfer | undefined {
    const transfer = this.transfers.get(transferId);

    if (!transfer) {
      return undefined;
    }

    return { ...transfer };
  }

  findIdempotencyRecord(idempotencyKey: string): IdempotencyRecord | undefined {
    const record = this.idempotencyRecords.get(idempotencyKey);

    if (!record) {
      return undefined;
    }

    return { ...record };
  }

  async createTransfer(
    input: CreateTransferInput,
  ): Promise<CreateTransferResult> {
    return this.withAccountLock(input.fromAccountId, () =>
      this.executeTransfer(input),
    );
  }

  private async withAccountLock<T>(
    accountId: string,
    fn: () => T | Promise<T>,
  ): Promise<T> {
    const previousLock = this.accountLocks.get(accountId) ?? Promise.resolve();
    let releaseLock!: () => void;
    const currentLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.accountLocks.set(
      accountId,
      previousLock.then(() => currentLock),
    );

    await previousLock;

    try {
      return await fn();
    } finally {
      releaseLock();
    }
  }

  private executeTransfer(input: CreateTransferInput): CreateTransferResult {
    const payloadHash = stableTransferPayload(input);
    const existingRecord = this.idempotencyRecords.get(input.idempotencyKey);

    if (existingRecord) {
      if (existingRecord.payloadHash !== payloadHash) {
        throw new IdempotencyConflictError();
      }

      const existingTransfer = this.transfers.get(existingRecord.transferId);

      if (!existingTransfer) {
        throw new Error("Transfer not found.");
      }

      return { status: "replay", transfer: { ...existingTransfer } };
    }

    const fromAccount = this.accounts.get(input.fromAccountId);
    const toAccount = this.accounts.get(input.toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error("Account not found.");
    }

    if (fromAccount.balanceCents < input.amountCents) {
      throw new Error("Insufficient balance.");
    }

    const breakdown = calculateTransferBreakdown(
      input.amountCents,
      this.settings.transferFeePercent,
    );

    fromAccount.balanceCents -= breakdown.amountCents;
    toAccount.balanceCents += breakdown.netCents;

    const transfer: Transfer = {
      id: createTransferId(),
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amountCents: breakdown.amountCents,
      feeCents: breakdown.feeCents,
      netCents: breakdown.netCents,
      idempotencyKey: input.idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    this.transfers.set(transfer.id, transfer);
    this.idempotencyRecords.set(input.idempotencyKey, {
      payloadHash,
      transferId: transfer.id,
    });

    return { status: "created", transfer: { ...transfer } };
  }

  snapshot(): StoreSnapshot {
    return {
      accounts: [...this.accounts.values()].map((account) => ({ ...account })),
      transfers: [...this.transfers.values()].map((transfer) => ({
        ...transfer,
      })),
      settings: { ...this.settings },
    };
  }
}

export function createDefaultStore(): TransferStore {
  return new TransferStore([
    { id: "alice", balanceCents: 100_000 },
    { id: "bob", balanceCents: 0 },
  ]);
}

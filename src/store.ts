import {
  createTransferId,
  DEFAULT_SETTINGS,
  type Account,
  type AppSettings,
  type CreateTransferInput,
  type Transfer,
} from "./transfer.js";

export interface IdempotencyRecord {
  payloadHash: string;
  transferId: string;
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

  findIdempotencyRecord(
    idempotencyKey: string,
  ): IdempotencyRecord | undefined {
    const record = this.idempotencyRecords.get(idempotencyKey);

    if (!record) {
      return undefined;
    }

    return { ...record };
  }

  createTransfer(input: CreateTransferInput): Transfer {
    const fromAccount = this.accounts.get(input.fromAccountId);
    const toAccount = this.accounts.get(input.toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error("Account not found.");
    }

    if (fromAccount.balanceCents < input.amountCents) {
      throw new Error("Insufficient balance.");
    }

    // TODO: apply transfer fees and idempotency handling.
    fromAccount.balanceCents -= input.amountCents;
    toAccount.balanceCents += input.amountCents;

    const transfer: Transfer = {
      id: createTransferId(),
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amountCents: input.amountCents,
      feeCents: 0,
      netCents: input.amountCents,
      idempotencyKey: input.idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    this.transfers.set(transfer.id, transfer);

    return { ...transfer };
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

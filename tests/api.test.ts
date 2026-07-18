import { createServer, type Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "@/app";
import { TransferStore } from "@/store";

describe("transfer API", () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    const store = new TransferStore([
      { id: "alice", balanceCents: 100_000 },
      { id: "bob", balanceCents: 0 },
    ]);

    server = createServer(createApp({ store }));

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected server to bind to a TCP port.");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it("returns health status", async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("creates a transfer without a fee", async () => {
    const response = await fetch(`${baseUrl}/transfers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fromAccountId: "alice",
        toAccountId: "bob",
        amountCents: 10_000,
        idempotencyKey: "transfer-1",
      }),
    });

    expect(response.status).toBe(201);

    const transfer = await response.json();

    expect(transfer.feeCents).toBe(0);
    expect(transfer.netCents).toBe(10_000);

    const alice = await fetch(`${baseUrl}/accounts/alice`).then((res) =>
      res.json(),
    );
    const bob = await fetch(`${baseUrl}/accounts/bob`).then((res) => res.json());

    expect(alice.balanceCents).toBe(90_000);
    expect(bob.balanceCents).toBe(10_000);
  });

  it("applies a configured transfer fee", async () => {
    await fetch(`${baseUrl}/settings`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transferFeePercent: 1 }),
    });

    const response = await fetch(`${baseUrl}/transfers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fromAccountId: "alice",
        toAccountId: "bob",
        amountCents: 10_000,
        idempotencyKey: "transfer-fee-1",
      }),
    });

    expect(response.status).toBe(201);

    const transfer = await response.json();

    expect(transfer.feeCents).toBe(100);
    expect(transfer.netCents).toBe(9_900);

    const bob = await fetch(`${baseUrl}/accounts/bob`).then((res) => res.json());

    expect(bob.balanceCents).toBe(9_900);
  });

  it("rejects transfers above the available balance", async () => {
    const response = await fetch(`${baseUrl}/transfers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fromAccountId: "alice",
        toAccountId: "bob",
        amountCents: 200_000,
        idempotencyKey: "transfer-overdraft",
      }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/insufficient balance/i),
    });
  });

  it("replays the same transfer for the same idempotency key", async () => {
    const payload = {
      fromAccountId: "alice",
      toAccountId: "bob",
      amountCents: 5_000,
      idempotencyKey: "transfer-replay",
    };

    const first = await fetch(`${baseUrl}/transfers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const second = await fetch(`${baseUrl}/transfers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);

    const firstTransfer = await first.json();
    const secondTransfer = await second.json();

    expect(secondTransfer).toEqual(firstTransfer);

    const alice = await fetch(`${baseUrl}/accounts/alice`).then((res) =>
      res.json(),
    );

    expect(alice.balanceCents).toBe(95_000);
  });

  it("rejects idempotency key reuse with a different payload", async () => {
    await fetch(`${baseUrl}/transfers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fromAccountId: "alice",
        toAccountId: "bob",
        amountCents: 5_000,
        idempotencyKey: "transfer-conflict",
      }),
    });

    const response = await fetch(`${baseUrl}/transfers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fromAccountId: "alice",
        toAccountId: "bob",
        amountCents: 6_000,
        idempotencyKey: "transfer-conflict",
      }),
    });

    expect(response.status).toBe(409);
  });

  it("does not overdraw under concurrent transfers", async () => {
    const responses = await Promise.all(
      Array.from({ length: 2 }, (_, index) =>
        fetch(`${baseUrl}/transfers`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fromAccountId: "alice",
            toAccountId: "bob",
            amountCents: 60_000,
            idempotencyKey: `transfer-concurrent-${index}`,
          }),
        }),
      ),
    );

    const statuses = responses.map((response) => response.status).sort();

    expect(statuses).toEqual([201, 400]);

    const alice = await fetch(`${baseUrl}/accounts/alice`).then((res) =>
      res.json(),
    );
    const bob = await fetch(`${baseUrl}/accounts/bob`).then((res) => res.json());

    expect(alice.balanceCents).toBe(40_000);
    expect(bob.balanceCents).toBe(60_000);
  });
});

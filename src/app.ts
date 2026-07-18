import type { IncomingMessage, ServerResponse } from "node:http";

import { createDefaultStore, type TransferStore } from "./store.js";
import {
  validateFeePercent,
  validateTransferInput,
  type CreateTransferInput,
} from "./transfer.js";

export interface AppOptions {
  store?: TransferStore;
}

interface JsonRecord {
  [key: string]: unknown;
}

export function createApp(options: AppOptions = {}) {
  const store = options.store ?? createDefaultStore();

  return async function handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      const method = request.method ?? "GET";

      if (method === "GET" && url.pathname === "/health") {
        sendJson(response, 200, { status: "ok" });
        return;
      }

      if (method === "GET" && url.pathname.startsWith("/accounts/")) {
        const accountId = decodeURIComponent(url.pathname.slice("/accounts/".length));
        const account = store.getAccount(accountId);

        if (!account) {
          sendJson(response, 404, { error: "Account not found." });
          return;
        }

        sendJson(response, 200, account);
        return;
      }

      if (method === "PATCH" && url.pathname === "/settings") {
        const body = await readJsonBody(request);
        const transferFeePercent = body.transferFeePercent;

        if (typeof transferFeePercent !== "number") {
          sendJson(response, 400, {
            error: "transferFeePercent must be a number.",
          });
          return;
        }

        const feeError = validateFeePercent(transferFeePercent);

        if (feeError) {
          sendJson(response, 400, { error: feeError });
          return;
        }

        store.setTransferFeePercent(transferFeePercent);
        sendJson(response, 200, store.getSettings());
        return;
      }

      if (method === "POST" && url.pathname === "/transfers") {
        const body = await readJsonBody(request);
        const input = parseCreateTransferInput(body);
        const validationError = validateTransferInput(input);

        if (validationError) {
          sendJson(response, 400, { error: validationError });
          return;
        }

        try {
          const transfer = store.createTransfer(input);
          sendJson(response, 201, transfer);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Transfer failed.";

          sendJson(response, 400, { error: message });
        }

        return;
      }

      if (method === "GET" && url.pathname.startsWith("/transfers/")) {
        const transferId = decodeURIComponent(
          url.pathname.slice("/transfers/".length),
        );
        const transfer = store.getTransfer(transferId);

        if (!transfer) {
          sendJson(response, 404, { error: "Transfer not found." });
          return;
        }

        sendJson(response, 200, transfer);
        return;
      }

      sendJson(response, 404, { error: "Not found." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error.";

      sendJson(response, 500, { error: message });
    }
  };
}

function parseCreateTransferInput(body: JsonRecord): CreateTransferInput {
  return {
    fromAccountId: String(body.fromAccountId ?? ""),
    toAccountId: String(body.toAccountId ?? ""),
    amountCents: Number(body.amountCents),
    idempotencyKey: String(body.idempotencyKey ?? ""),
  };
}

async function readJsonBody(request: IncomingMessage): Promise<JsonRecord> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();

  if (!raw) {
    return {};
  }

  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }

  return parsed as JsonRecord;
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

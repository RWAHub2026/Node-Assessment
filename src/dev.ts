import { createServer } from "node:http";

import { createApp } from "./app.js";

const host = "127.0.0.1";
const port = 3_000;

const handleRequest = createApp();

const server = createServer((request, response) => {
  void handleRequest(request, response);
});

server.listen(port, host, () => {
  console.log(`Transfer API listening on http://${host}:${port}`);
  console.log("Use npm test for automated verification.");
});

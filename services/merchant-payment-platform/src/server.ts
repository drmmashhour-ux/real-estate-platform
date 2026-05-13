import { createApp } from "./app.js";

const port = Number(process.env["PORT"] ?? 3016);
const { server } = createApp();

server.listen(port, () => {
  console.log(`Merchant payment platform listening on ${port} in mock mode`);
});

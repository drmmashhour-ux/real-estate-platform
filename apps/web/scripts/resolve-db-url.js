const net = require("net");
const fs = require("fs");
const path = require("path");

if (process.env.NODE_ENV === "production") {
  console.log("Skipping DB resolve in production");
  process.exit(0);
}

const envPath = path.join(__dirname, "..", ".env.local");

function parseEnv(content) {
  const lines = content.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      value = value.replace(/^"|"$/g, "");
      env[key] = value;
    }
  }
  return env;
}

function writeDatabaseUrl(url) {
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
  }

  const lines = content
    .split(/\r?\n/)
    .filter((l) => {
      const t = l.trim();
      return !t.startsWith("DATABASE_URL=") && !t.startsWith("export DATABASE_URL=");
    });

  lines.push(`DATABASE_URL="${url}"`);

  fs.writeFileSync(envPath, lines.join("\n"));
}

function canConnect(host, port, timeout = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(Number(port) || 5432, host);
  });
}

(async () => {
  if (!fs.existsSync(envPath)) {
    console.error(".env.local not found");
    process.exit(1);
  }

  const raw = fs.readFileSync(envPath, "utf8");
  const env = parseEnv(raw);

  const mode = env.DB_MODE || "auto";
  const primary = env.PRIMARY_DATABASE_URL;
  const local = env.LOCAL_DATABASE_URL;

  if (!primary && mode !== "local") {
    console.error("PRIMARY_DATABASE_URL missing");
    process.exit(1);
  }

  if (!local && mode !== "neon") {
    console.error("LOCAL_DATABASE_URL missing");
    process.exit(1);
  }

  let selected = null;

  if (mode === "neon") {
    selected = primary;
    console.log("Using Neon DB (forced)");
  } else if (mode === "local") {
    selected = local;
    console.log("Using Local DB (forced)");
  } else {
    // AUTO MODE

    console.log("Checking Neon connectivity...");

    try {
      const neonUrl = new URL(primary);
      const neonOk = await canConnect(
        neonUrl.hostname,
        neonUrl.port || "5432",
      );

      if (neonOk) {
        selected = primary;
        console.log("Neon reachable → using Neon");
      } else {
        console.log("Neon unreachable → fallback to local");

        const localUrl = new URL(local);
        const localOk = await canConnect(
          localUrl.hostname,
          localUrl.port || "5432",
        );

        if (!localOk) {
          console.error("Local DB also unreachable");
          process.exit(1);
        }

        selected = local;
      }
    } catch (e) {
      console.error("Error parsing DB URLs");
      process.exit(1);
    }
  }

  writeDatabaseUrl(selected);

  console.log("DATABASE_URL resolved successfully");
})();

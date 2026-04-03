const { loadEnvFile } = require("./load-env");
const { loadConfig } = require("./config");
const { runGmailAuth } = require("./gmail-auth");
const { runReminder } = require("./jobs/run-reminder");

async function main() {
  loadEnvFile();
  const mode = process.argv[2] || "auto";

  if (mode === "gmail-auth") {
    await runGmailAuth(loadConfig());
    return;
  }

  await runReminder(mode);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

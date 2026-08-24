const test = require("node:test");
const assert = require("node:assert/strict");

const { SmtpSession } = require("../src/email/smtp-client");

function rejectedSession(response) {
  const session = Object.create(SmtpSession.prototype);
  session.socket = { write() {} };
  session.readResponse = async () => response;
  return session;
}

test("SMTP errors redact credential commands", async () => {
  const credential = Buffer.from("private-app-password", "utf8").toString("base64");
  const session = rejectedSession("535 Authentication failed");

  await assert.rejects(
    session.send(credential, [235], { sensitive: true }),
    (error) => {
      assert.match(error.message, /\[redacted credential\]/);
      assert.equal(error.message.includes(credential), false);
      return true;
    }
  );
});

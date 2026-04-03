const test = require("node:test");
const assert = require("node:assert/strict");

const { base64UrlEncode, createRawMessage } = require("../src/email/gmail-client");

test("createRawMessage includes standard mail headers", () => {
  const message = createRawMessage({
    from: "sender@gmail.com",
    to: "recipient@example.com",
    subject: "Study Digest - Tue Mar 31",
    text: "Hello"
  });

  assert.match(message, /^From: sender@gmail.com/m);
  assert.match(message, /^To: recipient@example.com/m);
  assert.match(message, /^Subject: Study Digest - Tue Mar 31/m);
  assert.match(message, /\r\n\r\nHello$/);
});

test("base64UrlEncode returns URL-safe output", () => {
  const encoded = base64UrlEncode("a+b/c=");
  assert.equal(encoded.includes("+"), false);
  assert.equal(encoded.includes("/"), false);
  assert.equal(encoded.includes("="), false);
});

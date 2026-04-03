function base64UrlEncode(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createRawMessage({ from, to, subject, text, html }) {
  if (!html) {
    const normalizedText = text.replace(/\r?\n/g, "\r\n");
    return [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      normalizedText
    ].join("\r\n");
  }

  const boundary = `----=_Part_${Math.random().toString(36).substring(2)}_${Date.now()}`;
  const date = new Date().toUTCString();

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${date}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`
  ].join("\r\n");

  const textPart = [
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: 8bit`,
    "",
    text.replace(/\r?\n/g, "\r\n")
  ].join("\r\n");

  const htmlPart = [
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: 8bit`,
    "",
    html.replace(/\r?\n/g, "\r\n")
  ].join("\r\n");

  return [
    headers,
    "",
    `This is a multi-part message in MIME format.`,
    "",
    `--${boundary}`,
    textPart,
    "",
    `--${boundary}`,
    htmlPart,
    "",
    `--${boundary}--`,
    ""
  ].join("\r\n");
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.error_description || payload.error?.message || payload.error || response.statusText;
    throw new Error(`Gmail API request failed: ${message}`);
  }

  return payload;
}

async function fetchAccessToken({
  clientId,
  clientSecret,
  refreshToken,
  tokenUri
}) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  });

  const payload = await fetchJson(tokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  return payload.access_token;
}

async function sendEmail({
  clientId,
  clientSecret,
  refreshToken,
  tokenUri,
  from,
  to,
  subject,
  text,
  html
}) {
  const accessToken = await fetchAccessToken({
    clientId,
    clientSecret,
    refreshToken,
    tokenUri
  });

  const raw = base64UrlEncode(
    createRawMessage({
      from,
      to,
      subject,
      text,
      html
    })
  );

  await fetchJson("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw })
  });
}

module.exports = {
  base64UrlEncode,
  createRawMessage,
  fetchAccessToken,
  sendEmail
};

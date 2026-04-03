const http = require("http");
const { URL } = require("url");

function buildAuthUrl({ clientId, redirectUri, scope }) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

async function exchangeAuthorizationCode({
  clientId,
  clientSecret,
  code,
  redirectUri,
  tokenUri
}) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error_description || payload.error || response.statusText;
    throw new Error(`Google OAuth token exchange failed: ${message}`);
  }

  if (!payload.refresh_token) {
    throw new Error("Google OAuth did not return a refresh token. Re-run consent with prompt=consent.");
  }

  return payload;
}

async function runGmailAuth(config) {
  if (!config.gmailClientId || !config.gmailClientSecret) {
    throw new Error("Missing required environment variables: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET");
  }

  const redirectUrl = new URL(config.gmailRedirectUri);
  const authUrl = buildAuthUrl({
    clientId: config.gmailClientId,
    redirectUri: config.gmailRedirectUri,
    scope: config.gmailScope
  });

  console.log("Open this URL in your browser and approve Gmail send access:");
  console.log(authUrl);
  console.log("");
  console.log("Waiting for the browser redirect on:");
  console.log(config.gmailRedirectUri);

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const requestUrl = new URL(req.url, config.gmailRedirectUri);
      const authCode = requestUrl.searchParams.get("code");
      const error = requestUrl.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`Authorization failed: ${error}`);
        server.close(() => reject(new Error(`Authorization failed: ${error}`)));
        return;
      }

      if (!authCode) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Missing authorization code.");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Authorization received. You can close this tab and return to the terminal.");
      server.close(() => resolve(authCode));
    });

    server.on("error", reject);
    server.listen(Number(redirectUrl.port), redirectUrl.hostname);
  });

  const tokens = await exchangeAuthorizationCode({
    clientId: config.gmailClientId,
    clientSecret: config.gmailClientSecret,
    code,
    redirectUri: config.gmailRedirectUri,
    tokenUri: config.gmailTokenUri
  });

  console.log("");
  console.log("Add this to your .env:");
  console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
}

module.exports = {
  runGmailAuth
};

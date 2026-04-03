const DEFAULTS = {
  notionApiVersion: "2022-06-28",
  notionPageId: "ff79f817-b086-4967-847c-4f6b7ab7c45c",
  notionDatabaseId: "521e2f47-ccc9-45d1-97c9-3a03a7482d59",
  notionDataSourceId: "5da5fd21-b659-4a59-8388-d91abd28f95e",
  timeZone: "Asia/Beirut",
  deadlineWindowDays: 7,
  digestHours: [7, 20],
  urgentHour: 13,
  emailProvider: "smtp",
  smtpHost: "smtp.gmail.com",
  smtpPort: 465,
  smtpSecurity: "tls",
  gmailRedirectUri: "http://127.0.0.1:53682/oauth2callback",
  gmailTokenUri: "https://oauth2.googleapis.com/token",
  gmailScope: "https://www.googleapis.com/auth/gmail.send"
};

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseHours(value, fallback) {
  if (!value) {
    return fallback;
  }

  return value
    .split(",")
    .map((part) => parseNumber(part.trim(), Number.NaN))
    .filter((hour) => Number.isInteger(hour) && hour >= 0 && hour <= 23);
}

function parseSmtpSecurity(value, fallback) {
  const normalized = String(value || fallback || "").trim().toLowerCase();
  if (normalized === "tls" || normalized === "ssl") {
    return "tls";
  }

  if (normalized === "starttls") {
    return "starttls";
  }

  return fallback;
}

function loadConfig(env = process.env) {
  const smtpUser = env.SMTP_USER || env.GMAIL_SENDER_EMAIL || env.SENDER_EMAIL || "";
  const smtpAppPassword = (env.SMTP_APP_PASSWORD || "").replace(/\s+/g, "");

  return {
    notionToken: env.NOTION_TOKEN || "",
    notionApiVersion: env.NOTION_API_VERSION || DEFAULTS.notionApiVersion,
    notionPageId: env.NOTION_PAGE_ID || DEFAULTS.notionPageId,
    notionDatabaseId: env.NOTION_DATABASE_ID || DEFAULTS.notionDatabaseId,
    notionDataSourceId: env.NOTION_DATA_SOURCE_ID || DEFAULTS.notionDataSourceId,
    timeZone: env.TIME_ZONE || DEFAULTS.timeZone,
    deadlineWindowDays: parseNumber(env.DEADLINE_WINDOW_DAYS, DEFAULTS.deadlineWindowDays),
    digestHours: parseHours(env.DIGEST_HOURS, DEFAULTS.digestHours),
    urgentHour: parseNumber(env.URGENT_HOUR, DEFAULTS.urgentHour),
    emailProvider: (env.EMAIL_PROVIDER || DEFAULTS.emailProvider).trim().toLowerCase(),
    smtpHost: env.SMTP_HOST || DEFAULTS.smtpHost,
    smtpPort: parseNumber(env.SMTP_PORT, DEFAULTS.smtpPort),
    smtpSecurity: parseSmtpSecurity(env.SMTP_SECURITY, DEFAULTS.smtpSecurity),
    smtpUser,
    smtpAppPassword,
    gmailClientId: env.GMAIL_CLIENT_ID || "",
    gmailClientSecret: env.GMAIL_CLIENT_SECRET || "",
    gmailRefreshToken: env.GMAIL_REFRESH_TOKEN || "",
    gmailSenderEmail: env.GMAIL_SENDER_EMAIL || env.SENDER_EMAIL || "",
    gmailRedirectUri: env.GMAIL_REDIRECT_URI || DEFAULTS.gmailRedirectUri,
    gmailTokenUri: env.GMAIL_TOKEN_URI || DEFAULTS.gmailTokenUri,
    gmailScope: env.GMAIL_SCOPE || DEFAULTS.gmailScope,
    recipientEmail: env.RECIPIENT_EMAIL || env.GMAIL_SENDER_EMAIL || env.SENDER_EMAIL || ""
  };
}

function validateConfig(config) {
  const missing = [];

  if (!config.notionToken) missing.push("NOTION_TOKEN");

  if (config.emailProvider === "gmail-api") {
    if (!config.gmailClientId) missing.push("GMAIL_CLIENT_ID");
    if (!config.gmailClientSecret) missing.push("GMAIL_CLIENT_SECRET");
    if (!config.gmailRefreshToken) missing.push("GMAIL_REFRESH_TOKEN");
    if (!config.gmailSenderEmail) missing.push("GMAIL_SENDER_EMAIL");
  } else if (config.emailProvider === "smtp") {
    if (!config.smtpUser) missing.push("SMTP_USER");
    if (!config.smtpAppPassword) missing.push("SMTP_APP_PASSWORD");
  } else {
    throw new Error(`Unsupported EMAIL_PROVIDER: ${config.emailProvider}`);
  }

  if (!config.recipientEmail) missing.push("RECIPIENT_EMAIL");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

module.exports = {
  DEFAULTS,
  loadConfig,
  validateConfig
};

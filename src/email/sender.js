const { sendEmail: sendSmtpEmail } = require("./smtp-client");
const { sendEmail: sendGmailApiEmail } = require("./gmail-client");

async function sendReminderEmail(config, payload) {
  if (config.emailProvider === "gmail-api") {
    return sendGmailApiEmail({
      clientId: config.gmailClientId,
      clientSecret: config.gmailClientSecret,
      refreshToken: config.gmailRefreshToken,
      tokenUri: config.gmailTokenUri,
      from: config.gmailSenderEmail,
      to: config.recipientEmail,
      subject: payload.subject,
      text: payload.text,
      html: payload.html
    });
  }

  return sendSmtpEmail({
    host: config.smtpHost,
    port: config.smtpPort,
    security: config.smtpSecurity,
    username: config.smtpUser,
    password: config.smtpAppPassword,
    from: config.smtpUser,
    to: config.recipientEmail,
    subject: payload.subject,
    text: payload.text,
    html: payload.html
  });
}

module.exports = {
  sendReminderEmail
};

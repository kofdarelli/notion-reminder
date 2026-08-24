const net = require("net");
const tls = require("tls");

function encodeBase64(value) {
  return Buffer.from(value, "utf8").toString("base64");
}

function formatHeaders(headers) {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\r\n");
}

function createMessage({ from, to, subject, text, html }) {
  const date = new Date().toUTCString();
  
  if (!html) {
    const safeText = text
      .replace(/\r?\n/g, "\r\n")
      .split("\r\n")
      .map((line) => (line.startsWith(".") ? `.${line}` : line))
      .join("\r\n");

    const headers = formatHeaders({
      From: from,
      To: to,
      Subject: subject,
      Date: date,
      "MIME-Version": "1.0",
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Transfer-Encoding": "8bit"
    });

    return `${headers}\r\n\r\n${safeText}\r\n.`;
  }

  const boundary = `----=_Part_${Math.random().toString(36).substring(2)}_${Date.now()}`;
  
  const headers = formatHeaders({
    From: from,
    To: to,
    Subject: subject,
    Date: date,
    "MIME-Version": "1.0",
    "Content-Type": `multipart/alternative; boundary="${boundary}"`
  });

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

  const message = [
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

  return `${message.split("\r\n").map(line => line.startsWith(".") ? `.${line}` : line).join("\r\n")}.`;
}

class SmtpSession {
  constructor(socket) {
    this.buffer = "";
    this.pending = [];
    this.attachSocket(socket);
  }

  attachSocket(socket) {
    if (this.socket) {
      this.socket.off("data", this.handleData);
      this.socket.off("error", this.handleError);
      this.socket.off("end", this.handleEnd);
    }

    this.socket = socket;
    this.handleData = (chunk) => this.onData(chunk);
    this.handleError = (error) => this.rejectAll(error);
    this.handleEnd = () => this.rejectAll(new Error("SMTP connection ended unexpectedly."));

    socket.setEncoding("utf8");
    socket.on("data", this.handleData);
    socket.on("error", this.handleError);
    socket.on("end", this.handleEnd);
  }

  onData(chunk) {
    this.buffer += chunk;

    while (true) {
      const boundaryIndex = this.findMessageBoundary();
      if (boundaryIndex === -1) {
        return;
      }

      const message = this.buffer.slice(0, boundaryIndex).replace(/\r\n$/, "");
      this.buffer = this.buffer.slice(boundaryIndex);

      const pending = this.pending.shift();
      if (pending) {
        pending.resolve(message);
      }
    }
  }

  findMessageBoundary() {
    let searchFrom = 0;

    while (true) {
      const newlineIndex = this.buffer.indexOf("\r\n", searchFrom);
      if (newlineIndex === -1) {
        return -1;
      }

      const line = this.buffer.slice(searchFrom, newlineIndex);
      if (/^\d{3} /.test(line)) {
        return newlineIndex + 2;
      }

      searchFrom = newlineIndex + 2;
    }
  }

  rejectAll(error) {
    while (this.pending.length > 0) {
      const pending = this.pending.shift();
      pending.reject(error);
    }
  }

  async readResponse() {
    return new Promise((resolve, reject) => {
      this.pending.push({ resolve, reject });
    });
  }

  async send(command, expectedCodes, { sensitive = false } = {}) {
    this.socket.write(`${command}\r\n`);
    const response = await this.readResponse();

    if (!expectedCodes.some((code) => response.startsWith(String(code)))) {
      const commandForError = sensitive ? "[redacted credential]" : command;
      throw new Error(`SMTP command failed (${commandForError}): ${response}`);
    }

    return response;
  }

  async sendData(message) {
    this.socket.write("DATA\r\n");
    const prompt = await this.readResponse();
    if (!prompt.startsWith("354")) {
      throw new Error(`SMTP DATA command failed: ${prompt}`);
    }

    this.socket.write(`${message}\r\n`);
    const response = await this.readResponse();
    if (!response.startsWith("250")) {
      throw new Error(`SMTP message body failed: ${response}`);
    }
  }
}

async function sendEmail({
  host,
  port,
  security = "tls",
  username,
  password,
  from,
  to,
  subject,
  text,
  html
}) {
  const initialSocket =
    security === "starttls"
      ? net.connect({ host, port })
      : tls.connect({
          host,
          port,
          servername: host
        });

  const session = new SmtpSession(initialSocket);

  await new Promise((resolve, reject) => {
    const eventName = security === "starttls" ? "connect" : "secureConnect";
    initialSocket.once(eventName, resolve);
    initialSocket.once("error", reject);
  });

  const greeting = await session.readResponse();
  if (!greeting.startsWith("220")) {
    throw new Error(`SMTP greeting failed: ${greeting}`);
  }

  await session.send("EHLO notion-reminder", [250]);

  if (security === "starttls") {
    await session.send("STARTTLS", [220]);

    const secureSocket = tls.connect({
      socket: initialSocket,
      servername: host
    });

    await new Promise((resolve, reject) => {
      secureSocket.once("secureConnect", resolve);
      secureSocket.once("error", reject);
    });

    session.attachSocket(secureSocket);
    await session.send("EHLO notion-reminder", [250]);
  }

  await session.send("AUTH LOGIN", [334]);
  await session.send(encodeBase64(username), [334], { sensitive: true });
  await session.send(encodeBase64(password), [235], { sensitive: true });
  await session.send(`MAIL FROM:<${from}>`, [250]);
  await session.send(`RCPT TO:<${to}>`, [250, 251]);
  await session.sendData(createMessage({ from, to, subject, text, html }));
  await session.send("QUIT", [221]);
  session.socket.end();
}

module.exports = {
  createMessage,
  SmtpSession,
  sendEmail
};

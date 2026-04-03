# Notion Study Email Reminder Service

This service reads your Notion `study scheduler` page plus the inline `study schedule (1)` database, classifies tasks and deadlines in `Asia/Beirut`, and sends digest or urgent reminder emails through either Gmail SMTP or the Gmail API.

## What It Does

- Reads unchecked checklist items from the `study scheduler` page.
- Reads active deadline items from the `study schedule (1)` database.
- Sends:
  - `07:00` Beirut time: morning digest
  - `13:00` Beirut time: urgent-only reminder
  - `20:00` Beirut time: evening digest
- Uses an hourly GitHub Actions schedule and decides the correct run mode in code so Beirut daylight saving changes do not break the schedule.

## Setup

1. Create a Notion integration and share both the page and database with it.
2. Choose a sender mode:
   - `smtp` for Gmail app-password sending
   - `gmail-api` for Google OAuth refresh-token sending
4. Copy `.env.example` to `.env`.
5. Fill in:
   - `NOTION_TOKEN`
   - `RECIPIENT_EMAIL`
   - for `smtp`: `SMTP_USER`, `SMTP_APP_PASSWORD`
   - for `gmail-api`: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_SENDER_EMAIL`
6. The CLI loads `.env` automatically when you run `node src/cli.js ...`.
7. If using `gmail-api`, mint a refresh token:

```powershell
node src/cli.js gmail-auth
```

8. Paste the printed `GMAIL_REFRESH_TOKEN` into `.env`.
9. Run a local command:

```powershell
node tests/run-tests.js
node src/cli.js digest
```

## Environment Variables

- `NOTION_PAGE_ID`
  - Defaults to `ff79f817-b086-4967-847c-4f6b7ab7c45c`
- `NOTION_DATABASE_ID`
  - Defaults to `521e2f47-ccc9-45d1-97c9-3a03a7482d59`
- `NOTION_DATA_SOURCE_ID`
  - Defaults to `5da5fd21-b659-4a59-8388-d91abd28f95e`
- `TIME_ZONE`
  - Defaults to `Asia/Beirut`
- `DEADLINE_WINDOW_DAYS`
  - Defaults to `7`
- `DIGEST_HOURS`
  - Defaults to `7,20`
- `URGENT_HOUR`
  - Defaults to `13`
- `EMAIL_PROVIDER`
  - Defaults to `smtp`
- `SMTP_HOST`
  - Defaults to `smtp.gmail.com`
- `SMTP_PORT`
  - Defaults to `465`
- `SMTP_SECURITY`
  - Defaults to `tls`
- `SMTP_USER`
  - Gmail address that sends the reminders when `EMAIL_PROVIDER=smtp`
- `SMTP_APP_PASSWORD`
  - Gmail app password used when `EMAIL_PROVIDER=smtp`
- `GMAIL_CLIENT_ID`
  - Google OAuth desktop client id
- `GMAIL_CLIENT_SECRET`
  - Google OAuth desktop client secret
- `GMAIL_REFRESH_TOKEN`
  - One-time generated offline token used by the scheduled job
- `GMAIL_SENDER_EMAIL`
  - Actual Gmail mailbox that will send the reminders
- `GMAIL_REDIRECT_URI`
  - Defaults to `http://127.0.0.1:53682/oauth2callback`

## Gmail SMTP Setup

If you want the fastest path and your Gmail app password works:

1. Turn on Google 2-Step Verification.
2. Create an app password for `Mail`.
3. Put these values in `.env`:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURITY=tls
SMTP_USER=yourgmail@gmail.com
SMTP_APP_PASSWORD=your_16_character_app_password
RECIPIENT_EMAIL=your_aub_email@aub.edu.lb
```

## Gmail API Setup

Use OAuth refresh tokens, not SMTP app passwords:

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable the Gmail API.
4. Create OAuth credentials for a `Desktop app`.
5. Put the client id and client secret in `.env`.
6. Run:

```powershell
node src/cli.js gmail-auth
```

7. Open the printed URL in your browser.
8. Approve Gmail send access.
9. After the browser redirects back to `127.0.0.1`, the terminal prints a refresh token.
10. Put that value in `.env` as `GMAIL_REFRESH_TOKEN`.

## GitHub Actions Secrets

Set these repository secrets before enabling the workflow:

- `NOTION_TOKEN`
- `RECIPIENT_EMAIL`

If `EMAIL_PROVIDER=smtp`, also set:

- `SMTP_USER`
- `SMTP_APP_PASSWORD`

If `EMAIL_PROVIDER=gmail-api`, also set:

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `GMAIL_SENDER_EMAIL`

Optional repository variables or secrets:

- `NOTION_API_VERSION`
- `NOTION_PAGE_ID`
- `NOTION_DATABASE_ID`
- `NOTION_DATA_SOURCE_ID`
- `TIME_ZONE`
- `DEADLINE_WINDOW_DAYS`
- `DIGEST_HOURS`
- `URGENT_HOUR`
- `EMAIL_PROVIDER`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURITY`
- `GMAIL_REDIRECT_URI`

## Notes

- The service is read-only against Notion.
- Digest emails send a short all-clear summary if nothing is pending.
- Urgent runs send nothing if there is nothing overdue or due soon.
- Database deadlines use the real `date` property as the source of truth in v1.

## Official References

- [Gmail API send messages](https://developers.google.com/workspace/gmail/api/guides/sending)
- [Gmail API Node.js quickstart](https://developers.google.com/workspace/gmail/api/quickstart/nodejs)
- [Google OAuth for installed apps](https://developers.google.com/identity/protocols/oauth2/native-app)

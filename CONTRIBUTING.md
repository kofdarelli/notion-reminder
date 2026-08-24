# Contributing

Thanks for improving Notion Study Reminders. Keep changes focused, avoid committing real Notion IDs or email credentials, and explain the user-visible effect of your work.

## Development

```bash
git clone https://github.com/kofdarelli/notion-reminder.git
cd notion-reminder
npm test
```

Copy `.env.example` to `.env` only when exercising the live Notion or email integrations. Tests must not require real credentials or send email.

## Pull requests

- Open an issue before broad behavior or configuration changes.
- Add or update tests for scheduling, classification, rendering, or provider behavior.
- Run `npm test` before requesting review.
- Never include tokens, refresh credentials, app passwords, recipient addresses, or live Notion content.
- Document new variables in `.env.example` and the README.

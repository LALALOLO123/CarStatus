# CarStatus

A Node.js / JavaScript project.

## Getting started

```bash
npm install
npm start
```

## Project structure

- `index.js` — application entry point
- `package.json` — project metadata and scripts

## Secrets / login details

Real credentials go in a `.env` file, which is **gitignored** and never committed.

1. Copy the template: `cp .env.example .env`
2. Fill in your real values in `.env`
3. Load them in code (e.g. with the `dotenv` package): `process.env.LOGIN_PASSWORD`

Never put real passwords or API keys directly in committed files.

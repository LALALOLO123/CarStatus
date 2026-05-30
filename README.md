# CarStatus

Show your BMW's status (odometer, fuel/battery, location) from the command line, using the
official [Smartcar](https://smartcar.com) API.

> Note: BMW blocked unofficial/reverse-engineered API access on 2025-09-29, so this project
> uses Smartcar — a sanctioned third-party API that works in North America (free tier:
> 500 calls/vehicle/month).

## Setup

1. **Create a Smartcar app** at https://dashboard.smartcar.com
   - Copy your **Client ID** and **Client Secret**.
   - Add a **Redirect URI** of exactly `http://localhost:8000/callback`.
2. **Configure credentials:**
   ```bash
   cp .env.example .env      # then edit .env with your Client ID/Secret
   npm install
   ```
3. **Connect your car (one time):**
   ```bash
   npm run auth
   ```
   This opens Smartcar Connect in your browser — log in with your BMW account and approve.
   Tokens are saved locally to `smartcar_tokens.json` (gitignored).
4. **See your car's status:**
   ```bash
   npm start
   ```

## Project structure

- `auth.js` — one-time OAuth flow that connects your BMW and caches tokens
- `index.js` — fetches and prints your vehicle's status
- `tokens.js` — saves/loads the cached Smartcar tokens
- `.env` — your Smartcar credentials (gitignored)

## Secrets

Real credentials live only in `.env` and `smartcar_tokens.json`, both gitignored and never
committed. `.env.example` is a safe template. Never put real secrets in committed files.

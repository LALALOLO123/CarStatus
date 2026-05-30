import 'dotenv/config';
import http from 'node:http';
import { exec } from 'node:child_process';
import smartcar from 'smartcar';
import { saveTokens } from './tokens.js';

// --- One-time Smartcar authorization ---
// Opens Smartcar Connect, you log into your BMW, and we save the tokens locally.
// Run this once: `node auth.js`. After that, use `npm start`.

const { SMARTCAR_CLIENT_ID, SMARTCAR_CLIENT_SECRET } = process.env;
const redirectUri = process.env.SMARTCAR_REDIRECT_URI || 'http://localhost:8000/callback';
const mode = process.env.SMARTCAR_MODE || 'live'; // 'live' for a real car, 'test'/'simulated' otherwise

if (!SMARTCAR_CLIENT_ID || !SMARTCAR_CLIENT_SECRET) {
  console.error('❌ Missing SMARTCAR_CLIENT_ID / SMARTCAR_CLIENT_SECRET. Fill them in .env (see .env.example).');
  process.exit(1);
}

const SCOPES = [
  'read_vehicle_info',
  'read_odometer',
  'read_location',
  'read_fuel',
  'read_battery',
  'read_tires',
];

const client = new smartcar.AuthClient({
  clientId: SMARTCAR_CLIENT_ID,
  clientSecret: SMARTCAR_CLIENT_SECRET,
  redirectUri,
  mode,
});

const authUrl = client.getAuthUrl(SCOPES);
const { port, pathname } = new URL(redirectUri);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri);
  if (url.pathname !== pathname) {
    res.writeHead(404).end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400).end(`Authorization failed: ${error}. You can close this tab.`);
    console.error(`\n❌ Authorization failed: ${error}`);
    server.close();
    process.exit(1);
  }

  try {
    const access = await client.exchangeCode(code);
    saveTokens(access);
    res.writeHead(200, { 'Content-Type': 'text/html' })
      .end('<h2>✅ CarStatus connected!</h2><p>Tokens saved. You can close this tab and run <code>npm start</code>.</p>');
    console.log('\n✅ Authorized and tokens saved to smartcar_tokens.json. Run `npm start` to see your car.');
  } catch (err) {
    res.writeHead(500).end('Token exchange failed. Check the terminal.');
    console.error('\n❌ Token exchange failed:', err?.message ?? err);
  } finally {
    server.close();
    setTimeout(() => process.exit(0), 100);
  }
});

server.listen(Number(port) || 80, () => {
  console.log('🔗 Open this URL in your browser to connect your BMW (it may also open automatically):\n');
  console.log('   ' + authUrl + '\n');
  // Best-effort auto-open on Windows.
  exec(`start "" "${authUrl}"`, { shell: 'cmd.exe' }, () => {});
  console.log(`⏳ Waiting for the Smartcar redirect on ${redirectUri} …`);
});

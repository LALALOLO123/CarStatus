import 'dotenv/config';
import smartcar from 'smartcar';
import { loadTokens, saveTokens } from './tokens.js';

// --- CarStatus: show your BMW's status via Smartcar ---
// Prerequisite: run `node auth.js` once to connect your car.

const { SMARTCAR_CLIENT_ID, SMARTCAR_CLIENT_SECRET } = process.env;
const redirectUri = process.env.SMARTCAR_REDIRECT_URI || 'http://localhost:8000/callback';
const mode = process.env.SMARTCAR_MODE || 'live';

let tokens = loadTokens();
if (!tokens) {
  console.error('❌ Not connected yet. Run `node auth.js` first to authorize your BMW.');
  process.exit(1);
}

// Refresh the access token if it has expired.
if (new Date(tokens.expiration) <= new Date()) {
  console.log('🔄 Access token expired — refreshing…');
  const client = new smartcar.AuthClient({
    clientId: SMARTCAR_CLIENT_ID,
    clientSecret: SMARTCAR_CLIENT_SECRET,
    redirectUri,
    mode,
  });
  tokens = await client.exchangeRefreshToken(tokens.refreshToken);
  saveTokens(tokens);
}

// Try an endpoint, returning null (and a quiet note) if the car/plan doesn't support it.
async function tryGet(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.log(`  ${label}: not available (${err?.message ?? 'unsupported'})`);
    return null;
  }
}

try {
  const { vehicles } = await smartcar.getVehicles(tokens.accessToken);
  if (!vehicles.length) {
    console.log('✅ Connected, but no vehicles linked to this Smartcar account.');
    process.exit(0);
  }

  const vehicle = new smartcar.Vehicle(vehicles[0], tokens.accessToken, { unitSystem: 'imperial' });

  const attrs = await tryGet('Info', () => vehicle.attributes());
  if (attrs) console.log(`\n🚗 ${attrs.year ?? ''} ${attrs.make ?? ''} ${attrs.model ?? ''}`.trim());
  else console.log('\n🚗 Your BMW');

  console.log('📊 Status:');

  const odo = await tryGet('Odometer', () => vehicle.odometer());
  if (odo) console.log(`  Odometer:  ${Math.round(odo.distance).toLocaleString()} mi`);

  const fuel = await tryGet('Fuel', () => vehicle.fuel());
  if (fuel) console.log(`  Fuel:      ${Math.round(fuel.percentRemaining * 100)}%  (~${Math.round(fuel.range)} mi range)`);

  const battery = await tryGet('Battery', () => vehicle.battery());
  if (battery) console.log(`  Battery:   ${Math.round(battery.percentRemaining * 100)}%  (~${Math.round(battery.range)} mi range)`);

  const loc = await tryGet('Location', () => vehicle.location());
  if (loc) console.log(`  Location:  ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`);

  console.log('\n🎉 Done.');
} catch (err) {
  console.error('\n❌ Failed to fetch vehicle data:', err?.message ?? err);
  process.exit(1);
}

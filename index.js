import 'dotenv/config';
import { ConnectedDrive, Regions, FileTokenStore } from 'bmw-connected-drive';

// --- Connection test for MyBMW (North America) ---
// Pulls your vehicle list and the first vehicle's status to confirm auth works.

const username = process.env.BMW_USERNAME;
const password = process.env.BMW_PASSWORD;
const captchaToken = process.env.BMW_CAPTCHA_TOKEN || undefined;

if (!username || !password) {
  console.error('❌ Missing BMW_USERNAME / BMW_PASSWORD. Copy .env.example to .env and fill them in.');
  process.exit(1);
}

// Persists the access/refresh token to the "access_token" file (gitignored),
// so after the first successful login you no longer need a captcha token.
const tokenStore = new FileTokenStore();
const hasStoredToken = Boolean(tokenStore.retrieveToken());

if (!hasStoredToken && !captchaToken) {
  console.error(
    '❌ First login needs a one-time captcha token.\n' +
    '   Generate one (North America) at:\n' +
    '   https://bimmer-connected.readthedocs.io/en/stable/captcha.html\n' +
    '   then put it in .env as BMW_CAPTCHA_TOKEN and run again (tokens expire fast, so be quick).'
  );
  process.exit(1);
}

// Constructor order: (username, password, region, tokenStore?, logger?, captchaToken?)
const api = new ConnectedDrive(username, password, Regions.NorthAmerica, tokenStore, undefined, captchaToken);

try {
  console.log('🔐 Authenticating with MyBMW…');
  const vehicles = await api.getVehicles();

  if (!vehicles.length) {
    console.log('✅ Logged in, but no vehicles found on this account.');
    process.exit(0);
  }

  console.log(`✅ Logged in. Found ${vehicles.length} vehicle(s):\n`);
  for (const v of vehicles) {
    console.log(`  • ${v.attributes?.year ?? ''} ${v.attributes?.model ?? 'BMW'} — VIN ${v.vin}`);
  }

  // Pull detailed status for the first vehicle.
  const first = vehicles[0];
  console.log(`\n📊 Status for ${first.attributes?.model ?? first.vin}:`);
  const s = await api.getVehicleStatus(first.vin);

  console.log(`  Mileage:   ${s.currentMileage ?? '—'}`);
  console.log(`  Range:     ${s.range ?? '—'}`);
  if (s.combustionFuelLevel) {
    console.log(`  Fuel:      ${s.combustionFuelLevel.remainingFuelPercent ?? '—'}% (${s.combustionFuelLevel.remainingFuelLiters ?? '—'} L)`);
  }
  if (s.electricChargingState) {
    console.log(`  Battery:   ${s.electricChargingState.chargingLevelPercent ?? '—'}% (${s.electricChargingState.chargingStatus ?? '—'})`);
  }
  if (s.location?.coordinates) {
    console.log(`  Location:  ${s.location.coordinates.latitude}, ${s.location.coordinates.longitude}`);
  }
  console.log(`  Doors:     ${s.doorsState?.combinedSecurityState ?? '—'}`);
  console.log(`  Updated:   ${s.lastUpdatedAt ?? s.lastFetched ?? '—'}`);

  console.log('\n🎉 Connection test succeeded. Token cached to "access_token" — no captcha needed next time.');
} catch (err) {
  console.error('\n❌ Connection test failed:', err?.message ?? err);
  console.error('   Common causes: expired/invalid captcha token, wrong password, or wrong region.');
  process.exit(1);
}

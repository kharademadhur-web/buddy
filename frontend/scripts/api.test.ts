// Simple backend QA tests. Run with: npm run api:test -- --url=https://your-backend.onrender.com

const urlArg = process.argv.find((a) => a.startsWith('--url='));
if (!urlArg) {
  console.error('Usage: npm run api:test -- --url=<BACKEND_URL>');
  process.exit(1);
}
const BASE = urlArg.split('=')[1].replace(/\/$/, '');

const t0 = Date.now();
fetch(`${BASE}/api/health`)
  .then(async (r) => {
    const ms = Date.now() - t0;
    const body = await r.json().catch(() => ({}));
    const cors = r.headers.get('access-control-allow-origin');
    console.log('HEALTH status:', r.status);
    console.log('BODY:', body);
    console.log('CORS:', cors || '(none)');
    console.log('Latency(ms):', ms);
    if (r.status !== 200) process.exit(2);
    if (ms > 2000) console.warn('WARN: Response >2s');
  })
  .catch((e) => {
    console.error('Health check failed:', e.message);
    process.exit(2);
  });

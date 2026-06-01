const SERVICE_KEY = 'sb_secret_wI4luZzbjeP91-bvCLYY5A_o8ZcRXtT';
const URL = 'https://wxuvexwcypgzlboasdvx.supabase.co/auth/v1/admin/users';

const users = [
  'lasolas@gesell.ar', 'pinar@gesell.ar', 'solyarena@gesell.ar',
  'boutiquepinar@gesell.ar', 'residencias@gesell.ar', 'alpen@gesell.ar',
  'artico@gesell.ar', 'carla@gesell.ar', 'robertoana@gesell.ar',
  'sanremo@gesell.ar', 'windy@gesell.ar', 'dublin@gesell.ar',
  'cafebosque@gesell.ar', 'eltopo@gesell.ar', 'amarena@gesell.ar',
  'laholandesa@gesell.ar', 'esquinadelmar@gesell.ar', 'donvito@gesell.ar',
  'elparrillon@gesell.ar', 'hobby@gesell.ar', 'medanos@gesell.ar',
  'surf@gesell.ar', 'rancho@gesell.ar', 'spapinar@gesell.ar',
  'pesca@gesell.ar', 'yoga@gesell.ar', 'observatorio@gesell.ar',
  'kayak@gesell.ar', 'tourhistorico@gesell.ar', 'panaderia@gesell.ar',
];

async function crear() {
  for (const email of users) {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({ email, password: 'Gesell2026!', email_confirm: true })
    });
    const data = await res.json();
    console.log(email, data.id ? '✓ OK' : '✗ ' + (data.msg || data.message || 'ERROR'));
  }
}
crear();

/**
 * AUDACE — relais du formulaire de contact vers Resend (Railway Function, Bun)
 *
 * Variables du service Railway :
 *   RESEND_API_KEY  clé API Resend, droit « Sending access » uniquement (à saisir dans le tableau de bord)
 *   CONTACT_TO      adresse qui reçoit les messages
 *   MAIL_FROM       expéditeur sur le domaine vérifié dans Resend
 *
 * Aucune donnée n'est conservée : le relais valide le message et le transmet à Resend.
 */

const PROD_ORIGINS = ['https://www.audace-chavenay.fr', 'https://audace-chavenay.fr'];
// Environnement de test : les messages arrivent avec le préfixe [TEST] dans l'objet
const TEST_ORIGINS = ['https://www.audace-chavenay.org', 'https://audace-chavenay.org'];
const ALLOWED_ORIGINS = [...PROD_ORIGINS, ...TEST_ORIGINS];

const SUJETS: Record<string, string> = {
  'Question générale': 'Question générale',
  'Charte de Chavenay': 'Charte de Chavenay',
  'Visite, événement ou projet pédagogique': 'Visite, événement ou projet pédagogique',
  'Presse et médias': 'Presse et médias',
  'Gêne sonore': 'Gêne sonore (renvoyé vers Entre Voisins)',
  'gene': 'Gêne sonore (renvoyé vers Entre Voisins)',
};

const MIN_FILL_MS = 3000;
const MAX_PER_HOUR = 5;
const hits = new Map<string, number[]>();

function cors(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(origin) },
  });
}

function clean(value: unknown, max: number): string {
  return String(value ?? '').replace(/[\r\0]/g, '').trim().slice(0, max);
}

function clientIp(req: Request, server: any): string {
  const fwd = req.headers.get('X-Forwarded-For');
  if (fwd) return fwd.split(',')[0].trim();
  return server?.requestIP?.(req)?.address ?? 'inconnue';
}

export async function handle(req: Request, env: Record<string, string | undefined>, ip: string): Promise<Response> {
  const origin = req.headers.get('Origin') || '';
  const url = new URL(req.url);

  if (req.method === 'GET' && url.pathname === '/') return new Response('AUDACE relais formulaire : OK', { status: 200 });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return json({ ok: false, error: 'Méthode non autorisée.' }, 405, origin);
  if (!ALLOWED_ORIGINS.includes(origin)) return json({ ok: false, error: 'Origine non autorisée.' }, 403, origin);

  const contactTo = env.CONTACT_TO || 'contact@audace-chavenay.fr';
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
    console.error('Configuration incomplète : RESEND_API_KEY ou MAIL_FROM manquant');
    return json({ ok: false, error: `Service momentanément indisponible. Écrivez-nous à ${contactTo}.` }, 503, origin);
  }

  let form: FormData;
  try { form = await req.formData(); }
  catch { return json({ ok: false, error: 'Requête invalide.' }, 400, origin); }

  // Anti-robots : champ piège rempli ou formulaire rempli trop vite → on fait semblant d'accepter
  if (clean(form.get('site_web'), 200) !== '') return json({ ok: true }, 200, origin);
  if (Number(form.get('t') || 0) < MIN_FILL_MS) return json({ ok: true }, 200, origin);

  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((ts) => ts > now - 3_600_000);
  if (recent.length >= MAX_PER_HOUR) {
    return json({ ok: false, error: `Trop de messages envoyés. Réessayez plus tard ou écrivez à ${contactTo}.` }, 429, origin);
  }

  const nom = clean(form.get('nom'), 100);
  const email = clean(form.get('email'), 150);
  const commune = clean(form.get('commune'), 100);
  const sujet = SUJETS[clean(form.get('sujet'), 100)] || 'Question générale';
  const message = clean(form.get('message'), 5000);

  if (!nom || !email || !message) {
    return json({ ok: false, error: 'Merci de remplir les champs nom, e-mail, sujet et message.' }, 400, origin);
  }
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email) || /[\n,;]/.test(email + nom)) {
    return json({ ok: false, error: 'L’adresse e-mail ne semble pas valide.' }, 400, origin);
  }

  const date = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
  const text =
    `Message reçu depuis le formulaire du site ${new URL(origin).hostname}\n\n` +
    `Nom : ${nom}\nE-mail : ${email}\nCommune : ${commune || 'non précisée'}\n` +
    `Sujet : ${sujet}\nDate : ${date}\n\n` +
    `----------------------------------------\n${message}\n`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [contactTo],
      reply_to: email,
      subject: `${TEST_ORIGINS.includes(origin) ? '[TEST] ' : ''}[Site AUDACE] ${sujet} : ${nom}`,
      text,
    }),
  });

  if (!res.ok) {
    console.error('Resend', res.status, await res.text());
    return json({ ok: false, error: `L’envoi a échoué. Écrivez-nous directement à ${contactTo}.` }, 502, origin);
  }

  recent.push(now);
  hits.set(ip, recent);
  return json({ ok: true }, 200, origin);
}

export default {
  port: Number(Bun.env.PORT) || 3000,
  fetch(req: Request, server: any) {
    return handle(req, Bun.env, clientIp(req, server));
  },
};

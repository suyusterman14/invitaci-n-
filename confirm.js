// Vercel Serverless Function: valida, guarda en Supabase y envía correo con Resend.
const { SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, DESTINATION_EMAIL, RESEND_FROM } = process.env;
const EVENT = { date: "08 de octubre de 2026", time: "4:30 p. m.", location: "Jirón Moquegua 228, Huancayo" };

const hits = new Map(); // límite simple por IP (best effort en serverless)
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0] || "x";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 600000);
  if (recent.length >= 5) return res.status(429).json({ error: "Demasiados intentos." });
  hits.set(ip, [...recent, now]);

  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true });            // honeypot
  if (typeof b.elapsed === "number" && b.elapsed < 2000) return res.status(400).json({ error: "Envío demasiado rápido." });

  const name = String(b.name || "").replace(/[<>\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
  const attending = b.attending === true;
  let companions = attending ? parseInt(b.companions, 10) : 0;
  if (name.length < 3) return res.status(400).json({ error: "Por favor, ingresa tus apellidos y nombres." });
  if (typeof b.attending !== "boolean") return res.status(400).json({ error: "Indica si asistirás." });
  if (!Number.isInteger(companions) || companions < 0 || companions > 5) return res.status(400).json({ error: "Número de acompañantes inválido." });

  const when = new Date().toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "full", timeStyle: "short" });
  const tasks = [];

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    tasks.push(fetch(`${SUPABASE_URL}/rest/v1/rsvps`, {
      method: "POST",
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ full_name: name, attending, companions })
    }).then(r => { if (!r.ok) throw new Error("db " + r.status); }));
  }

  if (RESEND_API_KEY && DESTINATION_EMAIL) {
    const att = attending ? "Sí, ¡estaré presente!" : "No podré asistir";
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:2px solid #e8b94a;border-radius:14px;overflow:hidden">
<div style="background:#2d1b69;color:#ffd966;padding:18px;text-align:center;font-size:18px;font-weight:bold">✨ NUEVA CONFIRMACIÓN DE ASISTENCIA ✨</div>
<table style="width:100%;padding:16px;font-size:15px;color:#222" cellpadding="6">
<tr><td><b>Apellidos y nombres:</b></td><td>${esc(name)}</td></tr>
<tr><td><b>Asistencia:</b></td><td>${att}</td></tr>
<tr><td><b>Acompañantes:</b></td><td>${companions}</td></tr>
<tr><td><b>Evento:</b></td><td>${EVENT.date}</td></tr>
<tr><td><b>Hora:</b></td><td>${EVENT.time}</td></tr>
<tr><td><b>Lugar:</b></td><td>${EVENT.location}</td></tr>
<tr><td><b>Respuesta registrada:</b></td><td>${when}</td></tr></table></div>`;
    tasks.push(fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: RESEND_FROM || "Invitación <onboarding@resend.dev>", to: [DESTINATION_EMAIL], subject: `Nueva confirmación: ${name} (${attending ? "Sí" : "No"})`, html })
    }).then(r => { if (!r.ok) throw new Error("mail " + r.status); }));
  }

  if (!tasks.length) return res.status(500).json({ error: "Servidor sin configurar." });
  const results = await Promise.allSettled(tasks);
  results.filter(r => r.status === "rejected").forEach(r => console.error(r.reason));
  if (results.every(r => r.status === "rejected")) return res.status(502).json({ error: "No pudimos registrar tu respuesta." });
  return res.status(200).json({ ok: true });
};

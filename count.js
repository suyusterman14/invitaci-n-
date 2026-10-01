// Devuelve el total de personas confirmadas (invitado + acompañantes).
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
module.exports = async (req, res) => {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rsvps?attending=eq.true&select=companions`, {
      headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
    });
    if (!r.ok) throw new Error(r.status);
    const rows = await r.json();
    res.setHeader("Cache-Control", "s-maxage=30");
    res.status(200).json({ count: rows.reduce((s, x) => s + 1 + (x.companions || 0), 0) });
  } catch { res.status(200).json({ count: 0 }); }
};

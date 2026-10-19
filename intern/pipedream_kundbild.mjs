// Pipedream-steg: AI-research om kunden inför kundmejlet ("Hämta kundbild" i konfiguratorn).
// Arbetsflöde: 1) HTTP-trigger, inställd på "Return a custom response from your workflow"  2) detta Node.js-steg.
// Miljövariabel: ANTHROPIC_API_KEY. Lägg triggerns URL i TOLKSTER_RESEARCH i modellmatris.html.
// Svaret visas i formuläret och granskas av säljaren innan något skickas.
import { axios } from "@pipedream/platform";

const ALLOWED_ORIGINS = ["https://tolkster.ai", "https://www.tolkster.ai"];
const MODEL = "claude-sonnet-5-5";

export default defineComponent({
  async run({ steps, $ }) {
    const ev = steps.trigger.event;
    const origin = (ev.headers && (ev.headers.origin || ev.headers.Origin)) || "";
    const cors = { "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0], "Content-Type": "application/json" };
    if (!ALLOWED_ORIGINS.includes(origin)) { await $.respond({ status: 403, headers: cors, body: { fel: "origin" } }); return $.flow.exit("origin"); }

    const q = typeof ev.body === "string" ? JSON.parse(ev.body) : ev.body;
    const org = String(q.org || "").slice(0, 150);
    const sv = q.lg !== "en";
    if (!org) { await $.respond({ status: 400, headers: cors, body: { fel: "org saknas" } }); return; }

    const prompt = `Du gör förberedande research åt Tolkster (AI-tolkning för offentlig sektor) inför ett mejl till en kund.
Kund: ${org}${q.avdelning ? ", " + q.avdelning : ""}. Land: ${q.land || "Sverige"}. Kommun (om relevant): ${q.kommun || "-"}.
Språk kunden valt: ${(q.sprak || []).join(", ")}.
Redan känd data (upprepa inte): ${JSON.stringify(q.lokal || [])}.

Sök på webben och ta fram, bara från offentliga källor du faktiskt hittat:
1. De största födelseländerna eller språkgrupperna hos invånarna (eller kundgruppen), med år.
2. Kundens egen kostnad eller volym för tolkning (årsredovisning, budget, revisionsrapport, nyheter), med år.
3. Nuvarande tolkavtal: leverantör(er), upphandling, avtalsperiod och när avtalet löper ut.
4. Verksamheter hos kunden där tolkbehovet är stort, och beslut eller strategier om AI eller digitalisering.
5. Om landet inte är Sverige: regler för tolkning i offentlig sektor och språklagstiftning i landet.

Svara ENDAST med JSON, utan kodstaket:
{"intro": "${sv ? "2–4 meningar på svenska" : "2–4 sentences in English"} till kunden om deras tolkbehov, sakligt, utan smicker, utan gissningar, utan att nämna konkurrenter eller nuvarande leverantör",
 "fakta": [{"rubrik": "...", "varde": "...", "url": "..."}],
 "intern": {"nuvarande_leverantor": "...", "avtal_loper_ut": "...", "signaler": ["..."], "osakert": ["..."]},
 "kallor": [{"titel": "...", "url": "..."}]}
Lämna fält tomma hellre än att gissa. Varje siffra i intro och fakta ska ha en källa i kallor.`;

    const r = await axios($, {
      method: "POST",
      url: "https://api.anthropic.com/v1/messages",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      data: {
        model: MODEL,
        max_tokens: 2500,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
        messages: [{ role: "user", content: prompt }],
      },
    });
    const txt = (r.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    let out;
    try { out = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1)); }
    catch (e) { out = { intro: "", fakta: [], intern: { osakert: ["Kunde inte tolka svaret"] }, kallor: [] }; }

    await $.respond({ status: 200, headers: cors, body: out });
    // Nästa steg i samma arbetsflöde kan skriva out.intern och out.fakta till kundens post i Attio.
    return { org, ...out };
  },
});

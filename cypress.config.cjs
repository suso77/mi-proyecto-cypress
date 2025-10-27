// ⬇️ Sustituye la task fetchSitemapUrls actual por ESTA
async function fetchSitemapUrls(opts = {}) {
  const {
    recursive = true,
    maxUrls = Number(process.env.A11Y_MAX_URLS || 5000),
  } = opts || {};

  const site = process.env.SITE_URL;
  if (!site) {
    console.error("❌ fetchSitemapUrls: falta SITE_URL en el entorno.");
    return [];
  }

  const root = new URL(site);
  const sameHost = (u) => {
    try { return new URL(u).host === root.host; } catch { return false; }
  };

  // Filtros opcionales por patrón (coma separada), evaluados como regex (i)
  const incPatterns = String(process.env.A11Y_INCLUDE || "")
    .split(",").map(s => s.trim()).filter(Boolean)
    .map(s => new RegExp(s, "i"));

  const excPatterns = String(process.env.A11Y_EXCLUDE || "")
    .split(",").map(s => s.trim()).filter(Boolean)
    .map(s => new RegExp(s, "i"));

  const includeOk = (u) => incPatterns.length === 0 || incPatterns.some(r => r.test(u));
  const excludeOk = (u) => excPatterns.length === 0 || !excPatterns.some(r => r.test(u));

  const agent = new https.Agent({ rejectUnauthorized: false });

  async function fetchXml(url) {
    const res = await axios.get(url, { httpsAgent: agent, timeout: 20000 });
    return res.data;
  }

  function extractLocsFromParsed(parsed) {
    const locs =
      parsed?.urlset?.url?.map(u => u.loc?.[0]).filter(Boolean) ||
      [];
    return locs;
  }

  function extractChildrenFromParsed(parsed) {
    const children =
      parsed?.sitemapindex?.sitemap?.map(s => s.loc?.[0]).filter(Boolean) ||
      [];
    return children;
  }

  async function parseXml(xml) {
    try {
      return await parseStringPromise(xml);
    } catch {
      return null;
    }
  }

  // Normaliza (host en minúsculas, sin / final salvo raíz)
  function normalize(u) {
    try {
      const x = new URL(u);
      x.hostname = x.hostname.toLowerCase();
      if (x.pathname !== "/" && x.pathname.endsWith("/")) x.pathname = x.pathname.slice(0, -1);
      return x.toString();
    } catch { return u; }
  }

  const seenXml = new Set();
  const out = new Set();

  async function walk(xmlUrl) {
    if (seenXml.has(xmlUrl) || out.size >= maxUrls) return;
    seenXml.add(xmlUrl);

    let xml;
    try {
      xml = await fetchXml(xmlUrl);
    } catch (e) {
      console.warn("⚠️ No se pudo leer XML:", xmlUrl, e.message);
      return;
    }

    const parsed = await parseXml(xml);
    if (!parsed) return;

    const children = extractChildrenFromParsed(parsed);
    if (children.length > 0 && recursive) {
      // sitemapindex → entra en cada hijo
      for (const child of children) {
        if (out.size >= maxUrls) break;
        await walk(child);
      }
    } else {
      // urlset → añade páginas
      const locs = extractLocsFromParsed(parsed);
      for (const u of locs) {
        if (out.size >= maxUrls) break;
        const nu = normalize(u);
        if (sameHost(nu) && includeOk(nu) && excludeOk(nu)) out.add(nu);
      }
    }
  }

  const rootSitemap = new URL("/sitemap.xml", root).toString();
  console.log("📥 Leyendo sitemap raíz:", rootSitemap);
  await walk(rootSitemap);

  const urls = Array.from(out);
  console.log(`✅ fetchSitemapUrls: ${urls.length} URLs finales (host=${root.host}).`);
  return urls;
}



#!/usr/bin/env node
/**
 * Génère dist/sitemap.xml après le build (npm run build l'appelle via
 * « postbuild »), et ajoute la ligne « Sitemap: » à dist/robots.txt.
 *
 * Variables lues dans l'environnement, puis dans .env.production / .env :
 *   SITE_URL      adresse publique du site, sans « / » final
 *                 (ex. https://www.mondomaine.com). Sans elle, rien n'est
 *                 généré : un sitemap n'accepte que des adresses absolues.
 *   VITE_API_URL  adresse de WordPress, pour lister produits et articles.
 *
 * Si WordPress ne répond pas au moment du build, le sitemap ne contient que
 * les pages fixes : le build ne doit jamais échouer pour cela.
 *
 * Aucune dépendance : fetch est fourni par Node 18+.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const DIST = "dist";

// Pages fixes indexables (les pages privées sont exclues, voir public/robots.txt).
const STATIC_PATHS = [
  "/",
  "/catalogue",
  "/blog",
  "/contact",
  "/faq",
  "/a-propos",
  "/mentions-legales",
  "/cgu",
  "/cgv",
  "/cookies",
  "/confidentialite",
];

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, "")]),
  );
}

const fileEnv = { ...readEnvFile(".env"), ...readEnvFile(".env.production") };
const read = (key) => process.env[key] || fileEnv[key] || "";

const siteUrl = read("SITE_URL").replace(/\/+$/, "");
const apiUrl = read("VITE_API_URL").replace(/\/+$/, "");

if (!siteUrl) {
  console.warn(
    "[sitemap] SITE_URL n'est pas définie : sitemap.xml non généré.",
  );
  process.exit(0);
}

if (!existsSync(DIST)) {
  console.warn(`[sitemap] Dossier ${DIST}/ introuvable : lancer le build d'abord.`);
  process.exit(0);
}

async function getJson(path) {
  const response = await fetch(`${apiUrl}${path}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

const entries = STATIC_PATHS.map((path) => ({ loc: `${siteUrl}${path}` }));

if (apiUrl) {
  try {
    for (let page = 1; page <= 50; page += 1) {
      const products = await getJson(
        `/wp-json/custom/v1/products?per_page=100&page=${page}`,
      );
      products.forEach((product) =>
        entries.push({ loc: `${siteUrl}/product/${product.id}` }),
      );
      if (products.length < 100) break;
    }
  } catch (error) {
    console.warn(`[sitemap] Produits ignorés : ${error.message}`);
  }

  try {
    const posts = await getJson(
      "/wp-json/wp/v2/posts?per_page=100&_fields=slug,modified",
    );
    posts.forEach((post) =>
      entries.push({
        loc: `${siteUrl}/blog/${post.slug}`,
        lastmod: post.modified ? post.modified.slice(0, 10) : undefined,
      }),
    );
  } catch (error) {
    console.warn(`[sitemap] Articles ignorés : ${error.message}`);
  }
} else {
  console.warn("[sitemap] VITE_API_URL absente : pages fixes seulement.");
}

const escapeXml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map(
    ({ loc, lastmod }) =>
      `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`,
  ),
  "</urlset>",
  "",
].join("\n");

writeFileSync(`${DIST}/sitemap.xml`, xml);
console.log(`[sitemap] ${entries.length} adresses écrites dans ${DIST}/sitemap.xml`);

const robotsPath = `${DIST}/robots.txt`;
if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, "utf8");
  if (!/^Sitemap:/im.test(robots)) {
    writeFileSync(robotsPath, `${robots.trimEnd()}\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  }
}

const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#0f172a"/>
  <path d="M15 20h34l-9 10h-8v14h-8V30h-18z" fill="#14b8a6"/>
  <circle cx="45" cy="44" r="7" fill="#ccfbf1"/>
</svg>
`.trim();

export async function GET() {
  return new Response(faviconSvg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

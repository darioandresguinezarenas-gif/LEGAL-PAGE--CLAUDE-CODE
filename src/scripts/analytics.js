// GA4 init — se bundlea por Astro a /_astro/*.js (CSP-safe, sin unsafe-inline)
// Solo activa cuando PUBLIC_GA4_MEASUREMENT_ID está configurado en Vercel.
const GA4_ID = import.meta.env.PUBLIC_GA4_MEASUREMENT_ID;

if (GA4_ID && typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA4_ID, {
    anonymize_ip: true,
    send_page_view: true,
  });
}

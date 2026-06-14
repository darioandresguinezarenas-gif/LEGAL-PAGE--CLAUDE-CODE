// GA4 con consentimiento explícito — bundleado por Astro (CSP-safe, sin unsafe-inline)
// Usa localStorage 'gg_cookie_consent' === 'accepted' para activar el tracking.
const GA4_ID = import.meta.env.PUBLIC_GA4_MEASUREMENT_ID;

function loadGA4() {
  if (!GA4_ID || typeof window === 'undefined' || window.__ga4Loaded) return;
  window.__ga4Loaded = true;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA4_ID, { anonymize_ip: true, send_page_view: true });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(s);
}

if (typeof window !== 'undefined') {
  window.__ga4Accept = () => {
    localStorage.setItem('gg_cookie_consent', 'accepted');
    loadGA4();
  };
  window.__ga4Decline = () => {
    localStorage.setItem('gg_cookie_consent', 'declined');
  };
  // Auto-inicializar si ya hay consentimiento previo
  if (localStorage.getItem('gg_cookie_consent') === 'accepted') {
    loadGA4();
  }
}

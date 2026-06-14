// Generadores de JSON-LD para schema.org — SEO y motores de IA
import type { Lang } from '../i18n/utils';

const BASE_URL = 'https://www.guinezgalaz.cl';

export function generateOrganizationSchema(config?: { telefono?: string; email?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: 'Guíñez Galaz Abogados',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.svg`,
    image: `${BASE_URL}/og-default.svg`,
    description: 'Abogados en Curicó, Región del Maule. Derecho Laboral, Civil, Penal, Corporativo y Familia. Atención en español, inglés y chino.',
    ...(config?.telefono && { telephone: config.telefono }),
    ...(config?.email && { email: config.email }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Calle Hernán Correa 2140, Galilea',
      addressLocality: 'Curicó',
      addressRegion: 'Región del Maule',
      addressCountry: 'CL',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -34.9828,
      longitude: -71.2392,
    },
    openingHours: 'Mo-Fr 09:00-18:00',
    priceRange: '$$',
    areaServed: {
      '@type': 'Country',
      name: 'Chile',
    },
  };
}

export function generateArticleSchema(article: {
  titulo: Record<string, string>;
  extracto: Record<string, string>;
  imagen_url: string;
  published_at: string;
  slug: string;
  autor?: string;
}, lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.titulo[lang],
    description: article.extracto[lang],
    image: article.imagen_url,
    datePublished: article.published_at,
    url: `${BASE_URL}/${lang}/blog/${article.slug}`,
    author: {
      '@type': 'Person',
      name: article.autor ?? 'Guíñez Galaz Abogados',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Guíñez Galaz Abogados',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.svg` },
    },
  };
}

export function generateFaqSchema(faqs: { pregunta: string; respuesta: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: f.respuesta },
    })),
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Generadores de JSON-LD para schema.org — SEO y motores de IA
import type { Lang } from '../i18n/utils';

const BASE_URL = 'https://www.guinezgalaz.cl';

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: 'Güinez Galaz Abogados',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.svg`,
    image: `${BASE_URL}/og-default.jpg`,
    description: 'Estudio jurídico en Rancagua, Chile. Derecho Laboral, Civil, Penal y Familia.',
    telephone: '+56900000000',
    email: 'contacto@guinezgalaz.cl',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Rancagua',
      addressRegion: 'Región de O\'Higgins',
      addressCountry: 'CL',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -34.1703,
      longitude: -70.7444,
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
      name: article.autor ?? 'Güinez Galaz Abogados',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Güinez Galaz Abogados',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.svg` },
    },
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

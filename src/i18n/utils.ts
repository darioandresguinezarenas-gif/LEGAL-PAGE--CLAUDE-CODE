import es from './es.json';
import en from './en.json';
import zh from './zh.json';

export type Lang = 'es' | 'en' | 'zh';

const translations = { es, en, zh } as const;

export function t(lang: Lang, key: string): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  if (typeof value !== 'string') {
    // Fallback a español si no existe la clave en el idioma pedido
    let fallback: any = translations['es'];
    for (const k of keys) {
      fallback = fallback?.[k];
    }
    return typeof fallback === 'string' ? fallback : key;
  }
  return value;
}

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang === 'en' || lang === 'zh') return lang;
  return 'es';
}

export const supportedLangs: Lang[] = ['es', 'en', 'zh'];

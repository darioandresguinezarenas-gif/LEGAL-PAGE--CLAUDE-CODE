import { supabase } from './supabase';

// ============================================================
// Tipos
// ============================================================
type I18nText = { es?: string; en?: string; zh?: string } & Record<string, string>;

export type AreaRow = {
  id: string;
  slug: string;
  icono: string;
  titulo: I18nText;
  descripcion: I18nText;
  contenido: I18nText;
  faq: Array<{ pregunta: I18nText; respuesta: I18nText }>;
  orden: number;
};

export type ClienteRow = {
  id: string;
  nombre: string;
  logo_url: string | null;
  url: string | null;
  orden: number;
};

export type ArticuloRow = {
  id: string;
  slug: string;
  titulo: I18nText;
  extracto: I18nText;
  contenido: I18nText;
  imagen_url: string | null;
  categoria: string;
  published_at: string | null;
  autor_id: string | null;
};

export type AbogadoRow = {
  id: string;
  slug: string;
  nombre: string;
  cargo: I18nText;
  bio: I18nText;
  foto_url: string | null;
  anos_trayectoria: number;
  formacion: string[];
  especialidades: string[];
  orden: number;
};

export type ConfigMap = Record<string, string>;

// ============================================================
// Helper: ejecuta una query con fallback silencioso
// ============================================================
async function safeQuery<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[queries] ${label} falló — usando fallback:`, (err as Error).message);
    return fallback;
  }
}

// ============================================================
// Áreas de práctica
// ============================================================
export async function getAreas(): Promise<AreaRow[]> {
  return safeQuery(
    'getAreas',
    async () => {
      const { data, error } = await supabase
        .from('areas_practica')
        .select('id, slug, icono, titulo, descripcion, contenido, faq, orden')
        .order('orden', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AreaRow[];
    },
    [],
  );
}

export async function getAreaBySlug(slug: string): Promise<AreaRow | null> {
  return safeQuery(
    `getAreaBySlug(${slug})`,
    async () => {
      const { data, error } = await supabase
        .from('areas_practica')
        .select('id, slug, icono, titulo, descripcion, contenido, faq, orden')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as AreaRow | null;
    },
    null,
  );
}

// ============================================================
// Clientes destacados
// ============================================================
export async function getClientes(): Promise<ClienteRow[]> {
  return safeQuery(
    'getClientes',
    async () => {
      const { data, error } = await supabase
        .from('clientes_destacados')
        .select('id, nombre, logo_url, url, orden')
        .order('orden', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ClienteRow[];
    },
    [],
  );
}

// ============================================================
// Artículos del blog
// ============================================================
export async function getArticulos(limit?: number): Promise<ArticuloRow[]> {
  return safeQuery(
    'getArticulos',
    async () => {
      let q = supabase
        .from('articulos')
        .select('id, slug, titulo, extracto, contenido, imagen_url, categoria, published_at, autor_id')
        .order('published_at', { ascending: false, nullsFirst: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ArticuloRow[];
    },
    [],
  );
}

export async function getArticuloBySlug(slug: string): Promise<ArticuloRow | null> {
  return safeQuery(
    `getArticuloBySlug(${slug})`,
    async () => {
      const { data, error } = await supabase
        .from('articulos')
        .select('id, slug, titulo, extracto, contenido, imagen_url, categoria, published_at, autor_id')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ArticuloRow | null;
    },
    null,
  );
}

// ============================================================
// Abogados / equipo
// ============================================================
export async function getAbogados(): Promise<AbogadoRow[]> {
  return safeQuery(
    'getAbogados',
    async () => {
      const { data, error } = await supabase
        .from('abogados')
        .select('id, slug, nombre, cargo, bio, foto_url, anos_trayectoria, formacion, especialidades, orden')
        .order('orden', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AbogadoRow[];
    },
    [],
  );
}

// ============================================================
// Configuración del estudio (key-value)
// ============================================================
const DEFAULT_CONFIG: ConfigMap = {
  nombre_estudio: 'Guíñez Galaz Abogados',
  telefono: '+56 9 0000 0000',
  email: 'contacto@guinezgalaz.cl',
  direccion: 'Calle Hernán Correa 2140, Galilea, Curicó, Región del Maule, Chile',
  ciudad: 'Curicó',
  region: 'Región del Maule',
  sede_secundaria: 'Valparaíso, Chile · atención presencial bajo cita',
  horario: 'Lunes a Viernes, 9:00 - 18:00',
  whatsapp: '+56900000000',
  google_business: '',
  linkedin: '',
  instagram: '',
};

export async function getConfig(): Promise<ConfigMap> {
  return safeQuery(
    'getConfig',
    async () => {
      const { data, error } = await supabase
        .from('configuracion_estudio')
        .select('clave, valor');
      if (error) throw error;
      const map: ConfigMap = { ...DEFAULT_CONFIG };
      for (const row of data ?? []) {
        if (row.valor) map[row.clave] = row.valor;
      }
      return map;
    },
    { ...DEFAULT_CONFIG },
  );
}

// ============================================================
// Util: pick i18n con fallback a 'es' y luego a string vacío
// ============================================================
export function pickLang(field: I18nText | undefined, lang: string): string {
  if (!field) return '';
  return field[lang] || field['es'] || Object.values(field)[0] || '';
}

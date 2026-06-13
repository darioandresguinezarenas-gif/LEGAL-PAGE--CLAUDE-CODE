-- Migración 006: columnas SEO por idioma en áreas de práctica
-- Permite actualizar título y descripción SEO desde el admin sin tocar código

ALTER TABLE areas_practica
  ADD COLUMN IF NOT EXISTS seo_titulo JSONB,
  ADD COLUMN IF NOT EXISTS seo_descripcion JSONB;

-- Seed: títulos y descripciones Curicó-first (ES / EN / ZH)
UPDATE areas_practica SET
  seo_titulo = '{"es":"Abogado Laboral en Curicó | Guíñez Galaz","en":"Labour Lawyer in Curicó, Chile | Guíñez Galaz","zh":"库里科劳动法律师 | Guíñez Galaz"}',
  seo_descripcion = '{"es":"Defensa de trabajadores y empresas en Curicó: despidos, tutela laboral y negociación colectiva. Primera consulta gratuita.","en":"Employment law defence for workers and businesses in Curicó. Dismissals, workplace harassment and collective bargaining. Free first consultation.","zh":"库里科劳动法辩护：解雇、劳动保护和集体谈判。首次咨询免费。"}'
WHERE slug = 'laboral' AND deleted_at IS NULL;

UPDATE areas_practica SET
  seo_titulo = '{"es":"Abogado Civil en Curicó | Guíñez Galaz","en":"Civil Lawyer in Curicó, Chile | Guíñez Galaz","zh":"库里科民事律师 | Guíñez Galaz"}',
  seo_descripcion = '{"es":"Contratos, herencias, sucesiones, responsabilidad civil y propiedad en Curicó. Soluciones legales claras y efectivas.","en":"Contracts, inheritances, estates, civil liability and property law in Curicó. Clear and effective legal solutions.","zh":"库里科民事法律服务：合同、遗产、继承、民事责任和财产法。"}'
WHERE slug = 'civil' AND deleted_at IS NULL;

UPDATE areas_practica SET
  seo_titulo = '{"es":"Abogado Penalista en Curicó | Guíñez Galaz","en":"Criminal Lawyer in Curicó, Chile | Guíñez Galaz","zh":"库里科刑事律师 | Guíñez Galaz"}',
  seo_descripcion = '{"es":"Defensa penal experta en Curicó. Protegemos sus derechos en todas las etapas del proceso. Consulta inmediata.","en":"Expert criminal defence in Curicó. We protect your rights at every stage of the process. Immediate consultation.","zh":"库里科专业刑事辩护。在诉讼程序的各个阶段保护您的权利。"}'
WHERE slug = 'penal' AND deleted_at IS NULL;

UPDATE areas_practica SET
  seo_titulo = '{"es":"Abogado de Herencias en Curicó | Guíñez Galaz","en":"Family & Inheritance Lawyer in Curicó, Chile | Guíñez Galaz","zh":"库里科家庭与遗产律师 | Guíñez Galaz"}',
  seo_descripcion = '{"es":"Divorcios, herencias, pensiones alimenticias y mediación familiar en Curicó. Atención personalizada y profesional.","en":"Divorces, inheritances, alimony, child custody and family mediation in Curicó. Personalised and professional care.","zh":"库里科家庭与遗产法：离婚、遗产、抚养费、监护权和家庭调解。"}'
WHERE slug = 'familia' AND deleted_at IS NULL;

UPDATE areas_practica SET
  seo_titulo = '{"es":"Abogado Empresarial en Curicó | Guíñez Galaz","en":"Business Lawyer in Curicó, Chile | Guíñez Galaz","zh":"库里科企业法律师 | Guíñez Galaz"}',
  seo_descripcion = '{"es":"Constitución de empresas, cumplimiento regulatorio y asesoría estratégica para negocios en Curicó y Chile.","en":"Company formation, regulatory compliance and strategic advisory for businesses in Curicó and Chile.","zh":"库里科企业法咨询：公司成立、合规和战略顾问服务。"}'
WHERE slug = 'corporativo' AND deleted_at IS NULL;

UPDATE areas_practica SET
  seo_titulo = '{"es":"Abogado de Contratos en Curicó | Guíñez Galaz","en":"Contract Lawyer in Curicó, Chile | Guíñez Galaz","zh":"库里科合同律师 | Guíñez Galaz"}',
  seo_descripcion = '{"es":"Redacción, revisión y negociación de contratos en Curicó. Proteja sus intereses empresariales y personales.","en":"Contract drafting, review and negotiation in Curicó. Protect your business and personal interests.","zh":"库里科合同起草、审查和谈判。保护您的商业和个人利益。"}'
WHERE slug = 'contratos' AND deleted_at IS NULL;

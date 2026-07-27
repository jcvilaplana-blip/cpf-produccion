-- Seed all 27 professional categories and 223+ subcategories for VideOnJob
-- This script is idempotent: uses ON CONFLICT DO NOTHING

-- First clear existing data to avoid duplicates
DELETE FROM subcategories;
DELETE FROM categories;

-- 1. Hosteleria y Turismo
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Hosteleria y Turismo', 'hosteleria-turismo', '🍽️', 1);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Camarero/a', 'camarero', 1),
  ('Cocina', 'cocina', 2),
  ('Coctelero/a (Bartender)', 'coctelero-bartender', 3),
  ('Panaderia / Reposteria / Confiteria', 'panaderia-reposteria', 4),
  ('Sumiller (Sommelier)', 'sumiller', 5),
  ('Maitre', 'maitre', 6),
  ('Barista', 'barista', 7),
  ('Jefe/a de Sala', 'jefe-de-sala', 8),
  ('Recepcionista de Hotel', 'recepcionista-hotel', 9),
  ('Conserje', 'conserje', 10),
  ('Gobernanta / Housekeeper', 'gobernanta-housekeeper', 11),
  ('Animador/a Turistico', 'animador-turistico', 12),
  ('Guia Turistico', 'guia-turistico', 13),
  ('Agente de Viajes', 'agente-viajes', 14),
  ('Revenue Manager', 'revenue-manager', 15),
  ('Director/a de Hotel', 'director-hotel', 16),
  ('Chef Ejecutivo', 'chef-ejecutivo', 17),
  ('Cortador/a de Jamon', 'cortador-jamon', 18),
  ('Pizzero/a', 'pizzero', 19),
  ('Friegaplatos / Office', 'friegaplatos-office', 20)
) AS s(name, slug, sort_order)
WHERE c.slug = 'hosteleria-turismo';

-- 2. Informatica y Comunicaciones
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Informatica y Comunicaciones', 'informatica-comunicaciones', '💻', 2);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Desarrollo Web', 'desarrollo-web', 1),
  ('Desarrollo Multiplataforma', 'desarrollo-multiplataforma', 2),
  ('Administracion de Sistemas', 'administracion-sistemas', 3),
  ('Ciberseguridad', 'ciberseguridad', 4),
  ('IA y Big Data', 'ia-big-data', 5),
  ('Soporte Tecnico', 'soporte-tecnico', 6),
  ('DevOps / Cloud', 'devops-cloud', 7),
  ('Diseno UX/UI', 'diseno-ux-ui', 8),
  ('Blockchain', 'blockchain', 9),
  ('Telecomunicaciones', 'telecomunicaciones', 10),
  ('Redes y Comunicaciones', 'redes-comunicaciones', 11)
) AS s(name, slug, sort_order)
WHERE c.slug = 'informatica-comunicaciones';

-- 3. Sanidad
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Sanidad', 'sanidad', '🏥', 3);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Enfermeria', 'enfermeria', 1),
  ('Auxiliar de Enfermeria', 'auxiliar-enfermeria', 2),
  ('Emergencias Sanitarias', 'emergencias-sanitarias', 3),
  ('Farmacia y Parafarmacia', 'farmacia-parafarmacia', 4),
  ('Laboratorio Clinico', 'laboratorio-clinico', 5),
  ('Imagen para Diagnostico', 'imagen-diagnostico', 6),
  ('Higiene Bucodental', 'higiene-bucodental', 7),
  ('Dietetica y Nutricion', 'dietetica-nutricion', 8),
  ('Protesico Dental', 'protesico-dental', 9),
  ('Documentacion Sanitaria', 'documentacion-sanitaria', 10),
  ('Fisioterapia', 'fisioterapia', 11),
  ('Optica', 'optica', 12),
  ('Terapia Ocupacional', 'terapia-ocupacional', 13),
  ('Psicologia Clinica', 'psicologia-clinica', 14),
  ('Podologia', 'podologia', 15),
  ('Logopedia', 'logopedia', 16)
) AS s(name, slug, sort_order)
WHERE c.slug = 'sanidad';

-- 4. Comercio y Marketing
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Comercio y Marketing', 'comercio-marketing', '🛍️', 4);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Marketing y Publicidad', 'marketing-publicidad', 1),
  ('Comercio Internacional', 'comercio-internacional', 2),
  ('Gestion Comercial y Ventas', 'gestion-comercial-ventas', 3),
  ('SEO/SEM y Redes Sociales', 'seo-sem-redes-sociales', 4),
  ('Comercio Electronico', 'comercio-electronico', 5),
  ('Trade Marketing', 'trade-marketing', 6),
  ('Visual Merchandising', 'visual-merchandising', 7),
  ('Atencion al Cliente', 'atencion-cliente', 8)
) AS s(name, slug, sort_order)
WHERE c.slug = 'comercio-marketing';

-- 5. Edificacion y Obra Civil
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Edificacion y Obra Civil', 'edificacion-obra-civil', '🏗️', 5);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Construccion', 'construccion', 1),
  ('Topografia', 'topografia', 2),
  ('Proyectos de Edificacion', 'proyectos-edificacion', 3),
  ('Obras Interior / Decoracion', 'obras-interior-decoracion', 4),
  ('Albanileria', 'albanileria', 5),
  ('Fontaneria', 'fontaneria-obra', 6),
  ('Pintura', 'pintura', 7),
  ('Carpinteria', 'carpinteria-obra', 8),
  ('Soldadura', 'soldadura-obra', 9),
  ('Cristaleria / Vidrieria', 'cristaleria-vidrieria', 10),
  ('Reformas Integrales', 'reformas-integrales', 11)
) AS s(name, slug, sort_order)
WHERE c.slug = 'edificacion-obra-civil';

-- 6. Electricidad y Electronica
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Electricidad y Electronica', 'electricidad-electronica', '⚡', 6);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Instalaciones Electricas y Automaticas', 'instalaciones-electricas', 1),
  ('Sistemas Electrotecnicos', 'sistemas-electrotecnicos', 2),
  ('Automatizacion y Robotica Industrial', 'automatizacion-robotica', 3),
  ('Mantenimiento Electronico', 'mantenimiento-electronico', 4),
  ('Telecomunicaciones e Informatica', 'telecomunicaciones-informatica', 5),
  ('Domotica', 'domotica', 6),
  ('Energia Fotovoltaica', 'energia-fotovoltaica', 7)
) AS s(name, slug, sort_order)
WHERE c.slug = 'electricidad-electronica';

-- 7. Fabricacion Mecanica
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Fabricacion Mecanica', 'fabricacion-mecanica', '🔧', 7);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Mecanizado', 'mecanizado', 1),
  ('Soldadura y Caldereria', 'soldadura-caldereria', 2),
  ('Diseno en Fabricacion Mecanica', 'diseno-fabricacion-mecanica', 3),
  ('Programacion de Produccion', 'programacion-produccion', 4),
  ('Fundicion', 'fundicion', 5),
  ('Construcciones Metalicas', 'construcciones-metalicas', 6),
  ('CNC y CAD/CAM', 'cnc-cad-cam', 7),
  ('Mantenimiento Industrial', 'mantenimiento-industrial', 8)
) AS s(name, slug, sort_order)
WHERE c.slug = 'fabricacion-mecanica';

-- 8. Imagen y Sonido
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Imagen y Sonido', 'imagen-sonido', '📷', 8);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Produccion Audiovisual', 'produccion-audiovisual', 1),
  ('Realizacion de Proyectos Audiovisuales', 'realizacion-audiovisuales', 2),
  ('Sonido para Audiovisuales', 'sonido-audiovisuales', 3),
  ('Iluminacion y Escenografia', 'iluminacion-escenografia', 4),
  ('Animacion 3D y Videojuegos', 'animacion-3d-videojuegos', 5),
  ('Montaje y Postproduccion', 'montaje-postproduccion', 6),
  ('Fotografia', 'fotografia', 7),
  ('Produccion de Espectaculos', 'produccion-espectaculos', 8)
) AS s(name, slug, sort_order)
WHERE c.slug = 'imagen-sonido';

-- 9. Imagen Personal
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Imagen Personal', 'imagen-personal', '✂️', 9);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Peluqueria y Cosmetica Capilar', 'peluqueria-cosmetica', 1),
  ('Estetica Integral y Bienestar', 'estetica-integral', 2),
  ('Maquillaje Profesional', 'maquillaje-profesional', 3),
  ('Asesoria de Imagen Personal', 'asesoria-imagen', 4),
  ('Estilismo', 'estilismo', 5),
  ('Barberia', 'barberia', 6),
  ('Micropigmentacion', 'micropigmentacion', 7),
  ('Unas y Nail Art', 'unas-nail-art', 8)
) AS s(name, slug, sort_order)
WHERE c.slug = 'imagen-personal';

-- 10. Actividades Fisicas y Deportivas
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Actividades Fisicas y Deportivas', 'actividades-fisicas-deportivas', '🏋️', 10);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Acondicionamiento Fisico', 'acondicionamiento-fisico', 1),
  ('Ensenanza y Animacion Sociodeportiva', 'ensenanza-sociodeportiva', 2),
  ('Socorrismo', 'socorrismo', 3),
  ('Guia en Medio Natural', 'guia-medio-natural', 4),
  ('Futbol', 'futbol', 5),
  ('Baloncesto', 'baloncesto', 6),
  ('Tenis / Padel', 'tenis-padel', 7),
  ('Natacion', 'natacion', 8),
  ('Artes Marciales', 'artes-marciales', 9),
  ('Yoga / Pilates', 'yoga-pilates', 10),
  ('Ciclismo', 'ciclismo', 11),
  ('Atletismo', 'atletismo', 12),
  ('Deportes de Aventura', 'deportes-aventura', 13)
) AS s(name, slug, sort_order)
WHERE c.slug = 'actividades-fisicas-deportivas';

-- 11. Docencia
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Docencia', 'docencia', '🎓', 11);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Educacion Infantil', 'educacion-infantil', 1),
  ('Educacion Primaria', 'educacion-primaria', 2),
  ('Educacion Secundaria', 'educacion-secundaria', 3),
  ('Matematicas', 'matematicas', 4),
  ('Lenguas (Ingles, Frances, Aleman)', 'lenguas', 5),
  ('Ciencias', 'ciencias', 6),
  ('Educacion Especial', 'educacion-especial', 7),
  ('Musica', 'musica', 8),
  ('Educacion Fisica', 'educacion-fisica', 9),
  ('Arte y Dibujo', 'arte-dibujo', 10),
  ('Formacion y Orientacion Laboral', 'formacion-orientacion-laboral', 11)
) AS s(name, slug, sort_order)
WHERE c.slug = 'docencia';

-- 12. Derecho
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Derecho', 'derecho', '⚖️', 12);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Derecho Civil', 'derecho-civil', 1),
  ('Derecho Penal', 'derecho-penal', 2),
  ('Derecho Laboral', 'derecho-laboral', 3),
  ('Derecho Mercantil', 'derecho-mercantil', 4),
  ('Derecho Fiscal', 'derecho-fiscal', 5),
  ('Derecho Administrativo', 'derecho-administrativo', 6),
  ('Mediacion y Arbitraje', 'mediacion-arbitraje', 7),
  ('Propiedad Intelectual', 'propiedad-intelectual', 8),
  ('Compliance / Cumplimiento Normativo', 'compliance', 9)
) AS s(name, slug, sort_order)
WHERE c.slug = 'derecho';

-- 13. Energia y Agua
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Energia y Agua', 'energia-agua', '💧', 13);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Energias Renovables', 'energias-renovables', 1),
  ('Eficiencia Energetica', 'eficiencia-energetica', 2),
  ('Gestion del Agua', 'gestion-agua', 3),
  ('Redes Electricas', 'redes-electricas', 4),
  ('Gas y Petroleo', 'gas-petroleo', 5),
  ('Centrales Electricas', 'centrales-electricas', 6)
) AS s(name, slug, sort_order)
WHERE c.slug = 'energia-agua';

-- 14. Transporte y Vehiculos
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Transporte y Vehiculos', 'transporte-mantenimiento-vehiculos', '🚛', 14);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Automocion', 'automocion', 1),
  ('Electromecanica de Vehiculos', 'electromecanica-vehiculos', 2),
  ('Carroceria', 'carroceria', 3),
  ('Conduccion de Vehiculos', 'conduccion-vehiculos', 4),
  ('Logistica y Transporte', 'logistica-transporte', 5),
  ('Nautica', 'nautica', 6),
  ('Aeronautica', 'aeronautica', 7),
  ('Mantenimiento Ferroviario', 'mantenimiento-ferroviario', 8)
) AS s(name, slug, sort_order)
WHERE c.slug = 'transporte-mantenimiento-vehiculos';

-- 15. Artes Graficas
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Artes Graficas', 'artes-graficas', '🎨', 15);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Preimpresion Digital', 'preimpresion-digital', 1),
  ('Impresion Grafica', 'impresion-grafica', 2),
  ('Diseno y Gestion de Produccion Grafica', 'diseno-produccion-grafica', 3),
  ('Encuadernacion', 'encuadernacion', 4),
  ('Serigrafia', 'serigrafia', 5),
  ('Rotulacion', 'rotulacion', 6)
) AS s(name, slug, sort_order)
WHERE c.slug = 'artes-graficas';

-- 16. Instalacion y Mantenimiento
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Instalacion y Mantenimiento', 'instalacion-mantenimiento', '⚙️', 16);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Instalaciones Frigorificas y Climatizacion', 'frigorificas-climatizacion', 1),
  ('Mantenimiento de Instalaciones Termicas', 'mantenimiento-termicas', 2),
  ('Mecatronica Industrial', 'mecatronica-industrial', 3),
  ('Prevencion de Riesgos Profesionales', 'prevencion-riesgos-profesionales', 4),
  ('Fontaneria', 'fontaneria-mantenimiento', 5),
  ('Calefaccion y ACS', 'calefaccion-acs', 6)
) AS s(name, slug, sort_order)
WHERE c.slug = 'instalacion-mantenimiento';

-- 17. Seguridad y Medio Ambiente
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Seguridad y Medio Ambiente', 'seguridad-medio-ambiente', '🛡️', 17);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Prevencion de Riesgos Laborales', 'prevencion-riesgos-laborales', 1),
  ('Gestion Ambiental (ISO 14001)', 'gestion-ambiental', 2),
  ('Educacion Ambiental', 'educacion-ambiental', 3),
  ('Residuos y Reciclaje', 'residuos-reciclaje', 4),
  ('Seguridad y Vigilancia', 'seguridad-vigilancia', 5),
  ('Proteccion Civil', 'proteccion-civil', 6),
  ('Control de Plagas', 'control-plagas', 7)
) AS s(name, slug, sort_order)
WHERE c.slug = 'seguridad-medio-ambiente';

-- 18. Maritimo-Pesquera
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Maritimo-Pesquera', 'maritimo-pesquera', '⚓', 18);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Navegacion y Pesca de Litoral', 'navegacion-pesca-litoral', 1),
  ('Buceo', 'buceo', 2),
  ('Acuicultura', 'acuicultura', 3),
  ('Patron de Embarcacion', 'patron-embarcacion', 4),
  ('Mecanica Naval', 'mecanica-naval', 5),
  ('Transporte Maritimo', 'transporte-maritimo', 6)
) AS s(name, slug, sort_order)
WHERE c.slug = 'maritimo-pesquera';

-- 19. Administracion y Gestion
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Administracion y Gestion', 'administracion-gestion', '💼', 19);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Administracion y Finanzas', 'administracion-finanzas', 1),
  ('Asistencia a la Direccion', 'asistencia-direccion', 2),
  ('Gestion Administrativa', 'gestion-administrativa', 3),
  ('Contabilidad', 'contabilidad', 4),
  ('Recursos Humanos', 'recursos-humanos', 5),
  ('Secretariado', 'secretariado', 6),
  ('Gestion de Nominas', 'gestion-nominas', 7),
  ('Auditoria', 'auditoria', 8)
) AS s(name, slug, sort_order)
WHERE c.slug = 'administracion-gestion';

-- 20. Servicios Sociales y Comunitarios
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Servicios Sociales y Comunitarios', 'servicios-socioculturales-comunidad', '❤️', 20);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Educacion Infantil (0-3)', 'educacion-infantil-0-3', 1),
  ('Integracion Social', 'integracion-social', 2),
  ('Animacion Sociocultural y Turistica', 'animacion-sociocultural', 3),
  ('Mediacion Comunitaria', 'mediacion-comunitaria', 4),
  ('Atencion a Personas en Situacion de Dependencia', 'atencion-dependencia', 5),
  ('Lengua de Signos', 'lengua-signos', 6),
  ('Igualdad de Genero', 'igualdad-genero', 7)
) AS s(name, slug, sort_order)
WHERE c.slug = 'servicios-socioculturales-comunidad';

-- 21. Quimica
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Quimica', 'quimica', '🧪', 21);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Laboratorio de Analisis y Control de Calidad', 'laboratorio-analisis', 1),
  ('Quimica Industrial', 'quimica-industrial', 2),
  ('Fabricacion de Productos Farmaceuticos', 'fabricacion-farmaceuticos', 3),
  ('Quimica Ambiental', 'quimica-ambiental', 4),
  ('Plasticos y Caucho', 'plasticos-caucho', 5),
  ('Papelera y Celulosa', 'papelera-celulosa', 6)
) AS s(name, slug, sort_order)
WHERE c.slug = 'quimica';

-- 22. Agraria
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Agraria', 'agraria', '🌿', 22);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Produccion Agropecuaria', 'produccion-agropecuaria', 1),
  ('Jardineria y Floristeria', 'jardineria-floristeria', 2),
  ('Gestion Forestal', 'gestion-forestal', 3),
  ('Paisajismo', 'paisajismo', 4),
  ('Ganaderia', 'ganaderia', 5),
  ('Apicultura', 'apicultura', 6),
  ('Viticultura', 'viticultura', 7),
  ('Agricultura Ecologica', 'agricultura-ecologica', 8)
) AS s(name, slug, sort_order)
WHERE c.slug = 'agraria';

-- 23. Industrias Alimentarias
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Industrias Alimentarias', 'industrias-alimentarias', '🏭', 23);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Elaboracion de Productos Alimenticios', 'elaboracion-alimenticios', 1),
  ('Vitivinicultura', 'vitivinicultura', 2),
  ('Aceites de Oliva y Vinos', 'aceites-oliva-vinos', 3),
  ('Industria Lactea', 'industria-lactea', 4),
  ('Industria Carnica', 'industria-carnica', 5),
  ('Conservas y Procesado de Pescado', 'conservas-pescado', 6),
  ('Panaderia Industrial', 'panaderia-industrial', 7)
) AS s(name, slug, sort_order)
WHERE c.slug = 'industrias-alimentarias';

-- 24. Madera y Mueble
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Madera y Mueble', 'madera-mueble-corcho', '🌲', 24);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Carpinteria y Mueble', 'carpinteria-mueble', 1),
  ('Diseno y Amueblamiento', 'diseno-amueblamiento', 2),
  ('Instalacion de Elementos de Carpinteria', 'instalacion-carpinteria', 3),
  ('Corcho', 'corcho', 4)
) AS s(name, slug, sort_order)
WHERE c.slug = 'madera-mueble-corcho';

-- 25. Textil y Confeccion
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Textil y Confeccion', 'textil-confeccion-piel', '👔', 25);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Patronaje y Moda', 'patronaje-moda', 1),
  ('Confeccion y Moda', 'confeccion-moda', 2),
  ('Diseno Textil', 'diseno-textil', 3),
  ('Calzado y Marroquineria', 'calzado-marroquineria', 4),
  ('Curtidos', 'curtidos', 5),
  ('Tintoreria Industrial', 'tintoreria-industrial', 6)
) AS s(name, slug, sort_order)
WHERE c.slug = 'textil-confeccion-piel';

-- 26. Vidrio y Ceramica
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Vidrio y Ceramica', 'vidrio-ceramica', '💎', 26);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Fabricacion de Productos Ceramicos', 'fabricacion-ceramicos', 1),
  ('Desarrollo de Productos en Vidrio', 'desarrollo-vidrio', 2),
  ('Vidrieria Artistica', 'vidrieria-artistica', 3),
  ('Alfareria', 'alfareria', 4)
) AS s(name, slug, sort_order)
WHERE c.slug = 'vidrio-ceramica';

-- 27. Industrias Extractivas
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
  (gen_random_uuid(), 'Industrias Extractivas', 'industrias-extractivas', '⛏️', 27);

INSERT INTO subcategories (id, name, slug, sort_order, category_id)
SELECT gen_random_uuid(), s.name, s.slug, s.sort_order, c.id
FROM categories c,
(VALUES
  ('Excavacion a Cielo Abierto', 'excavacion-cielo-abierto', 1),
  ('Sondeos y Perforaciones', 'sondeos-perforaciones', 2),
  ('Operaciones de Laboreo de Minas', 'laboreo-minas', 3),
  ('Piedra Natural', 'piedra-natural', 4)
) AS s(name, slug, sort_order)
WHERE c.slug = 'industrias-extractivas';

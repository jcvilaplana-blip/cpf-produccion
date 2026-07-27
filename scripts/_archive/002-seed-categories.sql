-- Seed all categories and subcategories for VIDEOnJOB

-- 1. Actividades Fisicas y Deportivas
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Actividades Fisicas y Deportivas', 'actividades-fisicas-deportivas', 'Dumbbell', 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Tecnico deportivo', 'tecnico-deportivo', 1),
  ('Futbol', 'futbol', 2),
  ('Baloncesto', 'baloncesto', 3),
  ('Voleibol', 'voleibol', 4),
  ('Otro deporte', 'otro-deporte', 5),
  ('Acceso y Conservacion en Instalaciones Deportivas', 'acceso-conservacion-instalaciones', 6),
  ('Actividades Ecuestres', 'actividades-ecuestres', 7),
  ('Guia en el Medio Natural y de Tiempo Libre', 'guia-medio-natural', 8),
  ('Acondicionamiento Fisico', 'acondicionamiento-fisico', 9),
  ('Animacion Sociodeportiva', 'animacion-sociodeportiva', 10)
) AS s(name, slug, sort_order) WHERE c.slug = 'actividades-fisicas-deportivas' ON CONFLICT DO NOTHING;

-- 2. Administracion y Gestion
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Administracion y Gestion', 'administracion-gestion', 'Briefcase', 2) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Informatica de Oficina', 'informatica-oficina', 1),
  ('Servicios Administrativos', 'servicios-administrativos', 2),
  ('Gestion Administrativa', 'gestion-administrativa', 3),
  ('Administracion y Finanzas', 'administracion-finanzas', 4),
  ('Asistencia a la Direccion', 'asistencia-direccion', 5)
) AS s(name, slug, sort_order) WHERE c.slug = 'administracion-gestion' ON CONFLICT DO NOTHING;

-- 3. Agraria
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Agraria', 'agraria', 'Leaf', 3) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Jardineria y Floristeria', 'jardineria-floristeria', 1),
  ('Produccion Agroecologica', 'produccion-agroecologica', 2),
  ('Produccion Agropecuaria', 'produccion-agropecuaria', 3),
  ('Ganaderia y Asistencia en Sanidad Animal', 'ganaderia-sanidad-animal', 4),
  ('Gestion Forestal y del Medio Natural', 'gestion-forestal', 5),
  ('Paisajismo y Medio Rural', 'paisajismo-medio-rural', 6),
  ('Floristeria y Arte Floral', 'floristeria-arte-floral', 7)
) AS s(name, slug, sort_order) WHERE c.slug = 'agraria' ON CONFLICT DO NOTHING;

-- 4. Artes Graficas
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Artes Graficas', 'artes-graficas', 'Palette', 4) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Impresion Grafica', 'impresion-grafica', 1),
  ('Preimpresion Digital', 'preimpresion-digital', 2),
  ('Diseno y Edicion de Publicaciones', 'diseno-edicion-publicaciones', 3),
  ('Diseno y Gestion de la Produccion Grafica', 'diseno-gestion-produccion', 4),
  ('Impresion Digital', 'impresion-digital', 5)
) AS s(name, slug, sort_order) WHERE c.slug = 'artes-graficas' ON CONFLICT DO NOTHING;

-- 5. Artes Escenicas
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Artes Escenicas', 'artes-escenicas', 'Theater', 5) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Cine y Teatro', 'cine-teatro', 1),
  ('Danza', 'danza', 2),
  ('Circo', 'circo', 3),
  ('Performance', 'performance', 4)
) AS s(name, slug, sort_order) WHERE c.slug = 'artes-escenicas' ON CONFLICT DO NOTHING;

-- 6. Artes y Artesanias
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Artes y Artesanias', 'artes-artesanias', 'Gem', 6) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Instrumentos Musicales', 'instrumentos-musicales', 1),
  ('Artesania Tradicional', 'artesania-tradicional', 2),
  ('Joyeria y Orfebreria', 'joyeria-orfebreria', 3),
  ('Recuperacion Artistica', 'recuperacion-artistica', 4),
  ('Vidrio', 'vidrio', 5),
  ('Ceramica Artesanal', 'ceramica-artesanal', 6),
  ('Artista Fallero y Escenografias', 'artista-fallero', 7)
) AS s(name, slug, sort_order) WHERE c.slug = 'artes-artesanias' ON CONFLICT DO NOTHING;

-- 7. Comercio y Marketing
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Comercio y Marketing', 'comercio-marketing', 'ShoppingCart', 7) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Actividades Comerciales', 'actividades-comerciales', 1),
  ('Comercializacion de Productos Alimentarios', 'comercializacion-alimentarios', 2),
  ('Comercio Internacional', 'comercio-internacional', 3),
  ('Gestion de Ventas y Espacios Comerciales', 'gestion-ventas', 4),
  ('Marketing y Publicidad', 'marketing-publicidad', 5),
  ('Transporte y Logistica', 'transporte-logistica', 6),
  ('Comercio Electronico', 'comercio-electronico', 7),
  ('SEO/SEM y Redes Sociales', 'seo-sem-redes', 8),
  ('Redaccion de Contenidos Digitales', 'redaccion-contenidos', 9)
) AS s(name, slug, sort_order) WHERE c.slug = 'comercio-marketing' ON CONFLICT DO NOTHING;

-- 8. Derecho
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Derecho', 'derecho', 'Scale', 8) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Derecho Constitucional', 'derecho-constitucional', 1),
  ('Derecho Administrativo', 'derecho-administrativo', 2),
  ('Derecho Penal', 'derecho-penal', 3),
  ('Derecho Civil', 'derecho-civil', 4),
  ('Derecho Laboral', 'derecho-laboral', 5),
  ('Derecho Mercantil', 'derecho-mercantil', 6),
  ('Derecho Fiscal', 'derecho-fiscal', 7),
  ('Derecho Internacional', 'derecho-internacional', 8),
  ('Derecho de Familia', 'derecho-familia', 9),
  ('Derecho Ambiental', 'derecho-ambiental', 10)
) AS s(name, slug, sort_order) WHERE c.slug = 'derecho' ON CONFLICT DO NOTHING;

-- 9. Direccion
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Direccion', 'direccion', 'Crown', 9) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Direccion de Empresas', 'direccion-empresas', 1),
  ('Direccion de Equipos', 'direccion-equipos', 2),
  ('Direccion de Departamentos', 'direccion-departamentos', 3)
) AS s(name, slug, sort_order) WHERE c.slug = 'direccion' ON CONFLICT DO NOTHING;

-- 10. Docencia
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Docencia', 'docencia', 'GraduationCap', 10) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Matematicas', 'matematicas', 1),
  ('Biologia', 'biologia', 2),
  ('Quimica', 'quimica-docencia', 3),
  ('Fisica', 'fisica', 4),
  ('Lenguas', 'lenguas', 5),
  ('Historia', 'historia', 6),
  ('Filosofia', 'filosofia', 7)
) AS s(name, slug, sort_order) WHERE c.slug = 'docencia' ON CONFLICT DO NOTHING;

-- 11. Edificacion y Obra Civil
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Edificacion y Obra Civil', 'edificacion-obra-civil', 'Building', 11) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Construccion', 'construccion', 1),
  ('Obras de Interior y Decoracion', 'obras-interior-decoracion', 2),
  ('Proyectos de Edificacion', 'proyectos-edificacion', 3),
  ('Proyectos de Obra Civil', 'proyectos-obra-civil', 4),
  ('Encofrados', 'encofrados', 5),
  ('Rehabilitacion', 'rehabilitacion', 6)
) AS s(name, slug, sort_order) WHERE c.slug = 'edificacion-obra-civil' ON CONFLICT DO NOTHING;

-- 12. Electricidad y Electronica
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Electricidad y Electronica', 'electricidad-electronica', 'Zap', 12) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Instalaciones Electricas', 'instalaciones-electricas', 1),
  ('Instalaciones de Telecomunicaciones', 'instalaciones-telecomunicaciones', 2),
  ('Automatizacion y Robotica Industrial', 'automatizacion-robotica', 3),
  ('Electromedicina Clinica', 'electromedicina', 4),
  ('Mantenimiento Electronico', 'mantenimiento-electronico', 5),
  ('Ciberseguridad en Tecnologias de Operacion', 'ciberseguridad-ot', 6),
  ('Redes 5G', 'redes-5g', 7),
  ('IoT - Sistemas Conectados', 'iot-sistemas', 8),
  ('Robotica Colaborativa', 'robotica-colaborativa', 9)
) AS s(name, slug, sort_order) WHERE c.slug = 'electricidad-electronica' ON CONFLICT DO NOTHING;

-- 13. Energia y Agua
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Energia y Agua', 'energia-agua', 'Droplets', 13) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Tratamiento de Aguas', 'tratamiento-aguas', 1),
  ('Centrales Electricas', 'centrales-electricas', 2),
  ('Eficiencia Energetica', 'eficiencia-energetica', 3),
  ('Energias Renovables', 'energias-renovables', 4),
  ('Gestion del Agua', 'gestion-agua', 5),
  ('Energia Solar Fotovoltaica', 'solar-fotovoltaica', 6)
) AS s(name, slug, sort_order) WHERE c.slug = 'energia-agua' ON CONFLICT DO NOTHING;

-- 14. Fabricacion Mecanica
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Fabricacion Mecanica', 'fabricacion-mecanica', 'Wrench', 14) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Fabricacion de Elementos Metalicos', 'fabricacion-metalicos', 1),
  ('Mecanizado', 'mecanizado', 2),
  ('Soldadura y Caldereria', 'soldadura-caldereria', 3),
  ('Construcciones Metalicas', 'construcciones-metalicas', 4),
  ('Diseno en Fabricacion Mecanica', 'diseno-fabricacion', 5),
  ('Fabricacion Aditiva', 'fabricacion-aditiva', 6)
) AS s(name, slug, sort_order) WHERE c.slug = 'fabricacion-mecanica' ON CONFLICT DO NOTHING;

-- 15. Hosteleria y Turismo
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Hosteleria y Turismo', 'hosteleria-turismo', 'UtensilsCrossed', 15) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Panaderia y Bolleria', 'panaderia-bolleria', 1),
  ('Reposteria y Pasteleria', 'reposteria-pasteleria', 2),
  ('Cocina', 'cocina', 3),
  ('Lavaplatos', 'lavaplatos', 4),
  ('Camarero/a', 'camarero', 5),
  ('Barista', 'barista', 6),
  ('Coctelero/a', 'coctelero', 7),
  ('Sumiller (Sommelier)', 'sommelier', 8),
  ('Jefe de Sala (Maitre)', 'maitre', 9),
  ('Recepcionista', 'recepcionista', 10),
  ('Gobernanta', 'gobernanta', 11),
  ('Limpieza (Office)', 'office', 12),
  ('Agencias de Viajes y Eventos', 'agencias-viajes-eventos', 13),
  ('Gestion de Alojamientos Turisticos', 'gestion-alojamientos', 14),
  ('Guia Turistico', 'guia-turistico', 15),
  ('Congresos, Ferias y Exposiciones', 'congresos-ferias', 16),
  ('Alojamiento y Lavanderia', 'alojamiento-lavanderia', 17)
) AS s(name, slug, sort_order) WHERE c.slug = 'hosteleria-turismo' ON CONFLICT DO NOTHING;

-- 16. Imagen Personal
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Imagen Personal', 'imagen-personal', 'Scissors', 16) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Estetica y Belleza', 'estetica-belleza', 1),
  ('Peluqueria y Cosmetica Capilar', 'peluqueria-cosmetica', 2),
  ('Asesoria de Imagen Personal', 'asesoria-imagen', 3),
  ('Maquillaje Profesional', 'maquillaje-profesional', 4),
  ('Estetica Integral y Bienestar', 'estetica-integral', 5),
  ('Termalismo y Bienestar', 'termalismo-bienestar', 6)
) AS s(name, slug, sort_order) WHERE c.slug = 'imagen-personal' ON CONFLICT DO NOTHING;

-- 17. Imagen y Sonido
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Imagen y Sonido', 'imagen-sonido', 'Camera', 17) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Video Disc-Jockey y Sonido', 'video-dj-sonido', 1),
  ('Animaciones 3D y Videojuegos', 'animaciones-3d', 2),
  ('Iluminacion y Tratamiento de Imagen', 'iluminacion-imagen', 3),
  ('Produccion Audiovisual', 'produccion-audiovisual', 4),
  ('Realizacion Audiovisual', 'realizacion-audiovisual', 5),
  ('Sonido para Audiovisuales', 'sonido-audiovisuales', 6),
  ('Audiodescripcion y Subtitulacion', 'audiodescripcion', 7),
  ('Montaje y Postproduccion', 'montaje-postproduccion', 8)
) AS s(name, slug, sort_order) WHERE c.slug = 'imagen-sonido' ON CONFLICT DO NOTHING;

-- 18. Industrias Alimentarias
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Industrias Alimentarias', 'industrias-alimentarias', 'Apple', 18) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Aceites de Oliva y Vinos', 'aceites-vinos', 1),
  ('Elaboracion de Productos Alimenticios', 'elaboracion-alimenticios', 2),
  ('Reposteria y Confiteria', 'reposteria-confiteria-industrial', 3),
  ('Calidad en la Industria Alimentaria', 'calidad-alimentaria', 4),
  ('Vitivinicultura', 'vitivinicultura', 5),
  ('Tecnologia Quesera', 'tecnologia-quesera', 6)
) AS s(name, slug, sort_order) WHERE c.slug = 'industrias-alimentarias' ON CONFLICT DO NOTHING;

-- 19. Industrias Extractivas
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Industrias Extractivas', 'industrias-extractivas', 'Pickaxe', 19) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Excavaciones y Sondeos', 'excavaciones-sondeos', 1),
  ('Piedra Natural', 'piedra-natural', 2),
  ('Trabajos Geotecnicos', 'trabajos-geotecnicos', 3)
) AS s(name, slug, sort_order) WHERE c.slug = 'industrias-extractivas' ON CONFLICT DO NOTHING;

-- 20. Informatica y Comunicaciones
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Informatica y Comunicaciones', 'informatica-comunicaciones', 'Monitor', 20) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Sistemas Microinformaticos y Redes', 'sistemas-redes', 1),
  ('Administracion de Sistemas', 'admin-sistemas', 2),
  ('Desarrollo de Aplicaciones Multiplataforma', 'desarrollo-multiplataforma', 3),
  ('Desarrollo de Aplicaciones Web', 'desarrollo-web', 4),
  ('Ciberseguridad', 'ciberseguridad', 5),
  ('Python', 'desarrollo-python', 6),
  ('Videojuegos y Realidad Virtual', 'videojuegos-vr', 7),
  ('Inteligencia Artificial y Big Data', 'ia-big-data', 8),
  ('Paginas Web', 'paginas-web', 9)
) AS s(name, slug, sort_order) WHERE c.slug = 'informatica-comunicaciones' ON CONFLICT DO NOTHING;

-- 21. Instalacion y Mantenimiento
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Instalacion y Mantenimiento', 'instalacion-mantenimiento', 'Settings', 21) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Mantenimiento de Viviendas', 'mantenimiento-viviendas', 1),
  ('Instalaciones Frigorificas y Climatizacion', 'frigorificas-climatizacion', 2),
  ('Mantenimiento Electromecanico', 'mantenimiento-electromecanico', 3),
  ('Mecatronica Industrial', 'mecatronica-industrial', 4),
  ('Fontaneria y Calefaccion', 'fontaneria-calefaccion', 5),
  ('Fabricacion Inteligente', 'fabricacion-inteligente', 6),
  ('BIM', 'bim', 7)
) AS s(name, slug, sort_order) WHERE c.slug = 'instalacion-mantenimiento' ON CONFLICT DO NOTHING;

-- 22. Madera, Mueble y Corcho
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Madera, Mueble y Corcho', 'madera-mueble-corcho', 'TreePine', 22) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Carpinteria y Mueble', 'carpinteria-mueble', 1),
  ('Instalacion y Amueblamiento', 'instalacion-amueblamiento', 2),
  ('Transformacion de la Madera', 'transformacion-madera', 3),
  ('Diseno y Amueblamiento', 'diseno-amueblamiento', 4)
) AS s(name, slug, sort_order) WHERE c.slug = 'madera-mueble-corcho' ON CONFLICT DO NOTHING;

-- 23. Maritimo Pesquera
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Maritimo Pesquera', 'maritimo-pesquera', 'Anchor', 23) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Actividades Maritimo-Pesqueras', 'actividades-maritimas', 1),
  ('Embarcaciones Deportivas y Recreo', 'embarcaciones-deportivas', 2),
  ('Cultivos Acuicolas', 'cultivos-acuicolas', 3),
  ('Maquinaria de Buques', 'maquinaria-buques', 4),
  ('Navegacion y Pesca', 'navegacion-pesca', 5),
  ('Operaciones Subacuaticas', 'operaciones-subacuaticas', 6)
) AS s(name, slug, sort_order) WHERE c.slug = 'maritimo-pesquera' ON CONFLICT DO NOTHING;

-- 24. Quimica
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Quimica', 'quimica', 'FlaskConical', 24) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Operaciones de Laboratorio', 'operaciones-laboratorio', 1),
  ('Planta Quimica', 'planta-quimica', 2),
  ('Productos Farmaceuticos', 'productos-farmaceuticos', 3),
  ('Analisis y Control de Calidad', 'analisis-control-calidad', 4),
  ('Quimica Industrial', 'quimica-industrial', 5),
  ('Biotecnologia', 'biotecnologia', 6)
) AS s(name, slug, sort_order) WHERE c.slug = 'quimica' ON CONFLICT DO NOTHING;

-- 25. Sanidad
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Sanidad', 'sanidad', 'Heart', 25) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Enfermeria', 'enfermeria', 1),
  ('Emergencias Sanitarias', 'emergencias-sanitarias', 2),
  ('Farmacia y Parafarmacia', 'farmacia-parafarmacia', 3),
  ('Anatomia Patologica', 'anatomia-patologica', 4),
  ('Audiologia Protesica', 'audiologia-protesica', 5),
  ('Dietética', 'dietetica', 6),
  ('Higiene Bucodental', 'higiene-bucodental', 7),
  ('Imagen para Diagnostico', 'imagen-diagnostico', 8),
  ('Laboratorio Clinico', 'laboratorio-clinico', 9),
  ('Protesis Dentales', 'protesis-dentales', 10),
  ('Radioterapia', 'radioterapia', 11),
  ('Transporte Sanitario', 'transporte-sanitario', 12)
) AS s(name, slug, sort_order) WHERE c.slug = 'sanidad' ON CONFLICT DO NOTHING;

-- 26. Seguridad y Medio Ambiente
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Seguridad y Medio Ambiente', 'seguridad-medio-ambiente', 'Shield', 26) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Emergencias y Proteccion Civil', 'emergencias-proteccion', 1),
  ('Seguridad Privada', 'seguridad-privada', 2),
  ('Prevencion de Riesgos', 'prevencion-riesgos', 3),
  ('Educacion Ambiental', 'educacion-ambiental', 4),
  ('Control de Plagas', 'control-plagas', 5),
  ('Vigilancia', 'vigilancia', 6)
) AS s(name, slug, sort_order) WHERE c.slug = 'seguridad-medio-ambiente' ON CONFLICT DO NOTHING;

-- 27. Servicios Socioculturales y a la Comunidad
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Servicios Socioculturales', 'servicios-socioculturales', 'Users', 27) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Atencion a Personas Dependientes', 'atencion-dependientes', 1),
  ('Animacion Sociocultural', 'animacion-sociocultural', 2),
  ('Educacion Infantil', 'educacion-infantil', 3),
  ('Integracion Social', 'integracion-social', 4),
  ('Mediacion Comunicativa', 'mediacion-comunicativa', 5),
  ('Promocion de Igualdad', 'promocion-igualdad', 6),
  ('Limpieza de Edificios', 'limpieza-edificios', 7)
) AS s(name, slug, sort_order) WHERE c.slug = 'servicios-socioculturales' ON CONFLICT DO NOTHING;

-- 28. Textil, Confeccion y Piel
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Textil, Confeccion y Piel', 'textil-confeccion-piel', 'Shirt', 28) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Confeccion y Moda', 'confeccion-moda', 1),
  ('Calzado y Complementos', 'calzado-complementos', 2),
  ('Patronaje y Moda', 'patronaje-moda', 3),
  ('Tapiceria y Cortinaje', 'tapiceria-cortinaje', 4),
  ('Vestuario a Medida', 'vestuario-medida', 5),
  ('Diseno Textil', 'diseno-textil', 6)
) AS s(name, slug, sort_order) WHERE c.slug = 'textil-confeccion-piel' ON CONFLICT DO NOTHING;

-- 29. Traduccion e Interpretacion
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Traduccion e Interpretacion', 'traduccion-interpretacion', 'Languages', 29) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Ingles', 'ingles', 1),
  ('Frances', 'frances', 2),
  ('Chino', 'chino', 3),
  ('Aleman', 'aleman', 4),
  ('Otro idioma', 'otro-idioma', 5)
) AS s(name, slug, sort_order) WHERE c.slug = 'traduccion-interpretacion' ON CONFLICT DO NOTHING;

-- 30. Transporte y Mantenimiento de Vehiculos
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Transporte y Vehiculos', 'transporte-vehiculos', 'Car', 30) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Mantenimiento de Vehiculos', 'mantenimiento-vehiculos', 1),
  ('Carroceria', 'carroceria', 2),
  ('Conduccion Profesional', 'conduccion-profesional', 3),
  ('Electromecánica de Vehiculos', 'electromecanica-vehiculos', 4),
  ('Mantenimiento Aeronautico', 'mantenimiento-aeronautico', 5),
  ('Drones', 'drones', 6),
  ('Vehiculos Hibridos y Electricos', 'vehiculos-hibridos-electricos', 7)
) AS s(name, slug, sort_order) WHERE c.slug = 'transporte-vehiculos' ON CONFLICT DO NOTHING;

-- 31. Vidrio y Ceramica
INSERT INTO categories (name, slug, icon, sort_order) VALUES ('Vidrio y Ceramica', 'vidrio-ceramica', 'Wine', 31) ON CONFLICT (slug) DO NOTHING;
INSERT INTO subcategories (category_id, name, slug, sort_order) SELECT c.id, s.name, s.slug, s.sort_order FROM categories c, (VALUES
  ('Vidrieria y Alfareria', 'vidrieria-alfareria', 1),
  ('Fabricacion de Productos Ceramicos', 'fabricacion-ceramicos', 2)
) AS s(name, slug, sort_order) WHERE c.slug = 'vidrio-ceramica' ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED DEMO DATA - Consistent and Related
-- =====================================================

-- =====================================================
-- 1. CATEGORIES
-- =====================================================

INSERT INTO public.categories (id, name, name_en, slug, description, display_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Camarero', 'Waiter', 'camarero', 'Servicio de sala y barra', 1),
  ('22222222-2222-2222-2222-222222222222', 'Chef/Jefe de cocina', 'Chef', 'chef', 'Jefe de cocina y chef ejecutivo', 2),
  ('33333333-3333-3333-3333-333333333333', 'Cocinero', 'Cook', 'cocinero', 'Cocinero de línea y ayudante', 3),
  ('44444444-4444-4444-4444-444444444444', 'Coctelero', 'Bartender', 'coctelero', 'Especialista en cócteles y bebidas', 4),
  ('55555555-5555-5555-5555-555555555555', 'Sommelier', 'Sommelier', 'sommelier', 'Experto en vinos', 5),
  ('66666666-6666-6666-6666-666666666666', 'Maitre', 'Maitre', 'maitre', 'Jefe de sala y atención al cliente', 6),
  ('77777777-7777-7777-7777-777777777777', 'Recepcionista', 'Receptionist', 'recepcionista', 'Recepción de hotel', 7),
  ('88888888-8888-8888-8888-888888888888', 'Ayudante de cocina', 'Kitchen Assistant', 'ayudante-cocina', 'Ayudante y preparación', 8);

-- Subcategories
INSERT INTO public.subcategories (category_id, name, slug) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sala', 'sala'),
  ('11111111-1111-1111-1111-111111111111', 'Barra', 'barra'),
  ('11111111-1111-1111-1111-111111111111', 'Terraza', 'terraza'),
  ('22222222-2222-2222-2222-222222222222', 'Chef Ejecutivo', 'chef-ejecutivo'),
  ('22222222-2222-2222-2222-222222222222', 'Sous Chef', 'sous-chef'),
  ('33333333-3333-3333-3333-333333333333', 'Cocinero de Línea', 'cocinero-linea'),
  ('33333333-3333-3333-3333-333333333333', 'Pastelero', 'pastelero'),
  ('44444444-4444-4444-4444-444444444444', 'Mixología', 'mixologia'),
  ('44444444-4444-4444-4444-444444444444', 'Barista', 'barista');

-- =====================================================
-- 2. DEMO USERS (All with consistent data)
-- =====================================================

-- Note: In production, these would be created through Supabase Auth
-- For demo purposes, we'll insert them directly
-- Password for all demo users: "Demo123!"

-- WORKER 1: Santiago García (Camarero)
INSERT INTO public.users (id, email, phone, role, account_status, full_name, avatar_url) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'santiago.garcia@demo.com', '+34612345001', 'worker', 'active', 'Santiago García', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop');

INSERT INTO public.worker_profiles (
  id, user_id, display_name, bio, city, province, postal_code,
  primary_category_id, experience_level, experience_years,
  availability, contract_preference, expected_salary_min, expected_salary_max,
  avatar_url, video_presentation_url, video_thumbnail_url,
  rating, total_reviews, is_verified, is_active, is_looking_for_work, profile_completed
) VALUES (
  'wp111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  'Santiago García',
  'Camarero profesional con 8 años de experiencia en restaurantes de alta gama. Especializado en servicio de sala y atención al cliente. Apasionado por la hostelería y el trato personalizado.',
  'Madrid', 'Madrid', '28001',
  '11111111-1111-1111-1111-111111111111', -- Camarero
  '5-10_años', 8,
  'inmediata', 'indefinido', 1800, 2200,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  4.8, 12, TRUE, TRUE, TRUE, TRUE
);

-- WORKER 2: Carlos Martínez (Chef)
INSERT INTO public.users (id, email, phone, role, account_status, full_name, avatar_url) VALUES
  ('a2222222-2222-2222-2222-222222222222', 'carlos.martinez@demo.com', '+34612345002', 'worker', 'active', 'Carlos Martínez', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop');

INSERT INTO public.worker_profiles (
  id, user_id, display_name, bio, city, province, postal_code,
  primary_category_id, experience_level, experience_years,
  availability, contract_preference, expected_salary_min, expected_salary_max,
  avatar_url, video_presentation_url, video_thumbnail_url,
  rating, total_reviews, is_verified, is_active, is_looking_for_work, profile_completed
) VALUES (
  'wp222222-2222-2222-2222-222222222222',
  'a2222222-2222-2222-2222-222222222222',
  'Carlos Martínez',
  'Chef ejecutivo con más de 10 años de experiencia en cocina mediterránea y de autor. Formación en escuelas de prestigio y experiencia internacional.',
  'Barcelona', 'Barcelona', '08001',
  '22222222-2222-2222-2222-222222222222', -- Chef
  'mas_de_10_años', 10,
  '1_mes', 'indefinido', 2500, 3500,
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop',
  4.9, 18, TRUE, TRUE, TRUE, TRUE
);

-- WORKER 3: Ana López (Coctelera)
INSERT INTO public.users (id, email, phone, role, account_status, full_name, avatar_url) VALUES
  ('a3333333-3333-3333-3333-333333333333', 'ana.lopez@demo.com', '+34612345003', 'worker', 'active', 'Ana López', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=400&fit=crop');

INSERT INTO public.worker_profiles (
  id, user_id, display_name, bio, city, province, postal_code,
  primary_category_id, experience_level, experience_years,
  availability, contract_preference, expected_salary_min, expected_salary_max,
  avatar_url, video_presentation_url, video_thumbnail_url,
  rating, total_reviews, is_verified, is_active, is_looking_for_work, profile_completed
) VALUES (
  'wp333333-3333-3333-3333-333333333333',
  'a3333333-3333-3333-3333-333333333333',
  'Ana López',
  'Especialista en coctelería y mixología con 5 años de experiencia. Creativa, dinámica y con amplio conocimiento en bebidas premium.',
  'Valencia', 'Valencia', '46001',
  '44444444-4444-4444-4444-444444444444', -- Coctelero
  '3-5_años', 5,
  'inmediata', 'cualquiera', 1600, 2000,
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=400&fit=crop',
  4.7, 8, TRUE, TRUE, TRUE, TRUE
);

-- WORKER 4: Miguel Rodríguez (Sommelier)
INSERT INTO public.users (id, email, phone, role, account_status, full_name, avatar_url) VALUES
  ('a4444444-4444-4444-4444-444444444444', 'miguel.rodriguez@demo.com', '+34612345004', 'worker', 'active', 'Miguel Rodríguez', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop');

INSERT INTO public.worker_profiles (
  id, user_id, display_name, bio, city, province, postal_code,
  primary_category_id, experience_level, experience_years,
  availability, contract_preference, expected_salary_min, expected_salary_max,
  avatar_url, video_presentation_url, video_thumbnail_url,
  rating, total_reviews, is_verified, is_active, is_looking_for_work, profile_completed
) VALUES (
  'wp444444-4444-4444-4444-444444444444',
  'a4444444-4444-4444-4444-444444444444',
  'Miguel Rodríguez',
  'Sommelier certificado con amplio conocimiento en vinos españoles e internacionales. 7 años de experiencia en restaurantes con estrella Michelin.',
  'Sevilla', 'Sevilla', '41001',
  '55555555-5555-5555-5555-555555555555', -- Sommelier
  '5-10_años', 7,
  '2_semanas', 'indefinido', 2000, 2800,
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  4.9, 15, TRUE, TRUE, TRUE, TRUE
);

-- WORKER 5: Laura Fernández (Maitre)
INSERT INTO public.users (id, email, phone, role, account_status, full_name, avatar_url) VALUES
  ('a5555555-5555-5555-5555-555555555555', 'laura.fernandez@demo.com', '+34612345005', 'worker', 'active', 'Laura Fernández', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop');

INSERT INTO public.worker_profiles (
  id, user_id, display_name, bio, city, province, postal_code,
  primary_category_id, experience_level, experience_years,
  availability, contract_preference, expected_salary_min, expected_salary_max,
  avatar_url, video_presentation_url, video_thumbnail_url,
  rating, total_reviews, is_verified, is_active, is_looking_for_work, profile_completed
) VALUES (
  'wp555555-5555-5555-5555-555555555555',
  'a5555555-5555-5555-5555-555555555555',
  'Laura Fernández',
  'Maitre con 6 años de experiencia en gestión de sala y coordinación de equipos. Excelentes habilidades de liderazgo y atención al detalle.',
  'Málaga', 'Málaga', '29001',
  '66666666-6666-6666-6666-666666666666', -- Maitre
  '5-10_años', 6,
  'inmediata', 'indefinido', 2200, 2800,
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
  4.8, 10, TRUE, TRUE, TRUE, TRUE
);

-- WORKER 6: David Sánchez (Cocinero)
INSERT INTO public.users (id, email, phone, role, account_status, full_name, avatar_url) VALUES
  ('a6666666-6666-6666-6666-666666666666', 'david.sanchez@demo.com', '+34612345006', 'worker', 'active', 'David Sánchez', 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&h=400&fit=crop');

INSERT INTO public.worker_profiles (
  id, user_id, display_name, bio, city, province, postal_code,
  primary_category_id, experience_level, experience_years,
  availability, contract_preference, expected_salary_min, expected_salary_max,
  avatar_url, video_presentation_url, video_thumbnail_url,
  rating, total_reviews, is_verified, is_active, is_looking_for_work, profile_completed
) VALUES (
  'wp666666-6666-6666-6666-666666666666',
  'a6666666-6666-6666-6666-666666666666',
  'David Sánchez',
  'Cocinero de línea con 4 años de experiencia en cocina mediterránea. Rápido, eficiente y con gran capacidad de trabajo en equipo.',
  'Bilbao', 'Vizcaya', '48001',
  '33333333-3333-3333-3333-333333333333', -- Cocinero
  '3-5_años', 4,
  'inmediata', 'temporal', 1500, 1900,
  'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&h=400&fit=crop',
  4.6, 7, TRUE, TRUE, TRUE, TRUE
);

-- WORKER 7: Carmen Ruiz (Recepcionista)
INSERT INTO public.users (id, email, phone, role, account_status, full_name, avatar_url) VALUES
  ('a7777777-7777-7777-7777-777777777777', 'carmen.ruiz@demo.com', '+34612345007', 'worker', 'active', 'Carmen Ruiz', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop');

INSERT INTO public.worker_profiles (
  id, user_id, display_name, bio, city, province, postal_code,
  primary_category_id, experience_level, experience_years,
  availability, contract_preference, expected_salary_min, expected_salary_max,
  avatar_url, video_presentation_url, video_thumbnail_url,
  rating, total_reviews, is_verified, is_active, is_looking_for_work, profile_completed
) VALUES (
  'wp777777-7777-7777-7777-777777777777',
  'a7777777-7777-7777-7777-777777777777',
  'Carmen Ruiz',
  'Recepcionista de hotel con 3 años de experiencia. Multilingüe (español, inglés, francés) y excelente atención al cliente.',
  'Zaragoza', 'Zaragoza', '50001',
  '77777777-7777-7777-7777-777777777777', -- Recepcionista
  '3-5_años', 3,
  '1_semana', 'indefinido', 1400, 1800,
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop',
  4.7, 6, TRUE, TRUE, TRUE, TRUE
);

-- WORKER 8: Javier Moreno (Ayudante de cocina)
INSERT INTO public.users (id, email, phone, role, account_status, full_name, avatar_url) VALUES
  ('a8888888-8888-8888-8888-888888888888', 'javier.moreno@demo.com', '+34612345008', 'worker', 'active', 'Javier Moreno', 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop');

INSERT INTO public.worker_profiles (
  id, user_id, display_name, bio, city, province, postal_code,
  primary_category_id, experience_level, experience_years,
  availability, contract_preference, expected_salary_min, expected_salary_max,
  avatar_url, video_presentation_url, video_thumbnail_url,
  rating, total_reviews, is_verified, is_active, is_looking_for_work, profile_completed
) VALUES (
  'wp888888-8888-8888-8888-888888888888',
  'a8888888-8888-8888-8888-888888888888',
  'Javier Moreno',
  'Ayudante de cocina con 2 años de experiencia. Responsable, puntual y con ganas de aprender y crecer profesionalmente.',
  'Granada', 'Granada', '18001',
  '88888888-8888-8888-8888-888888888888', -- Ayudante de cocina
  '1-2_años', 2,
  'inmediata', 'cualquiera', 1200, 1500,
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=700&fit=crop',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop',
  4.5, 4, TRUE, TRUE, TRUE, TRUE
);

-- Add specializations for workers
INSERT INTO public.worker_specializations (worker_profile_id, subcategory_id, years_experience) VALUES
  ('wp111111-1111-1111-1111-111111111111', (SELECT id FROM public.subcategories WHERE slug = 'sala'), 8),
  ('wp111111-1111-1111-1111-111111111111', (SELECT id FROM public.subcategories WHERE slug = 'barra'), 5);

-- Add languages for workers
INSERT INTO public.worker_languages (worker_profile_id, language_code, language_name, proficiency) VALUES
  ('wp111111-1111-1111-1111-111111111111', 'es', 'Español', 'nativo'),
  ('wp111111-1111-1111-1111-111111111111', 'en', 'Inglés', 'intermedio'),
  ('wp222222-2222-2222-2222-222222222222', 'es', 'Español', 'nativo'),
  ('wp222222-2222-2222-2222-222222222222', 'en', 'Inglés', 'avanzado'),
  ('wp222222-2222-2222-2222-222222222222', 'fr', 'Francés', 'intermedio');

-- =====================================================
-- 3. DEMO BUSINESS USERS
-- =====================================================

-- BUSINESS 1: Restaurante El Buen Gusto
INSERT INTO public.users (id, email, phone, role, account_status, full_name) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'contacto@elbuengusto.com', '+34911234001', 'business', 'active', 'Restaurante El Buen Gusto');

INSERT INTO public.business_profiles (
  id, user_id, business_name, business_type, cif, description,
  address, city, province, postal_code,
  phone, website, is_verified, is_active
) VALUES (
  'bp111111-1111-1111-1111-111111111111',
  'b1111111-1111-1111-1111-111111111111',
  'Restaurante El Buen Gusto',
  'restaurante',
  'B12345678',
  'Restaurante de cocina mediterránea con más de 20 años de experiencia. Ambiente familiar y productos de calidad.',
  'Calle Mayor 123',
  'Madrid',
  'Madrid',
  '28013',
  '+34911234001',
  'www.elbuengusto.com',
  TRUE,
  TRUE
);

-- BUSINESS 2: Hotel Costa del Sol
INSERT INTO public.users (id, email, phone, role, account_status, full_name) VALUES
  ('b2222222-2222-2222-2222-222222222222', 'rrhh@hotelcostadelsol.com', '+34952123456', 'business', 'active', 'Hotel Costa del Sol');

INSERT INTO public.business_profiles (
  id, user_id, business_name, business_type, cif, description,
  address, city, province, postal_code,
  phone, website, is_verified, is_active
) VALUES (
  'bp222222-2222-2222-2222-222222222222',
  'b2222222-2222-2222-2222-222222222222',
  'Hotel Costa del Sol',
  'hotel',
  'B87654321',
  'Hotel de 4 estrellas en primera línea de playa. Buscamos profesionales comprometidos para unirse a nuestro equipo.',
  'Paseo Marítimo 45',
  'Málaga',
  'Málaga',
  '29620',
  '+34952123456',
  'www.hotelcostadelsol.com',
  TRUE,
  TRUE
);

-- =====================================================
-- 4. DEMO JOB POSTS
-- =====================================================

INSERT INTO public.job_posts (
  id, business_profile_id, title, description,
  category_id, subcategory_id,
  experience_required, contract_type,
  salary_min, salary_max, salary_period,
  city, province, postal_code,
  start_date, status, published_at
) VALUES (
  'jp111111-1111-1111-1111-111111111111',
  'bp111111-1111-1111-1111-111111111111',
  'Camarero/a para Restaurante',
  'Buscamos camarero/a con experiencia para nuestro restaurante en el centro de Madrid. Incorporación inmediata. Ofrecemos contrato indefinido y buen ambiente laboral.',
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM public.subcategories WHERE slug = 'sala'),
  '3-5_años',
  'indefinido',
  1800, 2000, 'mensual',
  'Madrid', 'Madrid', '28013',
  CURRENT_DATE + INTERVAL '1 week',
  'active',
  NOW()
);

-- =====================================================
-- 5. ADMIN USER
-- =====================================================

INSERT INTO public.users (id, email, role, account_status, full_name) VALUES
  ('admin111-1111-1111-1111-111111111111', 'admin@videonjob.com', 'superadmin', 'active', 'Super Admin');

-- =====================================================
-- COMPLETED
-- =====================================================

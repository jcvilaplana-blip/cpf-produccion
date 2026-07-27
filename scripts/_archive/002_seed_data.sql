-- ============================================
-- SEED DEMO DATA
-- ============================================

-- Insert Categories
INSERT INTO public.categories (name, slug, icon, description) VALUES
('Camarero', 'camarero', '🍽️', 'Profesionales de servicio de mesa y atención al cliente'),
('Chef', 'chef', '👨‍🍳', 'Expertos en cocina y gastronomía'),
('Sommelier', 'sommelier', '🍷', 'Especialistas en vinos y maridaje'),
('Barista', 'barista', '☕', 'Expertos en café y bebidas'),
('Recepcionista', 'recepcionista', '🏨', 'Profesionales de atención en hoteles'),
('Limpieza', 'limpieza', '🧹', 'Personal de limpieza y mantenimiento')
ON CONFLICT (slug) DO NOTHING;

-- Insert SUPERADMIN
INSERT INTO public.profiles (id, email, user_type, display_name, avatar_url) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@videonjob.com', 'superadmin', 'Administrador', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin')
ON CONFLICT (email) DO NOTHING;

-- Insert Worker Profiles (CONSISTENT DATA)
INSERT INTO public.profiles (id, email, user_type, display_name, avatar_url) VALUES
('11111111-1111-1111-1111-111111111111', 'santiago.garcia@example.com', 'worker', 'Santiago García', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop'),
('22222222-2222-2222-2222-222222222222', 'carlos.martinez@example.com', 'worker', 'Carlos Martínez', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop'),
('33333333-3333-3333-3333-333333333333', 'maria.lopez@example.com', 'worker', 'María López', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop'),
('44444444-4444-4444-4444-444444444444', 'ana.rodriguez@example.com', 'worker', 'Ana Rodríguez', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop'),
('55555555-5555-5555-5555-555555555555', 'javier.fernandez@example.com', 'worker', 'Javier Fernández', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'),
('66666666-6666-6666-6666-666666666666', 'laura.sanchez@example.com', 'worker', 'Laura Sánchez', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop'),
('77777777-7777-7777-7777-777777777777', 'miguel.torres@example.com', 'worker', 'Miguel Torres', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'),
('88888888-8888-8888-8888-888888888888', 'isabel.gomez@example.com', 'worker', 'Isabel Gómez', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop')
ON CONFLICT (email) DO NOTHING;

-- Insert Worker Extended Profiles (SAME IMAGES AS PROFILES)
INSERT INTO public.worker_profiles (user_id, display_name, avatar_url, video_presentation_url, video_thumbnail_url, category, experience_years, city, postal_code, bio, rating, total_reviews) VALUES
('11111111-1111-1111-1111-111111111111', 'Santiago García', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=700&fit=crop', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop', 'Camarero', 8, 'Madrid', '28001', 'Camarero profesional con amplia experiencia en restaurantes de alta gama.', 4.8, 45),
('22222222-2222-2222-2222-222222222222', 'Carlos Martínez', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=700&fit=crop', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop', 'Chef', 10, 'Barcelona', '08001', 'Chef ejecutivo especializado en cocina mediterránea y de autor.', 4.9, 67),
('33333333-3333-3333-3333-333333333333', 'María López', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=700&fit=crop', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop', 'Sommelier', 6, 'Valencia', '46001', 'Sommelier certificada con experiencia en hoteles de lujo.', 4.7, 32),
('44444444-4444-4444-4444-444444444444', 'Ana Rodríguez', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=700&fit=crop', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop', 'Barista', 4, 'Sevilla', '41001', 'Barista profesional especializada en café de especialidad.', 4.6, 28),
('55555555-5555-5555-5555-555555555555', 'Javier Fernández', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=700&fit=crop', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', 'Camarero', 5, 'Málaga', '29001', 'Camarero con experiencia en eventos y banquetes.', 4.5, 22),
('66666666-6666-6666-6666-666666666666', 'Laura Sánchez', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=700&fit=crop', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop', 'Recepcionista', 7, 'Bilbao', '48001', 'Recepcionista de hotel con dominio de varios idiomas.', 4.8, 41),
('77777777-7777-7777-7777-777777777777', 'Miguel Torres', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=700&fit=crop', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', 'Chef', 12, 'Zaragoza', '50001', 'Chef con experiencia internacional en cocina asiática.', 4.9, 58),
('88888888-8888-8888-8888-888888888888', 'Isabel Gómez', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=700&fit=crop', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', 'Sommelier', 9, 'Granada', '18001', 'Sommelier experta en vinos españoles y maridaje.', 4.7, 36)
ON CONFLICT DO NOTHING;

-- Insert Business Profiles
INSERT INTO public.profiles (id, email, user_type, display_name, avatar_url) VALUES
('99999999-9999-9999-9999-999999999991', 'contacto@restauranteeljardin.com', 'business', 'Restaurante El Jardín', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop'),
('99999999-9999-9999-9999-999999999992', 'info@hotelgranvia.com', 'business', 'Hotel Gran Vía', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.business_profiles (user_id, company_name, display_name, avatar_url, industry, city) VALUES
('99999999-9999-9999-9999-999999999991', 'Restaurante El Jardín', 'Restaurante El Jardín', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop', 'Restauración', 'Madrid'),
('99999999-9999-9999-9999-999999999992', 'Hotel Gran Vía', 'Hotel Gran Vía', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop', 'Hotelería', 'Barcelona')
ON CONFLICT DO NOTHING;

-- Insert Sample Job
INSERT INTO public.jobs (business_id, title, description, category, contract_type, city, salary_min, salary_max, is_active) VALUES
('99999999-9999-9999-9999-999999999991', 'Camarero/a para Restaurante de Alta Cocina', 'Buscamos camarero/a profesional con experiencia en restaurantes de alta gama. Imprescindible dominio de protocolo y atención al cliente.', 'Camarero', 'full-time', 'Madrid', 1800, 2200, true)
ON CONFLICT DO NOTHING;

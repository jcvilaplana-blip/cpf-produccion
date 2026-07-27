-- Insert sample jobs for testing
INSERT INTO jobs (business_id, title, category, job_type, position, description, requirements, salary_display, location, is_active) 
SELECT 
  id,
  'Camarero/a Profesional',
  'restaurant',
  'full_time',
  'Senior',
  'Buscamos camarero/a con experiencia para restaurante de alta cocina en el centro de Madrid. Ambiente profesional y excelente equipo.',
  'Experiencia mínima de 2 años en restauración. Conocimientos de vinos. Disponibilidad inmediata.',
  '1.800€ - 2.200€/mes',
  'Madrid, España',
  true
FROM profiles 
WHERE user_type = 'business' 
LIMIT 1;

INSERT INTO jobs (business_id, title, category, job_type, position, description, requirements, salary_display, location, is_active) 
SELECT 
  id,
  'Chef de Cocina',
  'restaurant',
  'full_time',
  'Senior',
  'Restaurante italiano busca chef con experiencia en cocina mediterránea. Excelente oportunidad de crecimiento.',
  'Título de cocina profesional. Experiencia mínima 3 años. Creatividad y pasión por la gastronomía.',
  '2.500€ - 3.000€/mes',
  'Barcelona, España',
  true
FROM profiles 
WHERE user_type = 'business' 
LIMIT 1;

INSERT INTO jobs (business_id, title, category, job_type, position, description, requirements, salary_display, location, is_active) 
SELECT 
  id,
  'Bartender',
  'restaurant',
  'part_time',
  'Junior',
  'Bar de copas en zona centro busca bartender para fines de semana. Ambiente joven y dinámico.',
  'Experiencia en coctelería. Disponibilidad viernes y sábados. Actitud positiva.',
  '1.200€ - 1.500€/mes',
  'Valencia, España',
  true
FROM profiles 
WHERE user_type = 'business' 
LIMIT 1;

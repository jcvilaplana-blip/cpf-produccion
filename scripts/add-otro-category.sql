-- Añadir la categoría "Otro" para usuarios que no encuentran su categoría
-- Esta categoría aparecerá al final de la lista

-- Insertar categoría "Otro" si no existe
INSERT INTO categories (name, slug, icon)
SELECT 'Otro', 'otro', 'MoreHorizontal'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'otro');

-- Obtener el ID de la categoría Otro e insertar subcategorías
DO $$
DECLARE
  otro_category_id uuid;
BEGIN
  SELECT id INTO otro_category_id FROM categories WHERE slug = 'otro';
  
  -- Insertar subcategorías para "Otro"
  IF otro_category_id IS NOT NULL THEN
    INSERT INTO subcategories (name, slug, category_id)
    SELECT name, slug, otro_category_id FROM (VALUES
      ('Otro sector', 'otro-sector'),
      ('Sin categoría específica', 'sin-categoria'),
      ('Múltiples sectores', 'multiples-sectores')
    ) AS t(name, slug)
    WHERE NOT EXISTS (
      SELECT 1 FROM subcategories 
      WHERE category_id = otro_category_id AND subcategories.slug = t.slug
    );
  END IF;
END $$;

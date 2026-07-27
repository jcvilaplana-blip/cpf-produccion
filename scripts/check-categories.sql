-- Check if categories table has data
SELECT COUNT(*) as total_categories FROM categories;

-- Show all categories
SELECT id, name, slug, icon, sort_order FROM categories ORDER BY sort_order;

-- Check RLS policies on categories
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'categories';

// Candidate professional categories for CamareroPorFavor (hospitality sector, Spain)
// Slugs must stay in sync with the seed data in scripts/000_consolidated_schema.sql

export interface Category {
  slug: string
  name: string
  icon: string
  subcategories: Subcategory[]
}

export interface Subcategory {
  slug: string
  name: string
}

export const CATEGORIES: Category[] = [
  {
    slug: "camarero",
    name: "Camarero",
    icon: "UtensilsCrossed",
    subcategories: [
      { slug: "sala", name: "Sala" },
      { slug: "barra", name: "Barra" },
    ],
  },
  {
    slug: "coctelero",
    name: "Coctelero",
    icon: "Martini",
    subcategories: [],
  },
  {
    slug: "sommelier",
    name: "Sommelier",
    icon: "Wine",
    subcategories: [],
  },
  {
    slug: "maitre",
    name: "Maitre",
    icon: "Crown",
    subcategories: [],
  },
  {
    slug: "chef-jefe-cocina",
    name: "Chef/Jefe de cocina",
    icon: "ChefHat",
    subcategories: [],
  },
  {
    slug: "cocinero",
    name: "Cocinero",
    icon: "Utensils",
    subcategories: [],
  },
  {
    slug: "cortador-de-jamon",
    name: "Cortador de jamon",
    icon: "Scissors",
    subcategories: [],
  },
  {
    slug: "office",
    name: "Office",
    icon: "Sparkles",
    subcategories: [],
  },
  {
    slug: "recepcionista-host",
    name: "Recepcionista/Host",
    icon: "ConciergeBell",
    subcategories: [],
  },
  {
    slug: "platero",
    name: "Platero",
    icon: "Soup",
    subcategories: [],
  },
  {
    slug: "repartidor",
    name: "Repartidor",
    icon: "Bike",
    subcategories: [],
  },
  {
    slug: "encargado",
    name: "Encargado",
    icon: "ClipboardCheck",
    subcategories: [],
  },
  {
    slug: "jefe-de-sala",
    name: "Jefe de Sala",
    icon: "Users",
    subcategories: [],
  },
]

// Establishment (business) categories live as rows in the `categories` table
// with role_type = 'business', same as candidate categories (role_type =
// 'candidate') - fetch them from /api/categories, not from a local constant.

// Helper functions
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}

export function getSubcategoryName(categorySlug: string, subcategorySlug: string): string {
  const cat = getCategoryBySlug(categorySlug)
  const sub = cat?.subcategories.find((s) => s.slug === subcategorySlug)
  return sub?.name || subcategorySlug
}

export function getCategoryName(slug: string): string {
  return getCategoryBySlug(slug)?.name || slug
}

export function getAllCategorySlugs(): string[] {
  return CATEGORIES.map((c) => c.slug)
}

export function getAllSubcategorySlugs(categorySlug: string): string[] {
  const cat = getCategoryBySlug(categorySlug)
  return cat?.subcategories.map((s) => s.slug) || []
}

// The official "tipo de local" taxonomy - mirrors the `categories` rows
// where role_type='business' (see scripts/000_consolidated_schema.sql).
// Kept as a plain constant (rather than always fetching /api/categories)
// for contexts that need it synchronously - e.g. building admin column
// definitions at module scope. Values must stay byte-identical to what's
// seeded in the DB since business_profiles.business_type stores these
// exact strings and several filters match against it directly.
export const BUSINESS_VENUE_TYPES = [
  "Bar",
  "Bar de copas/Pub",
  "Discoteca/Club nocturno",
  "Restaurante",
  "Chiringuito/Beach club",
  "Terraza-bar",
  "Hotel/Hostal/Resort",
  "Catering",
  "Eventos privados",
  "Cafeteria",
] as const

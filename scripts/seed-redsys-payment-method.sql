-- Seed Redsys as a payment method
-- Run this to add Redsys to the payment_methods table

INSERT INTO payment_methods (
  provider,
  display_name,
  description,
  is_active,
  sort_order,
  config
) VALUES (
  'redsys',
  'Redsys (Tarjeta)',
  'Pago seguro con tarjeta de credito o debito a traves de Redsys, la pasarela de pago de los principales bancos espanoles. Compatible con Visa, Mastercard, y otras tarjetas.',
  true,
  1,
  '{"merchant_code": "086752037", "terminal": "00000003", "commerce_name": "VIDEO AND JOB", "environment": "production", "supported_cards": ["visa", "mastercard", "maestro"]}'::jsonb
) ON CONFLICT (provider) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  config = EXCLUDED.config,
  updated_at = now();

-- Also add Stripe as secondary payment method for international payments
INSERT INTO payment_methods (
  provider,
  display_name,
  description,
  is_active,
  sort_order,
  config
) VALUES (
  'stripe',
  'Stripe (Internacional)',
  'Pagos internacionales con tarjeta de credito, debito, Apple Pay, Google Pay y otros metodos de pago.',
  true,
  2,
  '{"supported_methods": ["card", "apple_pay", "google_pay"], "currencies": ["EUR", "USD", "GBP"]}'::jsonb
) ON CONFLICT (provider) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  config = EXCLUDED.config,
  updated_at = now();

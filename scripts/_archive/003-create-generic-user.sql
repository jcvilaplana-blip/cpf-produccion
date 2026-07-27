DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'user@videonjob.com';
  
  IF existing_user_id IS NULL THEN
    existing_user_id := extensions.uuid_generate_v4();
    
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token
    ) VALUES (
      existing_user_id,
      '00000000-0000-0000-0000-000000000000',
      'user@videonjob.com',
      crypt('VideoNjob2025!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"display_name":"Super Admin VNJ"}',
      now(), now(), 'authenticated', 'authenticated', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      existing_user_id, existing_user_id,
      jsonb_build_object('sub', existing_user_id::text, 'email', 'user@videonjob.com'),
      'email', existing_user_id::text, now(), now(), now()
    );
  END IF;

  INSERT INTO profiles (
    id, display_name, user_type, is_admin, location, bio, job_category, created_at, updated_at
  ) VALUES (
    existing_user_id,
    'Super Admin VNJ',
    'worker',
    true,
    'Madrid',
    'Cuenta de super administrador con acceso completo a VIDEOnJOB.',
    'hosteleria-turismo',
    now(), now()
  ) ON CONFLICT (id) DO UPDATE SET
    is_admin = true,
    display_name = COALESCE(NULLIF(profiles.display_name, ''), 'Super Admin VNJ'),
    updated_at = now();
END $$;

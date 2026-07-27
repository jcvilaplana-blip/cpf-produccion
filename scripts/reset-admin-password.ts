import { createClient } from "@supabase/supabase-js"

// Script para restablecer la contraseña del administrador

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetAdminPassword() {
  const adminEmail = "soporte@camareroporfavor.com"
  const newPassword = process.env.NEW_ADMIN_PASSWORD || ""

  if (!newPassword) {
    console.error("Error: Variable de entorno NEW_ADMIN_PASSWORD requerida")
    process.exit(1)
  }

  console.log(`Buscando usuario con email: ${adminEmail}`)

  // Buscar el usuario por email
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error("Error listando usuarios:", listError.message)
    return
  }

  const adminUser = users.users.find(u => u.email === adminEmail)
  
  if (!adminUser) {
    console.log(`Usuario ${adminEmail} no encontrado. Creando nuevo usuario admin...`)
    
    // Crear el usuario si no existe
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: newPassword,
      email_confirm: true
    })
    
    if (createError) {
      console.error("Error creando usuario:", createError.message)
      return
    }
    
    console.log("Usuario creado con ID:", newUser.user.id)
    
    // Actualizar el perfil para marcarlo como admin
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: newUser.user.id,
        email: adminEmail,
        display_name: "Admin",
        user_type: "admin",
        is_admin: true,
        rol: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error("Error actualizando perfil:", profileError.message)
    } else {
      console.log("Perfil de admin creado correctamente")
    }
    
    return
  }

  console.log(`Usuario encontrado con ID: ${adminUser.id}`)
  console.log(`Actualizando contraseña...`)

  // Actualizar la contraseña
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    adminUser.id,
    { password: newPassword }
  )

  if (updateError) {
    console.error("Error actualizando contraseña:", updateError.message)
    return
  }

  console.log("Contraseña actualizada correctamente!")
  
  // Asegurar que el perfil tenga los permisos de admin
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      is_admin: true,
      rol: 1,
      user_type: "admin",
      updated_at: new Date().toISOString()
    })
    .eq("id", adminUser.id)
  
  if (profileError) {
    console.error("Error actualizando perfil:", profileError.message)
  } else {
    console.log("Permisos de admin verificados")
  }

  console.log(`\n✅ Listo! Puedes iniciar sesión con:`)
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Contraseña: ${newPassword}`)
}

resetAdminPassword()

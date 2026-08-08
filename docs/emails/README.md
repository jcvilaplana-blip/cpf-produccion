# Correos de autenticación

Plantillas de los correos que **compone Supabase** y **entrega Resend**.

Supabase tiene que estar en medio porque el enlace de cada correo lleva un
token firmado con la clave del proyecto: es lo que demuestra que quien pulsa es
el dueño de la dirección, y sólo Supabase puede fabricarlo. Lo que sí se elige
es el transporte, y ahí es donde entra Resend.

## Dónde va cada plantilla

Supabase → **Authentication → Emails**:

| Plantilla de Supabase | Fichero |
|---|---|
| Confirm signup | [verificacion-supabase.html](verificacion-supabase.html) |
| Reset Password | [recuperar-password-supabase.html](recuperar-password-supabase.html) |
| Change Email Address | [cambio-correo-supabase.html](cambio-correo-supabase.html) |

Quedan sin personalizar *Magic Link* e *Invite user*, que esta aplicación no
usa: el registro va por contraseña y las invitaciones son enlaces propios de
CPF, no de Supabase.

## Transporte: Resend

Supabase → **Project Settings → Authentication → SMTP Settings**, con *Enable
Custom SMTP* activado:

| Campo | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` (literalmente esa palabra, no un correo) |
| Password | la API key de Resend, entera, empezando por `re_` |
| Sender email | `noreply@camareroporfavor.com` |
| Sender name | `CamareroPorFavor` |

Configurar SMTP propio además **levanta el límite de envío** de los correos de
autenticación, que con el remitente de Supabase son unos pocos por hora.

**Nada saldrá mientras `camareroporfavor.com` no esté verificado en Resend.**
Es independiente de todo lo anterior: Resend rechaza cualquier envío desde un
dominio sin verificar, venga por API o por SMTP.

## Al migrar de dominio

Las tres plantillas apuntan a `cpf.fullstark.es` en el logo, el icono y los
enlaces del pie. Al pasar a producción hay que sustituirlo por
`camareroporfavor.com` en las tres.

## Por qué son tablas y estilos en línea

Los clientes de correo descartan el CSS externo y buena parte del moderno: ni
flex, ni grid, ni variables, ni degradados. Todo va en tablas anidadas con
`style=` en cada elemento y colores planos. Es feo de leer y es la única forma
de que se vea igual en Gmail, Outlook y Apple Mail.

## Nota sobre `/api/email/verificacion`

Esa ruta existe y **no la llama nadie**. Se escribió para enviar la
verificación por la API de Resend, pero el registro usa
`supabase.auth.signUp()`, así que nunca se ejecuta. Se deja documentado aquí
para que no parezca que hay dos sistemas de verificación compitiendo: sólo hay
uno activo, el de Supabase.

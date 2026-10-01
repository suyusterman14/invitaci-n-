# Invitación Enredados · Confirmación de asistencia
HTML/CSS/JS sin dependencias + 2 funciones serverless (Vercel) + Supabase (guardado) + Resend (correo).

## Configurar
1. **Supabase**: crea proyecto → SQL Editor → pega `supabase.sql` → Settings > API: copia `Project URL` y la clave `service_role`.
2. **Resend** (resend.com): crea API key. Sin dominio propio solo puede enviar al correo con el que te registraste (usando `onboarding@resend.dev`); úsalo como DESTINATION_EMAIL.
3. Copia `.env.example` a `.env` y completa los valores (nunca lo subas a Git).

## Ejecutar local
`npm i -g vercel` → `vercel dev` → abre http://localhost:3000

## Desplegar
`vercel` (o importa el repo en vercel.com) → Settings > Environment Variables: carga las 5 variables → `vercel --prod`. Comparte el enlace.

## Consultar respuestas
Supabase > Table Editor > rsvps, o SQL: `select sum(1+companions) from rsvps where attending;`

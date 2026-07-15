# Almuercito

Ranking de lugares para almorzar hecho por el equipo. Los datos de Google
(rating, dirección, reseñas) se traen automáticamente al agregar un lugar;
la calificación con estrellas de arriba la pone el equipo.

## Puesta en marcha (una sola vez)

1. **Google Places API**
   - Crea/usa un proyecto en [console.cloud.google.com](https://console.cloud.google.com), activa facturación (tiene capa gratuita)
   - Activa **Places API (New)**
   - Crea una API key en Credenciales y restríngela solo a "Places API (New)"

2. **Deploy en Netlify**
   - Add new site → Import an existing project → este repo
   - Deja la configuración por defecto (usa el `netlify.toml` del repo)

3. **Variable de entorno**
   - Site settings → Environment variables → agrega `GOOGLE_PLACES_API_KEY` con la key del paso 1
   - Vuelve a hacer deploy

4. **Base de datos (Supabase)**
   - Copia `supabase/lunch_schema.sql` en el SQL Editor de tu proyecto de Supabase y ejecútalo
   - Es seguro volver a correrlo si lo actualizas más adelante

## Estructura

- `index.html` — toda la app (sin build, un solo archivo)
- `netlify/functions/places.mjs` — función serverless que consulta Google Places con la API key (nunca se expone al navegador)
- `supabase/lunch_schema.sql` — esquema de las tablas `lunch_places` y `lunch_ratings`

// netlify/functions/places.mjs
// Proxy hacia la API de Google Places (New). La API key vive solo en el
// servidor (variable de entorno de Netlify), nunca se expone al navegador.
//
// GET /.netlify/functions/places?action=search&q=texto de búsqueda
// GET /.netlify/functions/places?action=refresh&placeId=ChIJ...

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const SEARCH_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.types",
  "places.googleMapsUri",
].join(",");

const DETAILS_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "rating",
  "userRatingCount",
  "googleMapsUri",
].join(",");

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Convierte los "types" de Google a una etiqueta simple en español.
function guessCuisine(types = []) {
  const map = {
    sushi_restaurant: "Sushi", chinese_restaurant: "Comida china",
    japanese_restaurant: "Comida japonesa", italian_restaurant: "Comida italiana",
    mexican_restaurant: "Comida mexicana", pizza_restaurant: "Pizza",
    vegetarian_restaurant: "Vegetariano", vegan_restaurant: "Vegano",
    seafood_restaurant: "Mariscos", steak_house: "Parrilla",
    sandwich_shop: "Sándwiches", hamburger_restaurant: "Hamburguesas",
    bakery: "Panadería", cafe: "Café", fast_food_restaurant: "Comida rápida",
    ramen_restaurant: "Ramen", korean_restaurant: "Comida coreana",
    peruvian_restaurant: "Comida peruana", chilean_restaurant: "Comida chilena",
  };
  for (const t of types) if (map[t]) return map[t];
  return types.includes("restaurant") ? "Restaurante" : "";
}

function normalizePlace(p) {
  return {
    google_place_id: p.id,
    name: p.displayName?.text || "",
    address: p.formattedAddress || "",
    google_rating: p.rating ?? null,
    google_rating_count: p.userRatingCount ?? null,
    maps_url: p.googleMapsUri || "",
    cuisine: guessCuisine(p.types || []),
  };
}

export default async (req) => {
  if (!API_KEY) {
    return json({ error: "Falta configurar GOOGLE_PLACES_API_KEY en Netlify." }, 500);
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "search") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) return json({ error: "Falta el parámetro q" }, 400);

      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": SEARCH_FIELDS,
        },
        body: JSON.stringify({ textQuery: q, languageCode: "es" }),
      });
      if (!res.ok) return json({ error: "Google Places respondió con error" }, 502);
      const data = await res.json();
      return json({ results: (data.places || []).map(normalizePlace) });
    }

    if (action === "refresh") {
      const placeId = url.searchParams.get("placeId");
      if (!placeId) return json({ error: "Falta el parámetro placeId" }, 400);

      const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: { "X-Goog-Api-Key": API_KEY, "X-Goog-FieldMask": DETAILS_FIELDS },
      });
      if (!res.ok) return json({ error: "Google Places respondió con error" }, 502);
      const data = await res.json();
      return json(normalizePlace(data));
    }

    return json({ error: "Acción no reconocida" }, 400);
  } catch (e) {
    return json({ error: "Error al consultar Google Places" }, 500);
  }
};

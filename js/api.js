const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function fetchJson(url) {
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    const reason = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(`Could not connect to the weather service${reason}`);
  }

  if (!response.ok) {
    throw new Error(`Weather service returned ${response.status} ${response.statusText || "error"}.`);
  }

  try {
    return await response.json();
  } catch (error) {
    const reason = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(`Weather service returned an invalid response${reason}`);
  }
}

export async function searchCity(name) {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(name.trim())}&count=5`;
  let data;

  try {
    data = await fetchJson(url);
  } catch (error) {
    const reason = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(`City search failed${reason}`);
  }

  return (data.results ?? []).map((result) => ({
    name: result.name,
    country: result.country ?? "Unknown country",
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone ?? "UTC"
  }));
}

export async function getForecast(lat, lon) {
  const query = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto"
  });

  return fetchJson(`${FORECAST_URL}?${query.toString()}`);
}

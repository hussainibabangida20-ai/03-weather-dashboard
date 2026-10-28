import { getForecast, searchCity } from "./api.js";
import { renderFavourites, renderWeather, setError, setStatus, setTodayLabel } from "./ui.js";
import { getWeatherCode } from "./weatherCodes.js";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("city-search");
const favouriteCities = ["Tokyo", "New York", "Sydney"];
let favourites = [];
let activeCity = "";
let searchSequence = 0;

async function loadWeather(cityName) {
  let locations;
  try {
    locations = await searchCity(cityName);
  } catch (error) {
    throw error;
  }

  if (locations.length === 0) {
    throw new Error(`We couldn't find "${cityName}". Check the spelling and try another city.`);
  }

  const location = locations[0];
  let forecast;
  try {
    forecast = await getForecast(location.latitude, location.longitude);
  } catch (error) {
    throw error;
  }

  const current = forecast.current;
  const daily = forecast.daily;
  const currentConditions = getWeatherCode(current.weather_code);

  return {
    name: location.name,
    country: location.country,
    temperature: Math.round(current.temperature_2m),
    humidity: current.relative_humidity_2m,
    condition: currentConditions.label,
    icon: currentConditions.emoji,
    windSpeed: Math.round(current.wind_speed_10m),
    note: `Humidity is currently ${current.relative_humidity_2m}%.`,
    localTime: new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: location.timezone
    }).format(new Date()),
    forecast: daily.time.map((date, index) => {
      const conditions = getWeatherCode(daily.weather_code[index]);
      return {
        day: index === 0
          ? "Today"
          : new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" })
            .format(new Date(`${date}T12:00:00Z`)),
        icon: conditions.emoji,
        high: Math.round(daily.temperature_2m_max[index]),
        low: Math.round(daily.temperature_2m_min[index])
      };
    })
  };
}

async function showCity(cityName) {
  const currentSequence = ++searchSequence;
  setError();
  setStatus("Loading…");

  try {
    const weather = await loadWeather(cityName);
    if (currentSequence !== searchSequence) {
      return;
    }

    activeCity = weather.name;
    renderWeather(weather);
    renderFavourites(favourites, activeCity, showCity);
    setStatus();
  } catch (error) {
    if (currentSequence !== searchSequence) {
      return;
    }

    setStatus();
    setError(error instanceof Error ? error.message : "Something went wrong while loading the forecast.");
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const cityName = searchInput.value.trim();

  if (cityName) {
    showCity(cityName);
  }
});

async function startDashboard() {
  setTodayLabel();
  setStatus("Loading…");

  let favouriteResults;
  try {
    favouriteResults = await Promise.all(favouriteCities.map(async (cityName) => {
      try {
        return await loadWeather(cityName);
      } catch (error) {
        console.error(`Could not load ${cityName} for favourites.`, error);
        return null;
      }
    }));
  } catch (error) {
    setStatus();
    setError(error instanceof Error ? error.message : "The favourites could not be loaded.");
    return;
  }

  favourites = favouriteResults.filter((weather) => weather !== null);
  renderFavourites(favourites, activeCity, showCity);

  try {
    await showCity("London");
  } catch (error) {
    setStatus();
    setError(error instanceof Error ? error.message : "The dashboard could not be loaded.");
  }
}

try {
  await startDashboard();
} catch (error) {
  setStatus();
  setError(error instanceof Error ? error.message : "The dashboard could not be loaded.");
}

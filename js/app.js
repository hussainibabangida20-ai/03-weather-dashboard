import { getForecast, searchCity } from "./api.js";
import {
  clearCityResults,
  renderCityResults,
  renderFavourites,
  renderWeather,
  setError,
  setStatus,
  setTodayLabel,
  setUnitButtons
} from "./ui.js";
import { getWeatherCode } from "./weatherCodes.js";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("city-search");
const celsiusButton = document.getElementById("unit-celsius");
const fahrenheitButton = document.getElementById("unit-fahrenheit");
const favouriteCities = ["Tokyo", "New York", "Sydney"];
const unitStorageKey = "weatherly-temperature-unit";
let favourites = [];
let activeWeather = null;
let activeRequestController = null;
let requestSequence = 0;
let temperatureUnit = localStorage.getItem(unitStorageKey) === "F" ? "F" : "C";

function renderDashboard() {
  if (activeWeather) {
    renderWeather(activeWeather, temperatureUnit);
  }

  renderFavourites(favourites, activeWeather?.name ?? "", temperatureUnit, searchCityByName);
}

function beginRequest() {
  activeRequestController?.abort();
  activeRequestController = new AbortController();
  requestSequence += 1;
  return { controller: activeRequestController, sequence: requestSequence };
}

function isCurrentRequest(sequence) {
  return sequence === requestSequence;
}

async function loadWeather(location, signal) {
  let forecast;
  try {
    forecast = await getForecast(location.latitude, location.longitude, { signal });
  } catch (error) {
    throw error;
  }

  const current = forecast.current;
  const daily = forecast.daily;
  const currentConditions = getWeatherCode(current.weather_code);
  const weekdayFormatter = new Intl.DateTimeFormat("en", {
    weekday: "short",
    timeZone: "UTC"
  });

  return {
    name: location.name,
    country: location.country,
    temperature: current.temperature_2m,
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
        day: weekdayFormatter.format(new Date(`${date}T12:00:00Z`)),
        icon: conditions.emoji,
        high: daily.temperature_2m_max[index],
        low: daily.temperature_2m_min[index]
      };
    })
  };
}

async function showLocation(location, controller, sequence) {
  clearCityResults();
  setError();
  setStatus("Loading…");

  try {
    const weather = await loadWeather(location, controller.signal);
    if (!isCurrentRequest(sequence)) {
      return;
    }

    activeWeather = weather;
    renderDashboard();
    setStatus();
  } catch (error) {
    if (!isCurrentRequest(sequence) || controller.signal.aborted) {
      return;
    }

    setStatus();
    setError(error instanceof Error ? error.message : "Something went wrong while loading the forecast.");
  }
}

async function selectLocation(location) {
  const { controller, sequence } = beginRequest();
  await showLocation(location, controller, sequence);
}

async function searchCityByName(cityName) {
  const { controller, sequence } = beginRequest();
  clearCityResults();
  setError();
  setStatus("Loading…");

  let locations;
  try {
    locations = await searchCity(cityName, { signal: controller.signal });
  } catch (error) {
    if (!isCurrentRequest(sequence) || controller.signal.aborted) {
      return;
    }

    setStatus();
    setError(error instanceof Error ? error.message : "City search failed. Please try again.");
    return;
  }

  if (!isCurrentRequest(sequence)) {
    return;
  }

  if (locations.length === 0) {
    setStatus();
    setError(`We couldn't find "${cityName}". Check the spelling and try another city.`);
    return;
  }

  if (locations.length > 1) {
    renderCityResults(locations, selectLocation);
    setStatus("Choose a location from the list.");
    return;
  }

  await showLocation(locations[0], controller, sequence);
}

async function loadFavourite(locationName) {
  let locations;
  try {
    locations = await searchCity(locationName);
  } catch (error) {
    throw error;
  }

  if (locations.length === 0) {
    throw new Error(`Could not find favourite city "${locationName}".`);
  }

  let weather;
  try {
    weather = await loadWeather(locations[0]);
  } catch (error) {
    throw error;
  }

  return weather;
}

async function loadFavourites() {
  const results = await Promise.all(favouriteCities.map(async (cityName) => {
    try {
      return await loadFavourite(cityName);
    } catch (error) {
      console.error(`Could not load ${cityName} for favourites.`, error);
      return null;
    }
  }));
  return results.filter((weather) => weather !== null);
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const cityName = searchInput.value.trim();

  if (cityName) {
    void searchCityByName(cityName);
  }
});

celsiusButton.addEventListener("click", () => {
  temperatureUnit = "C";
  localStorage.setItem(unitStorageKey, temperatureUnit);
  setUnitButtons(temperatureUnit);
  renderDashboard();
});

fahrenheitButton.addEventListener("click", () => {
  temperatureUnit = "F";
  localStorage.setItem(unitStorageKey, temperatureUnit);
  setUnitButtons(temperatureUnit);
  renderDashboard();
});

async function startDashboard() {
  setTodayLabel();
  setUnitButtons(temperatureUnit);
  setStatus("Loading…");

  const favouritesPromise = loadFavourites();
  try {
    await searchCityByName("London");
  } catch (error) {
    setStatus();
    setError(error instanceof Error ? error.message : "The dashboard could not be loaded.");
  }

  try {
    favourites = await favouritesPromise;
    renderDashboard();
  } catch (error) {
    console.error("Could not load favourites.", error);
    setError("Favourite cities could not be loaded.");
  }
}

try {
  await startDashboard();
} catch (error) {
  setStatus();
  setError(error instanceof Error ? error.message : "The dashboard could not be loaded.");
}

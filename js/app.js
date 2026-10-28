import { getForecast, searchCity } from "./api.js";
import {
  clearCityResults,
  getLocationKey,
  renderCityResults,
  renderFavourites,
  renderWeather,
  setError,
  setFavouriteButton,
  setLoading,
  setStatus,
  setTodayLabel,
  setUnitButtons
} from "./ui.js";
import { getWeatherCode } from "./weatherCodes.js";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("city-search");
const celsiusButton = document.getElementById("unit-celsius");
const fahrenheitButton = document.getElementById("unit-fahrenheit");
const favouriteToggle = document.getElementById("favourite-toggle");
const locationButton = document.getElementById("location-button");
const favouritesStorageKey = "weatherly-favourites";
const lastLocationStorageKey = "weatherly-last-location";
const unitStorageKey = "weatherly-temperature-unit";
let favourites = readFavourites();
let favouriteWeather = new Map();
let activeWeather = null;
let activeLocation = null;
let activeRequestController = null;
let requestSequence = 0;
let temperatureUnit = localStorage.getItem(unitStorageKey) === "F" ? "F" : "C";

function readFavourites() {
  try {
    const saved = JSON.parse(localStorage.getItem(favouritesStorageKey) ?? "[]");
    if (!Array.isArray(saved)) {
      throw new Error("Saved favourites must be an array.");
    }

    return saved.filter((location) =>
      location &&
      typeof location.name === "string" &&
      typeof location.country === "string" &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude)
    ).map(({ name, country, latitude, longitude }) => ({
      name,
      country,
      latitude: Number(latitude),
      longitude: Number(longitude)
    }));
  } catch (error) {
    console.error("Could not read saved favourites.", error);
    return [];
  }
}

function readLastLocation() {
  try {
    const saved = JSON.parse(localStorage.getItem(lastLocationStorageKey) ?? "null");
    if (
      !saved ||
      typeof saved.name !== "string" ||
      typeof saved.country !== "string" ||
      !Number.isFinite(saved.latitude) ||
      !Number.isFinite(saved.longitude)
    ) {
      return null;
    }

    return {
      name: saved.name,
      country: saved.country,
      latitude: saved.latitude,
      longitude: saved.longitude
    };
  } catch (error) {
    console.error("Could not read the last viewed location.", error);
    return null;
  }
}

function renderFavouriteList() {
  renderFavourites(
    favourites,
    favouriteWeather,
    activeLocation,
    temperatureUnit,
    selectFavourite
  );
}

function renderDashboard() {
  if (activeWeather) {
    renderWeather(activeWeather, temperatureUnit);
  }

  const isFavourite = activeLocation
    ? favourites.some((location) => getLocationKey(location) === getLocationKey(activeLocation))
    : false;
  setFavouriteButton(isFavourite, Boolean(activeWeather));
  renderFavouriteList();
}

function stopLoading() {
  setLoading(false);
  if (activeWeather) {
    renderDashboard();
  }
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
  const resolvedLocation = {
    name: location.name,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude
  };

  return {
    location: resolvedLocation,
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
      timeZone: forecast.timezone || location.timezone || "UTC"
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
  setLoading(true);

  try {
    const weather = await loadWeather(location, controller.signal);
    if (!isCurrentRequest(sequence)) {
      return;
    }

    activeWeather = weather;
    activeLocation = weather.location;
    renderDashboard();
    setLoading(false);

    try {
      localStorage.setItem(lastLocationStorageKey, JSON.stringify(activeLocation));
    } catch (error) {
      setError("Weather loaded, but the last viewed city could not be saved.");
      console.error("Could not save the last viewed location.", error);
    }
  } catch (error) {
    if (!isCurrentRequest(sequence) || controller.signal.aborted) {
      return;
    }

    stopLoading();
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
  setLoading(true);

  let locations;
  try {
    locations = await searchCity(cityName, { signal: controller.signal });
  } catch (error) {
    if (!isCurrentRequest(sequence) || controller.signal.aborted) {
      return;
    }

    stopLoading();
    setError(error instanceof Error ? error.message : "City search failed. Please try again.");
    return;
  }

  if (!isCurrentRequest(sequence)) {
    return;
  }

  if (locations.length === 0) {
    stopLoading();
    setError(`We couldn't find "${cityName}". Check the spelling and try another city.`);
    return;
  }

  if (locations.length > 1) {
    stopLoading();
    renderCityResults(locations, selectLocation);
    setStatus("Choose a location from the list.");
    return;
  }

  await showLocation(locations[0], controller, sequence);
}

async function selectFavourite(location) {
  await selectLocation(location);
}

function toggleFavourite() {
  if (!activeLocation || !activeWeather) {
    return;
  }

  const locationKey = getLocationKey(activeLocation);
  const existingIndex = favourites.findIndex(
    (location) => getLocationKey(location) === locationKey
  );

  if (existingIndex >= 0) {
    favourites.splice(existingIndex, 1);
    favouriteWeather.delete(locationKey);
  } else {
    const favourite = {
      name: activeLocation.name,
      country: activeLocation.country,
      latitude: activeLocation.latitude,
      longitude: activeLocation.longitude
    };
    favourites.push(favourite);
    favouriteWeather.set(locationKey, activeWeather);
  }

  try {
    localStorage.setItem(favouritesStorageKey, JSON.stringify(favourites));
  } catch (error) {
    setError("Could not save your favourites. Check your browser storage settings.");
    console.error("Could not save favourites.", error);
    favourites = readFavourites();
    renderDashboard();
    return;
  }

  renderDashboard();
}

function getGeolocationError(error) {
  if (error.code === 1) {
    return new Error("Location permission was denied. Allow location access in your browser settings, then try again.");
  }
  if (error.code === 2) {
    return new Error("Your location is unavailable right now. Check your device location settings and try again.");
  }
  if (error.code === 3) {
    return new Error("Finding your location took too long. Please try again.");
  }

  return new Error("Your location could not be determined. Please try again.");
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported by this browser. You can still search for a city."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 60000
    });
  });
}

async function useCurrentLocation() {
  const { controller, sequence } = beginRequest();
  clearCityResults();
  setError();
  setLoading(true);

  try {
    let position;
    try {
      position = await getCurrentPosition();
    } catch (error) {
      throw error?.code ? getGeolocationError(error) : error;
    }

    if (!isCurrentRequest(sequence)) {
      return;
    }

    await showLocation({
      name: "Your location",
      country: "Current location",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timezone: "auto"
    }, controller, sequence);
  } catch (error) {
    if (!isCurrentRequest(sequence) || controller.signal.aborted) {
      return;
    }

    stopLoading();
    setError(error instanceof Error ? error.message : "Your location could not be determined.");
  }
}

async function loadFavouriteWeather(location) {
  try {
    const weather = await loadWeather(location);
    favouriteWeather.set(getLocationKey(location), weather);
  } catch (error) {
    console.error(`Could not load forecast for favourite "${location.name}".`, error);
  }
}

async function loadDefaultCity() {
  const { controller, sequence } = beginRequest();
  setLoading(true);

  let locations;
  try {
    locations = await searchCity("London", { signal: controller.signal });
  } catch (error) {
    stopLoading();
    setError(error instanceof Error ? error.message : "Could not load the default city.");
    return;
  }

  if (!isCurrentRequest(sequence)) {
    return;
  }

  const location = locations.find((result) =>
    result.name === "London" && result.country === "United Kingdom"
  ) ?? locations[0];

  if (!location) {
    stopLoading();
    setError("Could not find the default city. Search for a city to get started.");
    return;
  }

  await showLocation(location, controller, sequence);
}

async function locationPermissionGranted() {
  if (!navigator.permissions?.query) {
    return false;
  }

  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    return permission.state === "granted";
  } catch (error) {
    console.warn("Could not check geolocation permission; using the last viewed city instead.", error);
    return false;
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const cityName = searchInput.value.trim();

  if (cityName) {
    void searchCityByName(cityName);
  }
});

locationButton.addEventListener("click", () => {
  void useCurrentLocation();
});

favouriteToggle.addEventListener("click", toggleFavourite);

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
  renderFavouriteList();
  setLoading(true);

  for (const location of favourites) {
    void loadFavouriteWeather(location).then(() => renderFavouriteList());
  }

  const lastLocation = readLastLocation();
  if (lastLocation) {
    await selectLocation(lastLocation);
    return;
  }

  if (await locationPermissionGranted()) {
    await useCurrentLocation();
    if (activeWeather) {
      return;
    }
  }

  await loadDefaultCity();
}

try {
  await startDashboard();
} catch (error) {
  stopLoading();
  setError(error instanceof Error ? error.message : "The dashboard could not be loaded.");
}

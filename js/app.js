import { getFavourites, getWeather } from "./api.js";
import { renderFavourites, renderWeather, setError, setStatus, setTodayLabel } from "./ui.js";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("city-search");
let favourites = [];
let activeCity = "";

async function showCity(cityName) {
  setError();
  setStatus("Finding your forecast...");

  try {
    const weather = await getWeather(cityName);
    activeCity = weather.name;
    renderWeather(weather);
    renderFavourites(favourites, activeCity, showCity);
    setStatus();
  } catch (error) {
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

  try {
    favourites = await getFavourites();
    await showCity("London");
  } catch (error) {
    setStatus();
    setError(error instanceof Error ? error.message : "The dashboard could not be loaded.");
  }
}

startDashboard();

function byId(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Required page element "#${id}" was not found.`);
  }

  return element;
}

function createElement(tagName, className, text = "") {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function formatTemperature(celsius, unit) {
  return `${convertTemperature(celsius, unit)}°${unit}`;
}

function convertTemperature(celsius, unit) {
  const temperature = unit === "F"
    ? (celsius * 9) / 5 + 32
    : celsius;

  return Math.round(temperature);
}

function createForecastCard(day, unit) {
  const card = createElement("article", "forecast-card");
  card.append(
    createElement("span", "forecast-day", day.day),
    createElement("span", "forecast-icon", day.icon)
  );
  card.lastElementChild.setAttribute("aria-hidden", "true");

  const temperatures = createElement("span", "forecast-temperatures");
  temperatures.append(
    createElement("span", "forecast-high", formatTemperature(day.high, unit)),
    createElement("span", "forecast-low", formatTemperature(day.low, unit))
  );
  temperatures.lastElementChild.classList.add("forecast-low");
  card.append(temperatures);
  return card;
}

export function renderWeather(weather, unit) {
  byId("city-name").textContent = weather.name;
  byId("country-name").textContent = weather.country;
  byId("temperature").textContent = convertTemperature(weather.temperature, unit);
  byId("temperature-unit").textContent = `°${unit}`;
  byId("condition").textContent = weather.condition;
  byId("condition-icon").textContent = weather.icon;
  byId("wind-speed").textContent = `${weather.windSpeed} km/h`;
  byId("humidity").textContent = `${weather.humidity}%`;
  byId("local-time").textContent = weather.localTime;
  byId("weather-note").textContent = weather.note;

  const forecast = byId("forecast-list");
  forecast.replaceChildren(...weather.forecast.map((day) => createForecastCard(day, unit)));
}

export function renderFavourites(favourites, activeCity, unit, onSelect) {
  const list = byId("favourites-list");
  const fragment = document.createDocumentFragment();

  favourites.forEach((weather) => {
    const item = document.createElement("li");
    const button = createElement("button", "favourite-button");
    button.type = "button";
    button.setAttribute("aria-current", String(weather.name === activeCity));
    button.setAttribute("aria-label", `${weather.name}, ${formatTemperature(weather.temperature, unit)}, ${weather.condition}`);

    const emoji = createElement("span", "favourite-emoji", weather.icon);
    emoji.setAttribute("aria-hidden", "true");
    const city = createElement("span", "favourite-city");
    city.append(
      createElement("strong", "", weather.name),
      createElement("span", "", weather.condition)
    );
    button.append(
      emoji,
      city,
      createElement("span", "favourite-temperature", formatTemperature(weather.temperature, unit))
    );
    button.addEventListener("click", () => onSelect(weather.name));
    item.append(button);
    fragment.append(item);
  });

  list.replaceChildren(fragment);
  byId("favourite-count").textContent = favourites.length;
}

export function renderCityResults(locations, onSelect) {
  const list = byId("city-results");
  const fragment = document.createDocumentFragment();

  locations.forEach((location) => {
    const item = document.createElement("li");
    const option = createElement("button", "city-result");
    option.type = "button";
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.textContent = [location.name, location.region, location.country]
      .filter(Boolean)
      .join(", ");
    option.addEventListener("click", () => onSelect(location));
    item.append(option);
    fragment.append(item);
  });

  list.replaceChildren(fragment);
  list.hidden = locations.length === 0;
  byId("city-search").setAttribute("aria-expanded", String(locations.length > 0));
}

export function clearCityResults() {
  const list = byId("city-results");
  list.replaceChildren();
  list.hidden = true;
  byId("city-search").setAttribute("aria-expanded", "false");
}

export function setUnitButtons(unit) {
  byId("unit-celsius").setAttribute("aria-pressed", String(unit === "C"));
  byId("unit-fahrenheit").setAttribute("aria-pressed", String(unit === "F"));
  byId("temperature-unit").textContent = `°${unit}`;
}

export function setStatus(message = "") {
  const status = byId("status-message");
  status.textContent = message;
  status.hidden = !message;
}

export function setError(message = "") {
  const error = byId("error-message");
  error.textContent = message;
  error.hidden = !message;
}

export function setTodayLabel(date = new Date()) {
  byId("today-label").textContent = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(date);
}

function byId(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Required page element "#${id}" was not found.`);
  }

  return element;
}

function createForecastCard(day) {
  const card = document.createElement("article");
  card.className = "forecast-card";
  card.innerHTML = `
    <span class="forecast-day"></span>
    <span class="forecast-icon" aria-hidden="true"></span>
    <span class="forecast-temperatures">
      <span class="forecast-high"></span>
      <span class="forecast-low"></span>
    </span>
  `;
  card.querySelector(".forecast-day").textContent = day.day;
  card.querySelector(".forecast-icon").textContent = day.icon;
  card.querySelector(".forecast-high").textContent = `${day.high}°`;
  card.querySelector(".forecast-low").textContent = `${day.low}°`;
  return card;
}

export function renderWeather(weather) {
  byId("city-name").textContent = weather.name;
  byId("country-name").textContent = weather.country;
  byId("temperature").textContent = weather.temperature;
  byId("condition").textContent = weather.condition;
  byId("condition-icon").textContent = weather.icon;
  byId("wind-speed").textContent = `${weather.windSpeed} km/h`;
  byId("local-time").textContent = weather.localTime;
  byId("weather-note").textContent = weather.note;

  const forecast = byId("forecast-list");
  forecast.replaceChildren(...weather.forecast.map(createForecastCard));
}

export function renderFavourites(favourites, activeCity, onSelect) {
  const list = byId("favourites-list");
  const fragment = document.createDocumentFragment();

  favourites.forEach((weather) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.className = "favourite-button";
    button.type = "button";
    button.setAttribute("aria-current", String(weather.name === activeCity));
    button.setAttribute("aria-label", `${weather.name}, ${weather.temperature} degrees, ${weather.condition}`);
    button.innerHTML = `
      <span class="favourite-emoji" aria-hidden="true"></span>
      <span class="favourite-city">
        <strong></strong>
        <span></span>
      </span>
      <span class="favourite-temperature"></span>
    `;
    button.querySelector(".favourite-emoji").textContent = weather.icon;
    button.querySelector(".favourite-city strong").textContent = weather.name;
    button.querySelector(".favourite-city span").textContent = weather.condition;
    button.querySelector(".favourite-temperature").textContent = `${weather.temperature}°`;
    button.addEventListener("click", () => onSelect(weather.name));
    item.append(button);
    fragment.append(item);
  });

  list.replaceChildren(fragment);
  byId("favourite-count").textContent = favourites.length;
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

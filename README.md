# Weatherly

A responsive weather dashboard built with plain HTML, CSS, and JavaScript ES modules. It uses live weather data from Open-Meteo and needs no API key.

## Features

- Search for a city and choose the correct region when the search has multiple matches.
- View current temperature, weather conditions, humidity, wind, local time, and a seven-day forecast.
- Switch between Celsius and Fahrenheit; the selection is remembered in `localStorage`.
- Save and remove favourite locations with the ☆ button. Favourites and the last viewed location are stored in `localStorage`.
- Load nearby weather with **Use my location**. Location access requires browser permission and a secure context, such as HTTPS or `localhost`.
- See skeleton placeholders while weather data is loading.
- Responsive glass-style layout with accessible status messages and reduced-motion support.

## APIs

- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) finds city names and coordinates.
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs) provides current conditions and daily forecast data.
- Browser Geolocation API provides coordinates only after the user grants permission.

Open-Meteo does not require an API key for this project.

## Run locally

Open the project through a local development server (for example, VS Code Live Server). A local server is recommended because browsers restrict geolocation on pages opened directly from disk.

## Screenshots

Add a dashboard screenshot at `screenshots/dashboard.png`.

![Weatherly dashboard screenshot placeholder](screenshots/dashboard.png)

## What I learned

- How to chain asynchronous geocoding and forecast requests with `async`/`await`.
- How to pass an `AbortSignal` to fetch requests to cancel stale searches.
- How to request browser location permission and handle denial, unavailable positions, and timeouts.
- How to persist small user preferences and saved locations with `localStorage`.
- How to build UI from API data with DOM elements and `textContent` instead of interpreting that data as HTML.
- How to convert temperatures on the client and format dates with `Intl.DateTimeFormat`.

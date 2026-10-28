const cities = {
  london: {
    name: "London",
    country: "United Kingdom",
    timeZone: "Europe/London",
    temperature: 18,
    condition: "Partly cloudy",
    icon: "🌤️",
    windSpeed: 12,
    note: "A little sun between the clouds.",
    forecast: [
      { day: "Today", icon: "🌤️", high: 19, low: 12 },
      { day: "Tue", icon: "☀️", high: 21, low: 13 },
      { day: "Wed", icon: "🌦️", high: 17, low: 11 },
      { day: "Thu", icon: "🌧️", high: 15, low: 10 },
      { day: "Fri", icon: "⛅", high: 18, low: 12 },
      { day: "Sat", icon: "☀️", high: 22, low: 14 },
      { day: "Sun", icon: "🌤️", high: 20, low: 13 }
    ]
  },
  tokyo: {
    name: "Tokyo",
    country: "Japan",
    timeZone: "Asia/Tokyo",
    temperature: 24,
    condition: "Sunny",
    icon: "☀️",
    windSpeed: 8,
    note: "Clear skies and a lovely afternoon.",
    forecast: [
      { day: "Today", icon: "☀️", high: 26, low: 18 },
      { day: "Tue", icon: "🌤️", high: 25, low: 19 },
      { day: "Wed", icon: "⛅", high: 23, low: 18 },
      { day: "Thu", icon: "🌧️", high: 20, low: 17 },
      { day: "Fri", icon: "🌦️", high: 22, low: 17 },
      { day: "Sat", icon: "☀️", high: 27, low: 19 },
      { day: "Sun", icon: "☀️", high: 28, low: 20 }
    ]
  },
  "new york": {
    name: "New York",
    country: "United States",
    timeZone: "America/New_York",
    temperature: 16,
    condition: "Light showers",
    icon: "🌦️",
    windSpeed: 16,
    note: "A passing shower, then brighter skies.",
    forecast: [
      { day: "Today", icon: "🌦️", high: 18, low: 12 },
      { day: "Tue", icon: "☁️", high: 17, low: 11 },
      { day: "Wed", icon: "🌤️", high: 20, low: 13 },
      { day: "Thu", icon: "☀️", high: 23, low: 15 },
      { day: "Fri", icon: "⛅", high: 21, low: 14 },
      { day: "Sat", icon: "🌧️", high: 18, low: 12 },
      { day: "Sun", icon: "🌤️", high: 20, low: 13 }
    ]
  },
  sydney: {
    name: "Sydney",
    country: "Australia",
    timeZone: "Australia/Sydney",
    temperature: 22,
    condition: "Mostly sunny",
    icon: "🌤️",
    windSpeed: 11,
    note: "Sunshine to make the most of the day.",
    forecast: [
      { day: "Today", icon: "🌤️", high: 24, low: 17 },
      { day: "Tue", icon: "☀️", high: 25, low: 18 },
      { day: "Wed", icon: "☀️", high: 26, low: 18 },
      { day: "Thu", icon: "⛅", high: 23, low: 17 },
      { day: "Fri", icon: "🌦️", high: 21, low: 16 },
      { day: "Sat", icon: "🌤️", high: 22, low: 16 },
      { day: "Sun", icon: "☀️", high: 25, low: 18 }
    ]
  },
  reykjavik: {
    name: "Reykjavik",
    country: "Iceland",
    timeZone: "Atlantic/Reykjavik",
    temperature: 9,
    condition: "Cloudy",
    icon: "☁️",
    windSpeed: 19,
    note: "Breezy outside; a warm layer might help.",
    forecast: [
      { day: "Today", icon: "☁️", high: 10, low: 6 },
      { day: "Tue", icon: "🌦️", high: 9, low: 5 },
      { day: "Wed", icon: "🌧️", high: 8, low: 4 },
      { day: "Thu", icon: "☁️", high: 9, low: 5 },
      { day: "Fri", icon: "🌤️", high: 11, low: 6 },
      { day: "Sat", icon: "⛅", high: 10, low: 6 },
      { day: "Sun", icon: "🌦️", high: 8, low: 4 }
    ]
  }
};

const favourites = ["Tokyo", "New York", "Sydney"];

function getLocalTime(timeZone) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone
  }).format(new Date());
}

export async function getWeather(cityName) {
  const city = cities[cityName.trim().toLocaleLowerCase()];

  if (!city) {
    throw new Error(`No placeholder forecast is available for "${cityName.trim()}". Try London, Tokyo, New York, Sydney, or Reykjavik.`);
  }

  return {
    ...city,
    forecast: city.forecast.map((day) => ({ ...day })),
    localTime: getLocalTime(city.timeZone)
  };
}

export async function getFavourites() {
  return Promise.all(favourites.map((city) => getWeather(city)));
}

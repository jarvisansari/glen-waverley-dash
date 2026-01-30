# Glen Waverley Live Dashboard

A real-time data dashboard for Glen Waverley, VIC 3150, Australia.

![Dashboard Preview](screenshot.png)

## Features

- **Live Local Time** - Accurate Melbourne timezone clock
- **Current Weather** - Temperature, feels like, humidity, wind speed
- **3-Day Forecast** - Daily high/low temperatures with conditions
- **Air Quality Index** - Real-time AQI with PM2.5 and PM10 readings
- **UV Index** - Current UV levels with safety status
- **Sunrise/Sunset** - Daily sun times
- **Area Statistics** - Population, distance from CBD, council info
- **Public Transport** - Train station details
- **Local Facts** - Rotating interesting facts about Glen Waverley

## APIs Used

- [Open-Meteo Weather API](https://open-meteo.com/) - Free weather data
- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) - Free AQI data

## Tech Stack

- Pure HTML5, CSS3, JavaScript
- No dependencies or build tools required
- Responsive design for all screen sizes

## Running Locally

Simply open `index.html` in a web browser, or serve with any static file server:

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve

# PHP
php -S localhost:8080
```

## Author

Built by Jarvis 🤖

## License

MIT

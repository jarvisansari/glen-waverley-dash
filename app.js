// Glen Waverley coordinates
const LAT = -37.8781;
const LON = 145.1614;
const TIMEZONE = 'Australia/Melbourne';

// Weather code to emoji mapping
const weatherIcons = {
    0: '☀️',   // Clear
    1: '🌤️',   // Mainly clear
    2: '⛅',   // Partly cloudy
    3: '☁️',   // Overcast
    45: '🌫️',  // Fog
    48: '🌫️',  // Depositing rime fog
    51: '🌦️',  // Light drizzle
    53: '🌧️',  // Moderate drizzle
    55: '🌧️',  // Dense drizzle
    61: '🌧️',  // Slight rain
    63: '🌧️',  // Moderate rain
    65: '🌧️',  // Heavy rain
    71: '🌨️',  // Slight snow
    73: '🌨️',  // Moderate snow
    75: '🌨️',  // Heavy snow
    77: '🌨️',  // Snow grains
    80: '🌦️',  // Slight showers
    81: '🌧️',  // Moderate showers
    82: '🌧️',  // Violent showers
    95: '⛈️',  // Thunderstorm
    96: '⛈️',  // Thunderstorm with hail
    99: '⛈️',  // Thunderstorm with heavy hail
};

// Glen Waverley facts
const facts = [
    "The Glen shopping centre is one of Melbourne's largest suburban malls with over 200 stores.",
    "Glen Waverley has a significant Asian population, making it a hub for authentic Asian cuisine.",
    "The Glen Waverley line opened in 1930 and is one of Melbourne's busiest suburban routes.",
    "Glen Waverley Secondary College is one of Victoria's top public schools.",
    "The area was named after the Waverley novels by Sir Walter Scott.",
    "Kingsway, the main street, hosts many restaurants and cafes popular for dining.",
    "Glen Waverley is home to the Syndal Tech School, one of Melbourne's original tech schools.",
    "The suburb has multiple parks including Valley Reserve and Bogong Reserve.",
    "Glen Waverley station handles over 10,000 passengers daily on average.",
    "The area code 3150 covers Glen Waverley and parts of surrounding suburbs.",
];

// Update time display
function updateTime() {
    const now = new Date();
    const timeOptions = { 
        timeZone: TIMEZONE, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    };
    const dateOptions = { 
        timeZone: TIMEZONE, 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    
    document.getElementById('time').textContent = now.toLocaleTimeString('en-AU', timeOptions);
    document.getElementById('date').textContent = now.toLocaleDateString('en-AU', dateOptions);
}

// Get UV status text
function getUVStatus(uv) {
    if (uv <= 2) return 'Low';
    if (uv <= 5) return 'Moderate';
    if (uv <= 7) return 'High';
    if (uv <= 10) return 'Very High';
    return 'Extreme';
}

// Get AQI status
function getAQIStatus(aqi) {
    if (aqi <= 50) return { text: 'Good', class: 'good' };
    if (aqi <= 100) return { text: 'Moderate', class: 'moderate' };
    if (aqi <= 150) return { text: 'Unhealthy (Sensitive)', class: 'poor' };
    if (aqi <= 200) return { text: 'Unhealthy', class: 'poor' };
    return { text: 'Hazardous', class: 'hazardous' };
}

// Format time from ISO string
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-AU', { 
        timeZone: TIMEZONE,
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

// Get day name
function getDayName(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-AU', { 
        timeZone: TIMEZONE,
        weekday: 'short' 
    });
}

// Fetch weather data from Open-Meteo
async function fetchWeather() {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=${TIMEZONE}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Current weather
        const current = data.current;
        document.getElementById('temp').textContent = `${Math.round(current.temperature_2m)}°`;
        document.getElementById('feels-like').textContent = `${Math.round(current.apparent_temperature)}°`;
        document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
        document.getElementById('wind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
        document.getElementById('weather-icon').textContent = weatherIcons[current.weather_code] || '🌡️';
        
        // Sun times
        const daily = data.daily;
        document.getElementById('sunrise').textContent = formatTime(daily.sunrise[0]);
        document.getElementById('sunset').textContent = formatTime(daily.sunset[0]);
        
        // UV Index
        const uvIndex = daily.uv_index_max[0];
        document.getElementById('uv').textContent = uvIndex.toFixed(1);
        document.getElementById('uv-status').textContent = getUVStatus(uvIndex);
        
        // Forecast
        const forecastHTML = [];
        for (let i = 0; i < 3; i++) {
            forecastHTML.push(`
                <div class="forecast-day">
                    <span class="forecast-date">${getDayName(daily.time[i])}</span>
                    <span class="forecast-icon">${weatherIcons[daily.weather_code[i]] || '🌡️'}</span>
                    <span class="forecast-temp">${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</span>
                </div>
            `);
        }
        document.getElementById('forecast').innerHTML = forecastHTML.join('');
        
    } catch (error) {
        console.error('Weather fetch error:', error);
    }
}

// Fetch air quality data from Open-Meteo
async function fetchAirQuality() {
    try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}&current=pm10,pm2_5,us_aqi&timezone=${TIMEZONE}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const current = data.current;
        const aqi = current.us_aqi;
        const status = getAQIStatus(aqi);
        
        document.getElementById('aqi').textContent = aqi;
        const statusEl = document.getElementById('aqi-status');
        statusEl.textContent = status.text;
        statusEl.className = `aqi-status ${status.class}`;
        
        document.getElementById('pm25').textContent = `${current.pm2_5.toFixed(1)} µg/m³`;
        document.getElementById('pm10').textContent = `${current.pm10.toFixed(1)} µg/m³`;
        
    } catch (error) {
        console.error('Air quality fetch error:', error);
    }
}

// Update random fact
function updateFact() {
    const fact = facts[Math.floor(Math.random() * facts.length)];
    document.getElementById('fact').textContent = fact;
}

// Update last updated timestamp
function updateTimestamp() {
    const now = new Date();
    document.getElementById('last-update').textContent = now.toLocaleTimeString('en-AU', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// Initialize
async function init() {
    updateTime();
    await Promise.all([
        fetchWeather(),
        fetchAirQuality()
    ]);
    updateFact();
    updateTimestamp();
    
    // Update time every second
    setInterval(updateTime, 1000);
    
    // Refresh data every 5 minutes
    setInterval(async () => {
        await Promise.all([
            fetchWeather(),
            fetchAirQuality()
        ]);
        updateTimestamp();
    }, 5 * 60 * 1000);
    
    // Change fact every 30 seconds
    setInterval(updateFact, 30000);
}

// Start
init();

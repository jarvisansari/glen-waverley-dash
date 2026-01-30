// State
let currentLocation = null;
let recentLocations = [];

// Default location (Glen Waverley)
const DEFAULT_LOCATION = {
    name: 'Glen Waverley',
    admin1: 'Victoria',
    country: 'Australia',
    latitude: -37.8781,
    longitude: 145.1614,
    timezone: 'Australia/Melbourne',
    elevation: 112,
    postcode: '3150'
};

// Weather code to emoji mapping
const weatherIcons = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌧️', 55: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
    80: '🌦️', 81: '🌧️', 82: '🌧️',
    95: '⛈️', 96: '⛈️', 99: '⛈️',
};

// State abbreviations
const stateAbbrev = {
    'Victoria': 'VIC',
    'New South Wales': 'NSW',
    'Queensland': 'QLD',
    'Western Australia': 'WA',
    'South Australia': 'SA',
    'Tasmania': 'TAS',
    'Northern Territory': 'NT',
    'Australian Capital Territory': 'ACT'
};

// Initialize
function init() {
    loadRecentLocations();
    
    // Check for saved location or use default
    const saved = localStorage.getItem('currentLocation');
    if (saved) {
        currentLocation = JSON.parse(saved);
    } else {
        currentLocation = DEFAULT_LOCATION;
    }
    
    setLocation(currentLocation);
    setupSearch();
    
    // Update time every second
    setInterval(updateTime, 1000);
    
    // Refresh data every 5 minutes
    setInterval(() => fetchAllData(), 5 * 60 * 1000);
}

// Setup search functionality
function setupSearch() {
    const input = document.getElementById('location-input');
    const btn = document.getElementById('search-btn');
    const results = document.getElementById('search-results');
    
    let debounceTimer;
    
    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = input.value.trim();
        
        if (query.length < 2) {
            results.classList.remove('active');
            return;
        }
        
        debounceTimer = setTimeout(() => searchLocations(query), 300);
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = input.value.trim();
            if (query.length >= 2) {
                searchLocations(query);
            }
        }
    });
    
    btn.addEventListener('click', () => {
        const query = input.value.trim();
        if (query.length >= 2) {
            searchLocations(query);
        }
    });
    
    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.location-search')) {
            results.classList.remove('active');
        }
    });
}

// Search locations using Open-Meteo Geocoding API
async function searchLocations(query) {
    const results = document.getElementById('search-results');
    results.innerHTML = '<div class="search-loading">Searching...</div>';
    results.classList.add('active');
    
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            results.innerHTML = '<div class="search-empty">No locations found</div>';
            return;
        }
        
        // Filter to Australia only
        const australianResults = data.results.filter(r => r.country === 'Australia');
        
        if (australianResults.length === 0) {
            results.innerHTML = '<div class="search-empty">No Australian locations found</div>';
            return;
        }
        
        results.innerHTML = australianResults.map(loc => `
            <div class="search-result" data-location='${JSON.stringify(loc)}'>
                <div class="search-result-name">${loc.name}</div>
                <div class="search-result-detail">${loc.admin1 || ''}, ${loc.country} · ${loc.latitude.toFixed(2)}°, ${loc.longitude.toFixed(2)}°</div>
            </div>
        `).join('');
        
        // Add click handlers
        results.querySelectorAll('.search-result').forEach(el => {
            el.addEventListener('click', () => {
                const loc = JSON.parse(el.dataset.location);
                selectLocation(loc);
                results.classList.remove('active');
                document.getElementById('location-input').value = '';
            });
        });
        
    } catch (error) {
        console.error('Search error:', error);
        results.innerHTML = '<div class="search-empty">Search failed. Try again.</div>';
    }
}

// Select a location
function selectLocation(loc) {
    currentLocation = {
        name: loc.name,
        admin1: loc.admin1 || '',
        country: loc.country,
        latitude: loc.latitude,
        longitude: loc.longitude,
        timezone: loc.timezone || 'Australia/Sydney',
        elevation: loc.elevation || 0,
        postcode: loc.postcodes?.[0] || '--'
    };
    
    // Save to localStorage
    localStorage.setItem('currentLocation', JSON.stringify(currentLocation));
    
    // Add to recent locations
    addToRecentLocations(currentLocation);
    
    // Update display
    setLocation(currentLocation);
}

// Set location and fetch data
function setLocation(loc) {
    // Update header
    document.getElementById('location-name').textContent = loc.name.toUpperCase();
    document.getElementById('location-subtitle').textContent = `${loc.admin1 ? stateAbbrev[loc.admin1] || loc.admin1 : ''} · AUSTRALIA · REAL-TIME MONITORING`;
    document.getElementById('coords').textContent = `${loc.latitude.toFixed(4)}° / ${loc.longitude.toFixed(4)}°`;
    
    // Update stats
    document.getElementById('stat-postcode').textContent = loc.postcode || '--';
    document.getElementById('stat-state').textContent = stateAbbrev[loc.admin1] || loc.admin1 || '--';
    document.getElementById('stat-elevation').textContent = loc.elevation ? `${loc.elevation}m` : '--';
    document.getElementById('stat-timezone').textContent = loc.timezone?.split('/')[1] || '--';
    
    // Fetch all data
    fetchAllData();
    updateTime();
}

// Fetch all weather data
async function fetchAllData() {
    await Promise.all([
        fetchWeather(),
        fetchAirQuality()
    ]);
    updateTimestamp();
}

// Update time display
function updateTime() {
    if (!currentLocation) return;
    
    const now = new Date();
    const tz = currentLocation.timezone || 'Australia/Sydney';
    
    const timeOptions = { 
        timeZone: tz, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    };
    const dateOptions = { 
        timeZone: tz, 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    
    document.getElementById('time').textContent = now.toLocaleTimeString('en-AU', timeOptions);
    document.getElementById('date').textContent = now.toLocaleDateString('en-AU', dateOptions).toUpperCase();
}

// Get UV info
function getUVInfo(uv) {
    if (uv <= 2) return { status: 'Low', warning: 'No protection required' };
    if (uv <= 5) return { status: 'Moderate', warning: 'Some protection recommended' };
    if (uv <= 7) return { status: 'High', warning: 'Protection essential' };
    if (uv <= 10) return { status: 'Very High', warning: 'Extra protection needed' };
    return { status: 'Extreme', warning: 'Avoid outdoor exposure' };
}

// Get AQI info
function getAQIInfo(aqi) {
    if (aqi <= 50) return { text: 'GOOD', class: 'good' };
    if (aqi <= 100) return { text: 'MODERATE', class: 'moderate' };
    if (aqi <= 150) return { text: 'UNHEALTHY (SENSITIVE)', class: 'poor' };
    if (aqi <= 200) return { text: 'UNHEALTHY', class: 'poor' };
    return { text: 'HAZARDOUS', class: 'hazardous' };
}

// Format time from ISO
function formatTime(isoString, tz) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-AU', { 
        timeZone: tz,
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

// Get day name
function getDayName(dateString, tz) {
    const date = new Date(dateString + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateStr = date.toLocaleDateString('en-AU', { timeZone: tz });
    const todayStr = today.toLocaleDateString('en-AU', { timeZone: tz });
    const tomorrowStr = tomorrow.toLocaleDateString('en-AU', { timeZone: tz });
    
    if (dateStr === todayStr) return 'TODAY';
    if (dateStr === tomorrowStr) return 'TMR';
    
    return date.toLocaleDateString('en-AU', { 
        timeZone: tz,
        weekday: 'short' 
    }).toUpperCase();
}

// Update UV alert
function updateUVAlert(uv) {
    const banner = document.getElementById('alert-banner');
    const alertLevel = document.getElementById('uv-alert');
    const alertText = document.getElementById('uv-alert-text');
    
    if (uv > 5) {
        banner.style.display = 'flex';
        if (uv > 10) {
            alertLevel.textContent = '⚠ UV EXTREME';
            alertText.textContent = 'AVOID OUTDOOR EXPOSURE 10AM-4PM';
        } else if (uv > 7) {
            alertLevel.textContent = '⚠ UV VERY HIGH';
            alertText.textContent = 'EXTRA PROTECTION REQUIRED — SEEK SHADE';
        } else {
            alertLevel.textContent = '⚠ UV HIGH';
            alertText.textContent = 'PROTECTION ESSENTIAL — SLIP SLOP SLAP';
        }
    } else {
        banner.style.display = 'none';
    }
}

// Fetch weather
async function fetchWeather() {
    if (!currentLocation) return;
    
    const { latitude, longitude, timezone } = currentLocation;
    
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=${timezone}&forecast_days=5`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Current weather
        const current = data.current;
        document.getElementById('temp').textContent = `${Math.round(current.temperature_2m)}°`;
        document.getElementById('feels-like').textContent = `${Math.round(current.apparent_temperature)}°`;
        document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
        document.getElementById('wind').textContent = `${Math.round(current.wind_speed_10m)}km/h`;
        document.getElementById('weather-icon').textContent = weatherIcons[current.weather_code] || '🌡️';
        
        // Sun times
        const daily = data.daily;
        document.getElementById('sunrise').textContent = formatTime(daily.sunrise[0], timezone);
        document.getElementById('sunset').textContent = formatTime(daily.sunset[0], timezone);
        
        // UV Index
        const uvIndex = daily.uv_index_max[0];
        const uvInfo = getUVInfo(uvIndex);
        document.getElementById('uv').textContent = uvIndex.toFixed(1);
        document.getElementById('uv-status').textContent = uvInfo.status.toUpperCase();
        document.getElementById('uv-warning').textContent = uvInfo.warning;
        updateUVAlert(uvIndex);
        
        // 5-day Forecast
        const forecastHTML = [];
        for (let i = 0; i < 5; i++) {
            forecastHTML.push(`
                <div class="forecast-day">
                    <span class="forecast-date">${getDayName(daily.time[i], timezone)}</span>
                    <span class="forecast-icon">${weatherIcons[daily.weather_code[i]] || '🌡️'}</span>
                    <span class="forecast-temp"><span class="high">${Math.round(daily.temperature_2m_max[i])}°</span> / <span class="low">${Math.round(daily.temperature_2m_min[i])}°</span></span>
                </div>
            `);
        }
        document.getElementById('forecast').innerHTML = forecastHTML.join('');
        
    } catch (error) {
        console.error('Weather fetch error:', error);
    }
}

// Fetch air quality
async function fetchAirQuality() {
    if (!currentLocation) return;
    
    const { latitude, longitude, timezone } = currentLocation;
    
    try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,us_aqi&timezone=${timezone}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const current = data.current;
        const aqi = current.us_aqi || 0;
        const info = getAQIInfo(aqi);
        
        const aqiEl = document.getElementById('aqi');
        const aqiFillEl = document.getElementById('aqi-fill');
        const statusEl = document.getElementById('aqi-status');
        
        aqiEl.textContent = aqi || '--';
        aqiEl.className = `aqi-value ${info.class}`;
        aqiFillEl.className = `aqi-fill ${info.class}`;
        statusEl.textContent = info.text;
        statusEl.className = `aqi-status ${info.class}`;
        
        document.getElementById('pm25').textContent = current.pm2_5 ? `${current.pm2_5.toFixed(1)} µg/m³` : '--';
        document.getElementById('pm10').textContent = current.pm10 ? `${current.pm10.toFixed(1)} µg/m³` : '--';
        
    } catch (error) {
        console.error('Air quality fetch error:', error);
    }
}

// Update timestamp
function updateTimestamp() {
    if (!currentLocation) return;
    
    const now = new Date();
    const tz = currentLocation.timezone || 'Australia/Sydney';
    
    document.getElementById('last-update').textContent = now.toLocaleTimeString('en-AU', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }) + ' ' + (tz.split('/')[1] || 'AEST');
}

// Recent locations
function loadRecentLocations() {
    const saved = localStorage.getItem('recentLocations');
    if (saved) {
        recentLocations = JSON.parse(saved);
        renderRecentLocations();
    }
}

function addToRecentLocations(loc) {
    // Remove if already exists
    recentLocations = recentLocations.filter(r => 
        !(r.name === loc.name && r.admin1 === loc.admin1)
    );
    
    // Add to front
    recentLocations.unshift(loc);
    
    // Keep only last 5
    recentLocations = recentLocations.slice(0, 5);
    
    // Save
    localStorage.setItem('recentLocations', JSON.stringify(recentLocations));
    
    renderRecentLocations();
}

function renderRecentLocations() {
    const container = document.getElementById('recent-list');
    
    if (recentLocations.length === 0) {
        container.innerHTML = '<div class="recent-empty">No recent locations</div>';
        return;
    }
    
    container.innerHTML = recentLocations.map(loc => `
        <div class="recent-item" data-location='${JSON.stringify(loc)}'>
            <span class="recent-item-name">${loc.name}</span>
            <span class="recent-item-state">${stateAbbrev[loc.admin1] || loc.admin1 || ''}</span>
        </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.recent-item').forEach(el => {
        el.addEventListener('click', () => {
            const loc = JSON.parse(el.dataset.location);
            selectLocation(loc);
        });
    });
}

// Start
init();

// Конфигурация
const ASTANA_LAT = 51.1282;
const ASTANA_LON = 71.4307;
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${ASTANA_LAT}&longitude=${ASTANA_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,wind_speed_10m,wind_direction_10m,pressure_msl,surface_pressure,cloud_cover,weather_code&hourly=temperature_2m,precipitation_probability,precipitation,rain,showers,snowfall,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum&timezone=auto&forecast_days=3`;

// DOM элементы
const currentWeather = document.getElementById('currentWeather');
const hourlyWeather = document.getElementById('hourlyWeather');
const lastUpdated = document.getElementById('lastUpdated');

// Кэш данных
let weatherDataCache = null;
let lastFetchTime = null;

// Основные функции
async function fetchWeatherData() {
    try {
        showLoading();
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const data = await response.json();
        validateWeatherData(data);
        
        weatherDataCache = data;
        lastFetchTime = new Date();
        displayWeather(data);
        
    } catch (error) {
        showError(error);
        console.error('Ошибка при получении данных:', error);
        
        if (weatherDataCache) {
            displayWeather(weatherDataCache);
            showMessage('Используются кэшированные данные. ' + error.message);
        }
    }
}

function validateWeatherData(data) {
    const current = data.current;
    
    if (current.temperature_2m < -50 || current.temperature_2m > 50) {
        throw new Error('Некорректные данные температуры');
    }
    
    if (current.relative_humidity_2m < 0 || current.relative_humidity_2m > 100) {
        throw new Error('Некорректные данные влажности');
    }
}

function displayWeather(data) {
    currentWeather.innerHTML = displayCurrentWeather(data.current);
    hourlyWeather.innerHTML = displayHourlyForecast(data.hourly);
    lastUpdated.textContent = `Последнее обновление: ${new Date().toLocaleTimeString('ru-RU')}`;
}

function displayCurrentWeather(current) {
    const windDirection = getWindDirection(current.wind_direction_10m);
    const weatherDescription = getWeatherDescription(current.weather_code);
    
    return `
        <div class="current-weather">
            <div class="temp-main">${Math.round(current.temperature_2m)}°C</div>
            <div class="weather-details">
                <div class="detail-row">
                    <span class="detail-label">Ощущается как:</span>
                    <span class="detail-value">${Math.round(current.apparent_temperature)}°C</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Погода:</span>
                    <span class="detail-value">${weatherDescription}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Ветер:</span>
                    <span class="detail-value">${current.wind_speed_10m} км/ч, ${windDirection}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Влажность:</span>
                    <span class="detail-value">${current.relative_humidity_2m}%</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Давление:</span>
                    <span class="detail-value">${current.pressure_msl} гПа</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Облачность:</span>
                    <span class="detail-value">${current.cloud_cover}%</span>
                </div>
            </div>
        </div>
        <button class="refresh-btn" onclick="fetchWeatherData()">Обновить данные</button>
    `;
}

function displayHourlyForecast(hourly) {
    let html = '<div class="hourly-container">';
    const now = new Date();
    const currentHour = now.getHours();
    
    for (let i = currentHour; i < currentHour + 12; i++) {
        const time = new Date(hourly.time[i]);
        const hours = time.getHours().toString().padStart(2, '0');
        const temp = Math.round(hourly.temperature_2m[i]);
        const precipProb = hourly.precipitation_probability[i];
        
        html += `
            <div class="hour-card">
                <div class="hour-time">${hours}:00</div>
                <div class="hour-temp">${temp}°C</div>
                <div class="hour-precip">☔ ${precipProb}%</div>
            </div>
        `;
    }
    
    return html + '</div>';
}

// Вспомогательные функции
function getWindDirection(degrees) {
    const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
    return directions[Math.round(degrees / 45) % 8];
}

function getWeatherDescription(code) {
    const weatherMap = {
        0: 'Ясно', 1: 'Преимущественно ясно', 2: 'Переменная облачность', 3: 'Пасмурно',
        45: 'Туман', 51: 'Морось', 53: 'Умеренная морось', 55: 'Сильная морось',
        61: 'Небольшой дождь', 63: 'Умеренный дождь', 65: 'Сильный дождь',
        71: 'Небольшой снег', 73: 'Умеренный снег', 75: 'Сильный снег',
        80: 'Ливень', 85: 'Снегопад'
    };
    return weatherMap[code] || 'Неизвестно';
}

function showLoading() {
    currentWeather.innerHTML = `
        <div class="loading-container">
            <div class="loader"></div>
            <p>Получаем актуальные данные...</p>
        </div>
    `;
}

function showError(error) {
    currentWeather.innerHTML = `
        <div class="error-message">
            <h3>Ошибка при получении данных</h3>
            <p>${error.message}</p>
            <button class="refresh-btn" onclick="fetchWeatherData()">Попробовать снова</button>
        </div>
    `;
}

function showMessage(message) {
    const msgElement = document.createElement('div');
    msgElement.className = 'error-message';
    msgElement.textContent = message;
    currentWeather.appendChild(msgElement);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    fetchWeatherData();
    setInterval(fetchWeatherData, 30 * 60 * 1000); // Обновление каждые 30 минут
});

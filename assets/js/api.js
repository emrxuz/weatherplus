// API INTEGRATION

const API_KEY = "7d0f8210467408b37446ccfdf75c1e87";
const defaultRegion = "Xonqa";

window.addEventListener('load', () => fetchRegionWeather(defaultRegion));

document.getElementById('searcher').addEventListener('submit', (event) => {
    event.preventDefault();
    const inputRegion = document.getElementById('input-region').value;
    fetchRegionWeather(inputRegion);
});

async function fetchRegionWeather(region) {
    try {
        const geocodeURL = `http://api.openweathermap.org/geo/1.0/direct?q=${region}&limit=1&appid=${API_KEY}`;
        const geocodeResponse = await fetch(geocodeURL);
        if (!geocodeResponse.ok) throw new Error('Geocode request failed');

        const [location] = await geocodeResponse.json();
        if (!location) throw new Error('Location not found');

        document.querySelector('#region-name').textContent = `${location.name}, ${location.country}`;
        fetchWeatherData(location.lat, location.lon);
    } catch (error) {
        console.error(error.message);
        document.querySelector('#error-message').textContent = 'Failed to fetch region data.';
    }
}

async function fetchWeatherData(lat, lon) {
    const weatherURL = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const pollutionURL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=14&appid=${API_KEY}&units=metric`;

    try {
        const [weatherResponse, pollutionResponse, forecastResponse] = await Promise.all([
            fetch(weatherURL),
            fetch(pollutionURL),
            fetch(forecastURL),
        ]);

        if (!weatherResponse.ok || !pollutionResponse.ok || !forecastResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const weatherData = await weatherResponse.json();
        const pollutionData = await pollutionResponse.json();
        const forecastData = await forecastResponse.json();

        updateWeatherUI(weatherData, pollutionData, forecastData);
    } catch (error) {
        console.error(error.message);
        document.querySelector('#error-message').textContent = 'Failed to fetch weather data.';
    }
}

function updateWeatherUI(weatherData, pollutionData, forecastData) {
    const {
        current: { temp, weather, feels_like, humidity, pressure, wind_speed },
        hourly,
    } = weatherData;

    const pollutionLevel = pollutionData.list[0].main.aqi;
    const currentWeatherIcon = weather[0].icon;
    const weatherIconElements = document.querySelectorAll('.current-weather-icon');
    weatherIconElements.forEach((iconElement) => {
        iconElement.src = `assets/icons/${currentWeatherIcon}.svg`;
        iconElement.alt = weather[0].description;
    });

    document.querySelector('#current-temp').textContent = `${temp}℃`;
    document.querySelector('#current-weather').textContent = weather[0].main.toLowerCase();
    document.querySelector('#current-description').textContent = weather[0].description;
    document.querySelector('#current-feels-like').textContent = `${feels_like}℃`;
    document.querySelector('#current-humidity').textContent = `${humidity}%`;
    document.querySelector('#current-pressure').textContent = `${pressure} hPA`;
    document.querySelector('#current-wind-speed').textContent = `${wind_speed} km/h`;
    document.querySelector('#current-pollution').textContent = pollutionDescription(pollutionLevel);

    const hourlyContainer = document.querySelector('.swiper-wrapper');
    hourlyContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();
    hourly.slice(0, 24).forEach(hour => {
        const time = new Date(hour.dt * 1000).getHours();
        const iconCode = hour.weather[0].icon;
        const slide = document.createElement('div');
        slide.classList.add('swiper-slide', 'p-2', 'border');
        slide.innerHTML = `
        ${time}:00<br>
        <img src="assets/icons/${iconCode}.svg" width="40" alt="weather icon"><br>
        ${hour.temp}℃`;
        fragment.appendChild(slide);
    });
    hourlyContainer.appendChild(fragment);

    const swiper = new Swiper('.swiper', {
        direction: 'horizontal',
        loop: false,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        slidesPerView: 4,
        spaceBetween: 0,
        breakpoints: {
            576: { slidesPerView: 4 },
            992: { slidesPerView: 6 },
            1200: { slidesPerView: 8 },
        },
    });

    const forecastContainer = document.querySelector('.fourteen-day-forecast');
    forecastContainer.innerHTML = '';
    forecastData.list.forEach(day => {
        const date = new Date(day.dt * 1000);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.toLocaleDateString('en-us', { weekday: 'short' })}`;
        const icon = day.weather[0].icon; // Use the icon code directly

        forecastContainer.innerHTML += `
            <div class="day-forecast d-flex justify-content-between align-items-center mb-2">
                <span class="day">${formattedDate}</span>
                <div class="weather-icon">
                    <img src="assets/icons/${icon}.svg" width="40" alt="${day.weather[0].icon}">
                </div>
                <div class="day-temp">
                    <span>${Math.round(day.temp.day)}℃</span> / <span class="text-secondary">${Math.round(day.temp.min)}℃</span>
                </div>
            </div>`;
    });
}

function pollutionDescription(level) {
    return ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'][level - 1] || 'Unknown';
}

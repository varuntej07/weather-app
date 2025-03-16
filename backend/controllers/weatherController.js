const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.API_KEY;

const getWeather = async (req, res) => {
    const location = req.query.location;
    console.log('Received location:', location);

    if (!location) {
        console.log('Error: Location is required');
        return res.status(400).json({ error: 'Location is required' });
    }

    try {
        let lat, lon;
        if (/^[-+]?[0-9]*\.?[0-9]+,[-+]?[0-9]*\.?[0-9]+$/.test(location)) {
            console.log('Input matches coordinate format');
            [lat, lon] = location.split(',').map(Number);
            console.log('Parsed coordinates:', { lat, lon });
        } else {
            console.log('Input is not coordinates, using geocoding API');
            const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`;
            console.log('Geocoding URL:', geocodeUrl);
            const geocodeResponse = await axios.get(geocodeUrl);
            console.log('Geocoding Response:', geocodeResponse.data);

            if (geocodeResponse.data.length === 0) {
                console.log('Error: Location not found');
                return res.status(404).json({ error: 'Location not found' });
            }
            lat = geocodeResponse.data[0].lat;
            lon = geocodeResponse.data[0].lon;
            console.log('Resolved coordinates from geocoding:', { lat, lon });
        }

        // Fetcingh current weather using the free Current Weather API
        const weatherUrl = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        console.log('Weather URL:', weatherUrl);
        const weatherResponse = await axios.get(weatherUrl);
        console.log('Weather Response:', weatherResponse.data);

        const current = {
            temp: weatherResponse.data.main.temp,
            weather: weatherResponse.data.weather[0].main,
            icon: weatherResponse.data.weather[0].icon,
            humidity: weatherResponse.data.main.humidity,
            wind_speed: weatherResponse.data.wind.speed,
        };

        // Fetches 5-day forecast using the free 5-day Forecast API
        const forecastUrl = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        console.log('Forecast URL:', forecastUrl);
        const forecastResponse = await axios.get(forecastUrl);
        console.log('Forecast Response:', forecastResponse.data);

        const dailyForecast = [];
        const seenDates = new Set();
        for (const entry of forecastResponse.data.list) {
            const date = new Date(entry.dt * 1000).toLocaleDateString();
            if (!seenDates.has(date) && dailyForecast.length < 5) {
                seenDates.add(date);
                dailyForecast.push({
                    date: date,
                    temp_min: entry.main.temp_min,
                    temp_max: entry.main.temp_max,
                    weather: entry.weather[0].main,
                    icon: entry.weather[0].icon,
                });
            }
        }

        res.json({ current, forecast: dailyForecast });
    } catch (error) {
        console.error('Error in getWeather:', error.response ? error.response.data : error.message);
        res.status(500).json({
            error: 'Failed to fetch weather data',
            details: error.response ? error.response.data : error.message
        });
    }
};

module.exports = { getWeather };
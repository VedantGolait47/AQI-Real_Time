
const express = require("express");
const app = express();
const path = require('path');

// API KEY
const api_key = "ef0d03a2d5cecb0e929bcac80417c5b030196513";
const openweather_appid = "0724353ad37e0fb800a90320ed727ab6";

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '1mb' }));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});


app.get('/search', async (req, res) => {
  try {
    const city = req.query.city;
    if (!city) return res.status(400).json({ error: "Missing city query" });

    const url = `https://api.waqi.info/search/?keyword=${encodeURIComponent(city)}&token=${api_key}`;
    const waqiResp = await fetch(url);
    const waqiJson = await waqiResp.json();
    return res.json(waqiJson);
  } catch (err) {
    console.error("Error /search:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/weatherByCity', async (req, res) => {
  try {
    const city = req.query.city;
    if (!city) return res.status(400).json({ error: "Missing city query" });

    // 1) Try WAQI feed (direct feed by city/station)
    const feedUrl = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${api_key}`;
    const feedResp = await fetch(feedUrl);
    const feedJson = await feedResp.json();

    // If WAQI didn't return a feed, return search suggestions
    if (feedJson.status !== "ok") {
      const searchUrl = `https://api.waqi.info/search/?keyword=${encodeURIComponent(city)}&token=${api_key}`;
      const searchResp = await fetch(searchUrl);
      const searchJson = await searchResp.json();
      return res.json({ status: "no-feed", search: searchJson });
    }

    // 2) extract geo coordinates from feed response
    const geo = (feedJson.data && feedJson.data.city && feedJson.data.city.geo) || null;
    if (!geo || geo.length < 2) {
      return res.status(500).json({ error: "No geo coordinates returned by WAQI feed" });
    }
    const lat = geo[0];
    const lon = geo[1];

    // 3) fetch historical air-pollution from OpenWeather (past 48 hours)
    const end = Math.floor(Date.now() / 1000);
    const start = end - (48 * 3600);
    const owUrl = `https://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${openweather_appid}`;
    const owResp = await fetch(owUrl);
    const owJson = await owResp.json();

    return res.json({
      current_aqi: feedJson,
      past_aqi: owJson
    });
  } catch (err) {
    console.error("Error /weatherByCity:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/weather/:latlong', async (req, res) => {
  try {
    const latlong = req.params.latlong.split(',');
    const lat = latlong[0];
    const long = latlong[1];
    const start = latlong[2];
    const end = latlong[3];

    const currentAQI_url = `https://api.waqi.info/feed/geo:${lat};${long}/?token=${api_key}`;
    const currentAQI_response = await fetch(currentAQI_url);
    const currentAQI_data = await currentAQI_response.json();

    const pastAQI_url = `https://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${long}&start=${start}&end=${end}&appid=${openweather_appid}`;
    const pastAQI_response = await fetch(pastAQI_url);
    const pastAQI_data = await pastAQI_response.json();

    const data = {
      current_aqi: currentAQI_data,
      past_aqi: pastAQI_data
    };
    return res.json(data);
  } catch (err) {
    console.error("Error /weather latlong:", err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}`);
});

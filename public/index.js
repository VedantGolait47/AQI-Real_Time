
var myChartList = [];

function clearChart() {
  if (typeof myChartList !== 'undefined' && myChartList.length > 0) {
    for (var i = 0; i < myChartList.length; i++) {
      try { myChartList[i].destroy(); } catch (e) {}
    }
    myChartList = [];
  }
}

function chartIt(ctx, data, labelText) {
  let xlabels = [];
  const ylabels = [];
  let maxValue = -1;
  let scale = [500, 350, 250, 150, 100, 50];

  for (var i = 0; i < data.length; i++) {
    const comp = data[i].components || {};
    let val = 0;
    if (labelText == 'o3') val = comp.o3;
    else if (labelText == 'pm25') val = comp.pm2_5;
    else if (labelText == 'pm10') val = comp.pm10;
    else if (labelText == 'so2') val = comp.so2;
    else if (labelText == 'co') val = comp.co;
    else val = comp.no2;

    val = (val === undefined || val === null) ? 0 : val;
    xlabels.push(val);

    // labels in reverse order (48H → 0H)
    ylabels.push((data.length - i - 1) + 'H ago');

    if (xlabels[i] > maxValue) maxValue = xlabels[i];
  }

  let titleText = "";
  switch (labelText) {
    case "o3":
      titleText = "O₃ (Ozone) – Past 48 Hours (µg/m³)";
      break;
    case "pm10":
      titleText = "PM10 (Particulate Matter 10µm) – Past 48 Hours (µg/m³)";
      break;
    case "pm25":
      titleText = "PM2.5 (Fine Particulate Matter) – Past 48 Hours (µg/m³)";
      break;
    case "so2":
      titleText = "SO₂ (Sulfur Dioxide) – Past 48 Hours (µg/m³)";
      break;
    case "co":
      titleText = "CO (Carbon Monoxide) – Past 48 Hours (µg/m³)";
      break;
    default:
      titleText = "NO₂ (Nitrogen Dioxide) – Past 48 Hours (µg/m³)";
      break;
  }

  const myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ylabels,
      datasets: [{
        label: labelText + "-level(μg/m3)",
        data: xlabels,
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: titleText,
          font: { size: 14, weight: '600' }
        },
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: (Math.floor(maxValue / 10)) * 10 + 20,
          min: 0
        }
      }
    }
  });

  var red = scale[2], orange = scale[3], yellow = scale[4], lightGreen = scale[5];
  var dataset = myChart.data.datasets[0];

  for (var j = 0; j < dataset.data.length; j++) {
    if (dataset.data[j] >= red) {
      dataset.backgroundColor[j] = 'rgba(255, 0, 0, 0.7)';
      dataset.borderColor[j] = 'rgba(255, 0, 0, 1)';
    } else if (dataset.data[j] >= orange) {
      dataset.backgroundColor[j] = 'rgba(255, 69, 0, 0.6)';
      dataset.borderColor[j] = 'rgba(255, 69, 0, 1)';
    } else if (dataset.data[j] >= yellow) {
      dataset.backgroundColor[j] = 'rgba(255, 255, 0, 0.6)';
      dataset.borderColor[j] = 'rgba(255, 255, 0, 1)';
    } else {
      dataset.backgroundColor[j] = 'rgba(0, 150, 0, 0.6)';
      dataset.borderColor[j] = 'rgba(0, 150, 0, 1)';
    }
  }

  myChart.update();
  myChartList.push(myChart);
}

/* ---------- UI helpers ---------- */
function safeDisplayValue(x, unit = "") {
  if (!x || x.v === undefined || x.v === null) return "-";
  const num = Math.round(x.v * 10) / 10;
  return num + unit;
}

function showWeather(iaqi) {
  try {
    document.getElementById("pm25-val").textContent = safeDisplayValue(iaqi.pm25);
    document.getElementById("pm10-val").textContent = safeDisplayValue(iaqi.pm10);
    document.getElementById("co-val").textContent = safeDisplayValue(iaqi.co);
    document.getElementById("o3-val").textContent = safeDisplayValue(iaqi.o3);

    document.getElementById("temp-val").textContent = safeDisplayValue(iaqi.t, "°C");
    document.getElementById("pressure-val").textContent = safeDisplayValue(iaqi.p, " hPa");
    document.getElementById("humidity-val").textContent = safeDisplayValue(iaqi.h, "%");
    document.getElementById("wind-val").textContent = safeDisplayValue(iaqi.w, " km/h");
  } catch (err) {
    console.warn("showWeather error:", err);
  }
}

function setAQIColorClass(elem, aqi) {
  elem.classList.remove('good','sat','moderate','unhealthy','danger');
  if (aqi === "-" || isNaN(Number(aqi))) return;
  const n = Number(aqi);
  if (n > 300) elem.classList.add('danger');
  else if (n > 200) elem.classList.add('unhealthy');
  else if (n > 150) elem.classList.add('moderate');
  else if (n > 100) elem.classList.add('sat');
  else elem.classList.add('good');
}

function showAQI(aqi, time, city, temp) {
  try {
    document.getElementById("AQI-head").textContent = city || "";

    const levelText = (aqi > 300 ? "Hazardous" :
                       aqi > 200 ? "Dangerous" :
                       aqi > 150 ? "Unhealthy" :
                       aqi > 100 ? "Moderate" :
                       aqi > 50  ? "Satisfactory" : "Good");

    let tm = "";
    if (time && typeof time === 'string') {
      const parts = time.split(" ");
      tm = parts.length > 1 ? parts[1].slice(0,5) : time;
    }
    document.getElementById("AQI-sub").textContent = `${levelText}   Updated on ${tm}`;

    const box = document.getElementById("AQI-logo");
    box.textContent = aqi;
    setAQIColorClass(box, aqi);

    let levelImg = (aqi > 300 ? "hazardous" :
                    aqi > 200 ? "dangerous" :
                    aqi > 150 ? "unhealthy" :
                    aqi > 100 ? "moderate" :
                    aqi > 50  ? "satisfactory" :
                                "good");
    document.getElementById("AQI-img").src = `/${levelImg}.png`;
  } catch (err) {
    console.warn("showAQI error:", err);
  }
}

// server response 
function processAQIData(json) {

  /* ---- Error / No Data Handling ---- */
  if (!json) {
    document.getElementById('search-hint').textContent = "No response from server.";
    document.getElementById('results').classList.add('hidden');
    document.getElementById('aqi-footer').classList.add('hidden');
    return;
  }

  if (json.status === "no-feed") {
    const suggestions = (json.search && json.search.data)
      ? json.search.data.map(s => s.station ? s.station.name : s.a)
      : [];
    document.getElementById('search-hint').textContent =
      "No direct feed found. Suggestions: " + suggestions.slice(0, 6).join(" | ");

    document.getElementById('results').classList.add('hidden');
    document.getElementById('aqi-footer').classList.add('hidden');
    return;
  }

  const currentAQI = json.current_aqi;
  const past_aqi = json.past_aqi;

  if (!currentAQI || currentAQI.status !== "ok" || !past_aqi) {
    document.getElementById('search-hint').textContent =
      "Data not available for this city.";

    document.getElementById('results').classList.add('hidden');
    document.getElementById('aqi-footer').classList.add('hidden');
    return;
  }

  const aqi = currentAQI.data?.aqi ?? "-";
  const iaqi = currentAQI.data?.iaqi ?? {};
  const time = currentAQI.data?.time?.s ?? "";
  const city = currentAQI.data?.city?.name ?? "";

  showAQI(aqi, time, city, iaqi.t?.v ?? null);
  showWeather(iaqi);

  // draw charts
  Chart.defaults.font.size = 11;
  Chart.defaults.font.weight = "600";
  clearChart();

  try {
    if (Array.isArray(past_aqi.list) && past_aqi.list.length > 0) {
      chartIt(document.getElementById('myChart').getContext('2d'), past_aqi.list, "o3");
      chartIt(document.getElementById('myChart1').getContext('2d'), past_aqi.list, "pm10");
      chartIt(document.getElementById('myChart2').getContext('2d'), past_aqi.list, "pm25");
      chartIt(document.getElementById('myChart3').getContext('2d'), past_aqi.list, "so2");
      chartIt(document.getElementById('myChart4').getContext('2d'), past_aqi.list, "co");
      chartIt(document.getElementById('myChart5').getContext('2d'), past_aqi.list, "no2");
    }
  } catch (err) {
    console.error("Error drawing charts:", err);
  }

  
  document.getElementById('results').classList.remove('hidden');
  document.getElementById('search-hint').textContent = "";

  // SHOW FOOTER NOW THAT DATA IS AVAILABLE
  document.getElementById('aqi-footer').classList.remove('hidden');

  // Scroll to results
  setTimeout(() => {
    const r = document.getElementById('results');
    if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 120);
}

//  Fetch by city 
async function searchAndShowCity(cityName) {
  try {
    if (!cityName || cityName.trim().length < 1) {
      document.getElementById('search-hint').textContent = "Please enter a city name.";
      document.getElementById('results').classList.add('hidden');
      document.getElementById('aqi-footer').classList.add('hidden');
      return;
    }

    document.getElementById('results').classList.add('hidden');
    document.getElementById('aqi-footer').classList.add('hidden');
    document.getElementById('search-hint').textContent = "Searching...";

    const resp = await fetch(`/weatherByCity?city=${encodeURIComponent(cityName.trim())}`);
    if (!resp.ok) {
      document.getElementById('search-hint').textContent = "Server error. Try again later.";
      document.getElementById('results').classList.add('hidden');
      document.getElementById('aqi-footer').classList.add('hidden');
      return;
    }

    const json = await resp.json();
    processAQIData(json);

  } catch (err) {
    console.error("searchAndShowCity error:", err);
    document.getElementById('search-hint').textContent = "Failed to fetch data.";
    document.getElementById('results').classList.add('hidden');
    document.getElementById('aqi-footer').classList.add('hidden');
  }
}


document.getElementById('search-btn').addEventListener('click', () => {
  const q = document.getElementById('city-search').value;
  searchAndShowCity(q);
});

document.getElementById('city-search').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const q = document.getElementById('city-search').value;
    searchAndShowCity(q);
  }
});

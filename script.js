const stations = [
  {
    code: "P6161510",  // station amont
    name: "Station Amont - Mayac",
    lat: 45.282566,
    lon: 0.936423
  },
  {
    code: "P6161511",  // station aval
    name: "Station Aval - Escoire",
    lat: 45.212417,
    lon: 0.838358
  }
];

// Initialisation carte
const map = L.map('map').setView([45.25, 0.88], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
.addTo(map);

async function loadStations() {

  for (let s of stations) {

    try {

      // ✅ Proxy CORS
      const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://hubeau.eaufrance.fr/api/v1/hydrometrie/observations_tr?code_station=${s.code}&size=20`
      )}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.log("Erreur HTTP :", response.status);
        continue;
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        console.log("Pas de données pour", s.name);
        continue;
      }

      const latest = data.data[0];
      const flow = latest.resultat;

      let color = "green";
      if (flow > 200) color = "orange";
      if (flow > 500) color = "red";

      L.circleMarker([s.lat, s.lon], {
        radius: 8,
        color: color
      })
      .addTo(map)
      .bindPopup(`${s.name}<br>Débit : ${flow} m³/s`);

      // Graphique uniquement station amont
      if (s.name === "Station Amont") {
        drawChart(data.data);
      }

    } catch (error) {
      console.error("Erreur API :", error);
    }
  }
}

function drawChart(dataset) {

  const ctx = document.getElementById('chart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataset.map(d => d.date_obs).reverse(),
      datasets: [{
        label: "Débit (m³/s)",
        data: dataset.map(d => d.resultat).reverse(),
        fill: false,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          display: false
        }
      }
    }
  });
}

loadStations();

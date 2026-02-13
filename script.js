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

// Centrage carte sur Sarliac
const map = L.map('map').setView([45.25, 0.88], 11);

// OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
.addTo(map);

async function loadStations() {

  for (let s of stations) {

    try {

      // 👉 API v2 Hubeau Hydrométrie (supporte CORS)
      const url = `https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr?code_station=${s.code}&grandeur_hydro=Q&size=20&sort=desc`;

      const response = await fetch(url);
      const result = await response.json();

      if (!result.data || result.data.length === 0) {
        console.warn("Pas de données pour", s.name);
        continue;
      }

      const latest = result.data[0];
      const flow = latest.resultat_obs ?? latest.resultat || 0;

      let color = "green";
      if (flow > 200) color = "orange";
      if (flow > 500) color = "red";

      L.circleMarker([s.lat, s.lon], {
        radius: 8,
        color: color
      })
      .addTo(map)
      .bindPopup(`${s.name}<br>Débit : ${flow} m³/s`);

      // Pour une seule série de graphique, on prend la première station
      if (s.name === "Station Amont") {
        drawChart(result.data);
      }

    } catch (error) {
      console.error("Erreur API :", error);
    }
  }
}

function drawChart(data) {

  const ctx = document.getElementById('chart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date_obs).reverse(),
      datasets: [{
        label: "Débit (m³/s)",
        data: data.map(d => d.resultat_obs ?? d.resultat).reverse(),
        borderColor: 'blue',
        fill: false,
        tension: 0.2
      }]
    },
    options: {
      responsive: true
    }
  });
}

loadStations();

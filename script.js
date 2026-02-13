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

// Carte
const map = L.map('map').setView([45.12, 0.72], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
.addTo(map);

async function loadStations() {

  for (let s of stations) {

    const response = await fetch(
      `https://hubeau.eaufrance.fr/api/v1/hydrometrie/observations_tr?code_entite=${s.code}&size=20`
    );

    const data = await response.json();

    if (!data.data || data.data.length === 0) continue;

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

    drawChart(data.data);
  }
}

function drawChart(dataset) {

  const ctx = document.getElementById('chart');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataset.map(d => d.date_obs),
      datasets: [{
        label: "Débit (m³/s)",
        data: dataset.map(d => d.resultat)
      }]
    }
  });
}

loadStations();

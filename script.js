// --- 1️⃣ Carte centrée sur Sarliac ---
const sarliac = [45.2545, 0.8733];

const map = L.map('map').setView(sarliac, 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Marqueur Sarliac
L.marker(sarliac).addTo(map)
  .bindPopup("Sarliac-sur-l'Isle")
  .openPopup();




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

// --- 3️⃣ Chargement données ---
async function loadData() {

  for (let s of stations) {

    try {

      const url =
        `https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr` +
        `?code_station=${s.code}` +
        `&grandeur_hydro=Q` +
        `&size=20` +
        `&sort=desc`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error("Erreur HTTP", response.status);
        return;
      }

      const json = await response.json();

      if (!json.data || json.data.length === 0) {
        console.warn("Pas de données reçues");
        return;
      }

      const latest = json.data[0];
      const flow = latest.resultat_obs;

      // Couleur selon débit
      let color = "green";
      if (flow > 200) color = "orange";
      if (flow > 500) color = "red";

      // Marqueur station
      L.circleMarker([s.lat, s.lon], {
        radius: 8,
        color: color
      })
      .addTo(map)
      .bindPopup(`${s.name}<br>Débit : ${flow} m³/s`);

      drawChart(json.data);

    } catch (err) {
      console.error("Erreur JS :", err);
    }
  }
}


// --- 4️⃣ Graphique ---
function drawChart(data) {

  const ctx = document.getElementById('chart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date_obs).reverse(),
      datasets: [{
        label: "Débit (m³/s)",
        data: data.map(d => d.resultat_obs).reverse(),
        borderColor: "blue",
        fill: false
      }]
    },
    options: {
      responsive: true
    }
  });
}

loadData();

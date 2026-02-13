// ============================
// 1️⃣ Carte centrée sur Sarliac
// ============================

const sarliac = [45.2545, 0.8733];

const map = L.map('map').setView(sarliac, 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

L.marker(sarliac).addTo(map)
  .bindPopup("Sarliac-sur-l'Isle")
  .openPopup();


// ============================
// 2️⃣ Stations amont & aval
// ============================



const stations = [
  {
    code: "P616151001",  // station amont
    name: "Station Amont - Mayac",
    lat: 45.282566,
    lon: 0.936423
  },
  {
    code: "P616151101",  // station aval
    name: "Station Aval - Escoire",
    lat: 45.212417,
    lon: 0.838358
  }
];

// ============================
// 3️⃣ Récupération données API
// ============================

async function fetchStationData(stationCode) {

  const url =
    `https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr` +
    `?code_station=${stationCode}` +
    `&grandeur_hydro=H` +
    `&size=30` +
    `&sort=desc`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erreur API Hubeau");
  }

  const json = await response.json();

  return json.data || [];
}


// ============================
// 4️⃣ Chargement complet
// ============================

async function loadData() {

  try {

    const amontData = await fetchStationData(stations[0].code);
    const avalData  = await fetchStationData(stations[1].code);

    if (amontData.length === 0 || avalData.length === 0) {
      console.warn("Données manquantes");
      return;
    }

    // Derniers débits pour couleur carte
    const amontFlow = amontData[0].resultat_obs;
    const avalFlow  = avalData[0].resultat_obs;

    addStationMarker(stations[0], amontFlow);
    addStationMarker(stations[1], avalFlow);

    drawChart(amontData, avalData);

  } catch (err) {
    console.error("Erreur :", err);
  }
}


// ============================
// 5️⃣ Marqueurs carte
// ============================

function addStationMarker(station, flow) {

  let color = "green";
  if (flow > 200) color = "orange";
  if (flow > 500) color = "red";

  L.circleMarker([station.lat, station.lon], {
    radius: 8,
    color: color
  })
  .addTo(map)
  .bindPopup(`${station.name}<br>Débit : ${flow} m³/s`);
}


// ============================
// 6️⃣ Graphique double courbe
// ============================

function drawChart(amontData, avalData) {

  const ctx = document.getElementById('chart').getContext('2d');

  const labels = amontData.map(d => d.date_obs).reverse();

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: "Débit Amont (m³/s)",
          data: amontData.map(d => d.resultat_obs).reverse(),
          borderColor: "blue",
          fill: false,
          tension: 0.2
        },
        {
          label: "Débit Aval (m³/s)",
          data: avalData.map(d => d.resultat_obs).reverse(),
          borderColor: "red",
          fill: false,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          display: false
        }
      }
    }
  });
}


// ============================
// Lancement
// ============================

loadData();

// ===================================================
// 1️⃣ CARTE CENTRÉE SUR SARLIAC
// ===================================================

const sarliac = [45.2545, 0.8733];

const map = L.map('map').setView(sarliac, 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

L.marker(sarliac).addTo(map)
  .bindPopup("Sarliac-sur-l'Isle")
  .openPopup();


// ===================================================
// 2️⃣ STATIONS AMONT & AVAL
// ===================================================

const stations = [
  {
    code: "P616151001",
    name: "Station Amont - Mayac",
    lat: 45.282566,
    lon: 0.936423
  },
  {
    code: "P616151101",
    name: "Station Aval - Escoire",
    lat: 45.212417,
    lon: 0.838358
  }
];

stations.forEach(station => {
  L.circleMarker([station.lat, station.lon], {
    radius: 8,
    color: "blue"
  })
  .addTo(map)
  .bindPopup(station.name);
});


// ===================================================
// 3️⃣ DATES : 7 DERNIERS JOURS
// ===================================================

const today = new Date();
const dateFin = today.toISOString();

const dateDebutObj = new Date();
dateDebutObj.setDate(today.getDate() - 7);
const dateDebut = dateDebutObj.toISOString();


// ===================================================
// 4️⃣ RÉCUPÉRATION API HUBEAU
// ===================================================

async function fetchStationData(stationCode) {

  const url =
    `https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr` +
    `?code_station=${stationCode}` +
    `&grandeur_hydro=H` +
    `&date_debut_obs=${dateDebut}` +
    `&date_fin_obs=${dateFin}` +
    `&size=10000` +
    `&sort=asc`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erreur API Hubeau");
  }

  const json = await response.json();

  return json.data || [];
}


// ===================================================
// 5️⃣ GRAPHIQUE
// ===================================================

let chartInstance = null;

function drawChart(amontData, avalData) {

  const ctx = document.getElementById('chart').getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: "Hauteur Amont (m)",
          data: amontData.map(d => ({
            x: new Date(d.date_obs),
            y: d.resultat_obs
          })),
          borderColor: "blue",
          tension: 0.2,
          pointRadius: 0
        },
        {
          label: "Hauteur Aval (m)",
          data: avalData.map(d => ({
            x: new Date(d.date_obs),
            y: d.resultat_obs
          })),
          borderColor: "red",
          tension: 0.2,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x'
          },
          pan: {
            enabled: true,
            mode: 'x'
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day'
          },
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Hauteur (m)'
          }
        }
      }
    }
  });
}


// ===================================================
// 6️⃣ CHARGEMENT GLOBAL
// ===================================================

async function loadData() {
  try {

    const amontData = await fetchStationData(stations[0].code);
    const avalData = await fetchStationData(stations[1].code);

    drawChart(amontData, avalData);

  } catch (error) {
    console.error("Erreur :", error);
  }
}

loadData();

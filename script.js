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

stations.forEach((station, index) => {
  L.circleMarker([station.lat, station.lon], {
    radius: 8,
    color: index === 0 ? "blue" : "red"
  })
  .addTo(map)
  .bindPopup(station.name);
});


// ===================================================
// 3️⃣ DATES : 7 DERNIERS JOURS
// ===================================================

const today = new Date();

const dateFin = today.toISOString().split('T')[0];

const dateDebutObj = new Date();
dateDebutObj.setDate(today.getDate() - 7);

const dateDebut = dateDebutObj.toISOString().split('T')[0];


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
    `&size=20000` +
    `&sort=asc`;

  const response = await fetch(url);
  const json = await response.json();

  console.log("Station", stationCode, "→", json.data.length, "valeurs");

  return json.data || [];
}



// ===================================================
// 5️⃣ GRAPHIQUE
// ===================================================

let chartInstance = null;
function cleanData(data) {
  return data
    .map(d => ({
      x: new Date(d.date_obs),
      y: Number(d.resultat_obs)
    }))
    .filter(d => 
      !isNaN(d.y) &&
      d.y > 0 &&
      d.y < 20   // sécurité : hauteur réaliste
    );
}
function drawChart(amontData, avalData) {

  const ctx = document.getElementById('chart').getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
  }

  const formatData = (data) => {
    return data
      .filter(d => d.resultat_obs !== null)
      .map(d => ({
        x: new Date(d.date_obs),
        y: parseFloat(d.resultat_obs)
      }));
  };

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: "Hauteur Amont (m)",
          data: formatData(amontData),
          borderColor: "blue",
          pointRadius: 0,
          tension: 0.2
        },
        {
          label: "Hauteur Aval (m)",
          data: formatData(avalData),
          borderColor: "red",
          pointRadius: 0,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      parsing: false,
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
            unit: 'hour',
            displayFormats: {
              hour: 'yyyy-MM-dd HH:mm:ss'
            }
          },
          ticks: {
            source: 'auto'
          },
          title: {
            display: true,
            text: 'Date / Heure'
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

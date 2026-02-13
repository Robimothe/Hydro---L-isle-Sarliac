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
// Calculer date début : lundi de la semaine
const today = new Date();
const day = today.getDay(); // 0 = dimanche
const monday = new Date(today);
monday.setDate(today.getDate() - ((day + 6) % 7)); // lundi de cette semaine

const dateDebut = monday.toISOString().split('T')[0]; // YYYY-MM-DD
const dateFin   = today.toISOString().split('T')[0];   // aujourd'hui
// ============================
// 3️⃣ Récupération données API
// ============================

async function fetchStationData(stationCode) {

const url = 
  `https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr` +
  `?code_station=${stationCode}` +
  `&grandeur_hydro=H` +            // ou Q pour débit
  `&date_debut_obs=${dateDebut}` +
  `&date_fin_obs=${dateFin}` +
  `&size=1000` +                   // assez grand pour tout récupérer
  `&sort=asc`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erreur API Hubeau");
  }

  const json = await response.json();

  return json.data || [];
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

  if (chartInstance !== null) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: amontData.map(d => new Date(d.date_obs)),
      datasets: [
        {
          label: "Hauteur Amont (m)",
          data: amontData.map(d => d.resultat_obs),
          borderColor: "blue",
          fill: false,
          tension: 0.2
        },
        {
          label: "Hauteur Aval (m)",
          data: avalData.map(d => d.resultat_obs),
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
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'DD/MM/YYYY HH:mm'
          },
          title: { display: true, text: 'Date' }
        },
        y: {
          title: { display: true, text: 'Hauteur (m)' }
        }
      }
    }
  });
}




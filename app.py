import streamlit as st
import pandas as pd
import requests
from datetime import datetime, timedelta
import plotly.express as px

st.title("Suivi hydrologique - Isle (Sarliac)")

# ==========================
# Paramètres stations
# ==========================

stations = {
    "Amont - Mayac": "P616151001",
    "Aval - Escoire": "P616151101"
}

# ==========================
# Dates 7 derniers jours
# ==========================

date_fin = datetime.today()
date_debut = date_fin - timedelta(days=7)

date_debut_str = date_debut.strftime("%Y-%m-%d")
date_fin_str = date_fin.strftime("%Y-%m-%d")

# ==========================
# Fonction récupération API
# ==========================

def fetch_data(code_station):

    url = (
        "https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr"
        f"?code_station={code_station}"
        f"&grandeur_hydro=H"
        f"&date_debut_obs={date_debut_str}"
        f"&date_fin_obs={date_fin_str}"
        "&size=20000"
        "&sort=asc"
    )

    r = requests.get(url)
    data = r.json()["data"]

    df = pd.DataFrame(data)

    # Nettoyage
    df["date_obs"] = pd.to_datetime(df["date_obs"])
    df["hauteur_m"] = pd.to_numeric(df["resultat_obs"]) / 1000  # mm → m

    df = df[["date_obs", "hauteur_m"]]
    df = df.dropna()
    df = df.sort_values("date_obs")

    return df

# ==========================
# Récupération données
# ==========================

df_amont = fetch_data(stations["Amont - Mayac"])
df_aval = fetch_data(stations["Aval - Escoire"])

df_amont["Station"] = "Amont"
df_aval["Station"] = "Aval"

df_total = pd.concat([df_amont, df_aval])

# ==========================
# Graphique interactif
# ==========================

fig = px.line(
    df_total,
    x="date_obs",
    y="hauteur_m",
    color="Station",
    title="Evolution des hauteurs d'eau (7 derniers jours)",
)

fig.update_layout(
    xaxis_title="Date / Heure",
    yaxis_title="Hauteur (m)",
)

st.plotly_chart(fig, use_container_width=True)

import axios from "axios";

export const getCoordinatesFromAddress = async (address) => {
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: address,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "rendez-vous-app/1.0", 
      },
    });

    if (response.data.length === 0) {
      return null;
    }

    const { lat, lon } = response.data[0];
    return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
  } catch (error) {
    console.error("Erreur de géolocalisation :", error);
    return null;
  }
};

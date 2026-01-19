<template>
    <div class="map-container">
      <LMap :zoom="zoom" :center="center">
        <LTileLayer :url="tileUrl" :attribution="attribution" />
  
        <LMarker
          v-for="spot in spots"
          :key="spot.id"
          :lat-lng="[spot.latitude, spot.longitude]"
        >
          <LPopup>
            <div class="popup">
              <h3>{{ spot.name }}</h3>
              <p>{{ spot.spot_type }}</p>
              <button @click="selectSpot(spot)">View details</button>
            </div>
          </LPopup>
        </LMarker>
      </LMap>
  
      <!-- Details panel -->
      <div v-if="selectedSpot" class="details-panel">
        <h2>{{ selectedSpot.name }}</h2>
        <p><strong>Type:</strong> {{ selectedSpot.spot_type }}</p>
        <p>{{ selectedSpot.description }}</p>
        <p v-if="selectedSpot.tips"><strong>Tips:</strong> {{ selectedSpot.tips }}</p>
  
        <button @click="selectedSpot = null">Close</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import { LMap, LTileLayer, LMarker, LPopup } from "@vue-leaflet/vue-leaflet";
  import api from "../services/api";
  
  const zoom = ref(13);
  const center = ref([42.6977, 23.3219]);
  
  const spots = ref([]);
  const selectedSpot = ref(null);
  
  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  
  onMounted(async () => {
    const res = await api.get("/spots");
    spots.value = res.data;
  });
  
  function selectSpot(spot) {
    selectedSpot.value = spot;
  }
  </script>
  
  <style scoped>
  .map-container {
    height: calc(100vh - 80px);
    width: 100%;
    position: relative;
  }
  
  .map-container :deep(.leaflet-container) {
    height: 100%;
    width: 100%;
  }
  
  .popup h3 {
    margin: 0;
  }
  
  .details-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 300px;
    background: white;
    color: black;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    z-index: 1000;
  }
  </style>
  
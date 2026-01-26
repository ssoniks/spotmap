<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet"; 
import "leaflet/dist/leaflet.css";
import { useAuth } from '../composables/useAuth';

// Leaflet Icon Fixes
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Added 'isPickingLocation' prop
const props = defineProps(['spots', 'selectedSpot', 'isPickingLocation']);
const emit = defineEmits(['marker-click', 'map-click', 'close-details', 'edit-spot', 'delete-spot', 'view-profile']);

const auth = useAuth();
const zoom = ref(13);
const center = ref([42.6977, 23.3219]); 

const bulgariaBounds = [
  [41.235, 22.357], 
  [44.215, 28.609]  
];

const map = ref(null);
const mapContainer = ref(null);
let resizeObserver = null;

const isOwner = computed(() => {
  if (!props.selectedSpot || !auth.user.value) return false;
  return props.selectedSpot.created_by === auth.user.value.id;
});

watch(() => props.selectedSpot, (newSpot) => {
  if (newSpot) {
    center.value = [newSpot.latitude, newSpot.longitude];
    zoom.value = 16;
  }
});

// --- Handle Map Click ---
const onMapClick = (e) => {
  // e.latlng contains { lat, lng }
  emit('map-click', e.latlng);
};

onMounted(() => {
  if (mapContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      if (map.value && map.value.leafletObject) {
        map.value.leafletObject.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainer.value);
  }
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<template>
  <div class="map-wrapper" ref="mapContainer" :class="{ 'picking-mode': isPickingLocation }">
    <LMap 
      ref="map"
      v-model:zoom="zoom" 
      v-model:center="center" 
      :use-global-leaflet="false"
      :options="{ zoomControl: false }"
      :max-bounds="bulgariaBounds" 
      :min-zoom="7"
      :max-bounds-viscosity="1.0"
      @click="onMapClick"
    >
      <LTileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />
      
      <LMarker
        v-for="spot in spots"
        :key="spot.id"
        :lat-lng="[spot.latitude, spot.longitude]"
        @click="$emit('marker-click', spot)"
      >
      </LMarker>
    </LMap>

    <div v-if="selectedSpot" class="map-overlay">
      <div class="overlay-content">
        <button class="close-btn" @click="$emit('close-details')">✕</button>
        <h2>{{ selectedSpot.name }}</h2>
        <br>
        <p 
           class="created-by" 
           @click="$emit('view-profile', selectedSpot.creator_username)"
        >
          Created by: <strong>@{{ selectedSpot.creator_username || 'Unknown' }}</strong>
        </p>
        <span class="badge">{{ selectedSpot.spot_type }}</span>
        <p>{{ selectedSpot.description }}</p>
        
        <div v-if="selectedSpot.image_url" class="spot-image">
           <img :src="selectedSpot.image_url" alt="Spot" />
        </div>

        <div class="meta">
          <p v-if="selectedSpot.tips">💡 <strong>Tip:</strong> {{ selectedSpot.tips }}</p>
        </div>

        <div v-if="isOwner" class="owner-actions">
          <button class="btn-edit" @click="$emit('edit-spot', selectedSpot)">Edit</button>
          <button class="btn-delete" @click="$emit('delete-spot', selectedSpot)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper { 
  height: 100vh; 
  width: 100%; 
  position: relative; 
  background-color: #121212; 
  z-index: 0;
}



.picking-mode,
.picking-mode :deep(.leaflet-container),
.picking-mode :deep(.leaflet-interactive) {
  /* This is a Data URI for a Red Pin. No external file needed. */
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23ff3333" stroke="%23000000" stroke-width="1"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="%23b30000"/></svg>') 16 32, crosshair !important;
}

.map-overlay {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #444;
  z-index: 1000;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  color: white;
}

.created-by {
  font-size: 0.8rem;
  color: #888;
  margin-top: -5px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: color 0.2s;
}
.created-by:hover {
  color: var(--accent);
  text-decoration: underline;
}
.created-by strong {
  color: #ccc;
}

/* ... Rest of your styles remain exactly the same ... */
.close-btn { position: absolute; top: 10px; right: 10px; background: transparent; color: #aaa; font-size: 1.2rem; }
.badge { background: var(--accent); color: black; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
.spot-image img { width: 100%; border-radius: 6px; margin-top: 10px; }
.meta { margin-top: 10px; font-size: 0.9rem; color: #ccc; }

.owner-actions { display: flex; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #444; }
.btn-edit, .btn-delete { flex: 1; padding: 8px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; }
.btn-edit { background: #333; color: white; border: 1px solid #555; }
.btn-edit:hover { background: #444; }
.btn-delete { background: rgba(255, 77, 77, 0.1); color: var(--danger); border: 1px solid transparent; }
.btn-delete:hover { background: var(--danger); color: white; }

@media (max-width: 768px) {
  .map-overlay { bottom: 0; right: 0; left: 0; width: auto; border-radius: 12px 12px 0 0; }
}
</style>
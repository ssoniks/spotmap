<script setup>
import { ref, watch, computed } from 'vue'; // Added computed
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet"; // Removed LPopup (unused)
import "leaflet/dist/leaflet.css";
import { useAuth } from '../composables/useAuth'; // Import Auth

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

const props = defineProps(['spots', 'selectedSpot']);
const emit = defineEmits(['marker-click', 'close-details', 'edit-spot', 'delete-spot']); // Added emits

const auth = useAuth(); // Init Auth
const zoom = ref(13);
const center = ref([42.6977, 23.3219]);

// Check if current user created this spot
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
</script>

<template>
  <div class="map-wrapper">
    <LMap 
      ref="map"
      v-model:zoom="zoom" 
      v-model:center="center" 
      :use-global-leaflet="false"
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
.map-wrapper { height: 100vh; width: 100%; position: relative; }

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

.close-btn { position: absolute; top: 10px; right: 10px; background: transparent; color: #aaa; font-size: 1.2rem; }
.badge { background: var(--accent); color: black; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
.spot-image img { width: 100%; border-radius: 6px; margin-top: 10px; }
.meta { margin-top: 10px; font-size: 0.9rem; color: #ccc; }

/* Owner Actions Styling */
.owner-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #444;
}

.btn-edit, .btn-delete {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
}

.btn-edit {
  background: #333;
  color: white;
  border: 1px solid #555;
}
.btn-edit:hover { background: #444; }

.btn-delete {
  background: rgba(255, 77, 77, 0.1);
  color: var(--danger);
  border: 1px solid transparent;
}
.btn-delete:hover {
  background: var(--danger);
  color: white;
}

@media (max-width: 768px) {
  .map-overlay { bottom: 0; right: 0; left: 0; width: auto; border-radius: 12px 12px 0 0; }
}
</style>
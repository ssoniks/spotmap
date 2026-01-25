<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from './composables/useAuth';
import { useSpots } from './composables/useSpots'; 

import SpotSidebar from './components/SpotSidebar.vue';
import SpotMap from './components/SpotMap.vue';
import SpotForm from './components/SpotForm.vue';
import AuthModal from './components/AuthModal.vue';

const auth = useAuth();
const { spots, getAllSpots, getSpotDetails, deleteSpot } = useSpots(); 

const selectedSpot = ref(null);
const spotToEdit = ref(null);
const showAddModal = ref(false);
const showAuthModal = ref(false);

// New State for Location Picking
const isPickingLocation = ref(false);
const newSpotLocation = ref(null);

const handleSelectSpot = async (spot) => {
  if (isPickingLocation.value) return; // Don't select spots while picking location
  selectedSpot.value = spot;
  const fullDetails = await getSpotDetails(spot.id);
  if (fullDetails) {
    selectedSpot.value = fullDetails;
  }
};

const handleDelete = async (spot) => {
  if (confirm(`Are you sure you want to delete "${spot.name}"? This cannot be undone.`)) {
    const success = await deleteSpot(spot.id);
    if (success) {
      selectedSpot.value = null; 
    } else {
      alert("Failed to delete spot.");
    }
  }
};

const handleEdit = (spot) => {
  spotToEdit.value = spot;
  showAddModal.value = true;
};

// --- NEW FLOW: Add Spot ---
const startAddSpot = () => {
  // 1. Enter Picking Mode
  isPickingLocation.value = true;
  selectedSpot.value = null; // Close any open details
};

const handleMapClick = (latlng) => {
  if (isPickingLocation.value) {
    // 2. Capture Location & Open Form
    newSpotLocation.value = latlng;
    isPickingLocation.value = false; // Exit mode
    showAddModal.value = true;
  }
};

const cancelPick = () => {
  isPickingLocation.value = false;
};

const closeAddModal = () => {
  showAddModal.value = false;
  spotToEdit.value = null;
  newSpotLocation.value = null;
};

onMounted(async () => {
  auth.checkAuth();
  await getAllSpots(); 
});
</script>

<template>
  <div class="app-container">
    <SpotSidebar 
      :spots="spots" 
      @select-spot="handleSelectSpot"
      @open-add="startAddSpot"
      @open-auth="showAuthModal = true"
    />
    
    <main class="map-section">
      <div v-if="isPickingLocation" class="pick-banner">
        <span>📍 Click on the map to set the spot location</span>
        <button @click="cancelPick">Cancel</button>
      </div>

      <SpotMap 
        :spots="spots" 
        :selectedSpot="selectedSpot"
        :isPickingLocation="isPickingLocation"
        @marker-click="handleSelectSpot"
        @map-click="handleMapClick" 
        @close-details="selectedSpot = null"
        @delete-spot="handleDelete"
        @edit-spot="handleEdit"
      />
    </main>

    <SpotForm 
      v-if="showAddModal" 
      :spotToEdit="spotToEdit"
      :initialLocation="newSpotLocation"
      @close="closeAddModal" 
    />
    
    <AuthModal 
      v-if="showAuthModal" 
      @close="showAuthModal = false" 
    />
  </div>
</template>

<style>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.map-section {
  flex-grow: 1;
  position: relative;
  z-index: 1;
}

/* New Banner Style */
.pick-banner {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: black;
  padding: 12px 24px;
  border-radius: 30px;
  font-weight: bold;
  z-index: 2000;
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  display: flex;
  gap: 15px;
  align-items: center;
}

.pick-banner button {
  background: black;
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
}
</style>
<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from './composables/useAuth';
import { useSpots } from './composables/useSpots'; 

import SpotSidebar from './components/SpotSidebar.vue';
import SpotMap from './components/SpotMap.vue';
import SpotForm from './components/SpotForm.vue';
import AuthModal from './components/AuthModal.vue';

const auth = useAuth();
// Destructure deleteSpot here
const { spots, getAllSpots, getSpotDetails, deleteSpot } = useSpots(); 

const selectedSpot = ref(null);
const showAddModal = ref(false);
const showAuthModal = ref(false);

const handleSelectSpot = async (spot) => {
  // 1. Set summary immediately (so map moves)
  selectedSpot.value = spot;

  // 2. Fetch full details (description, tips, etc.)
  const fullDetails = await getSpotDetails(spot.id);
  
  // 3. Update if successful
  if (fullDetails) {
    selectedSpot.value = fullDetails;
  }
};

// --- NEW: Handle Delete ---
const handleDelete = async (spot) => {
  if (confirm(`Are you sure you want to delete "${spot.name}"? This cannot be undone.`)) {
    const success = await deleteSpot(spot.id);
    if (success) {
      selectedSpot.value = null; // Close the popup after deletion
    } else {
      alert("Failed to delete spot.");
    }
  }
};

// --- NEW: Handle Edit (Placeholder for now) ---
const handleEdit = (spot) => {
  console.log("Edit requested for:", spot);
  alert("Edit functionality coming next!");
  // We will wire this to SpotForm in the next step
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
      @open-add="showAddModal = true"
      @open-auth="showAuthModal = true"
    />
    
    <main class="map-section">
      <SpotMap 
        :spots="spots" 
        :selectedSpot="selectedSpot"
        @marker-click="handleSelectSpot" 
        @close-details="selectedSpot = null"
        @delete-spot="handleDelete"
        @edit-spot="handleEdit"
      />
    </main>

    <SpotForm 
      v-if="showAddModal" 
      @close="showAddModal = false" 
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
</style>
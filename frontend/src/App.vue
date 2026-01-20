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
const spotToEdit = ref(null); // NEW: Track which spot to edit
const showAddModal = ref(false);
const showAuthModal = ref(false);

const handleSelectSpot = async (spot) => {
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

// --- FIX: Implement Handle Edit ---
const handleEdit = (spot) => {
  spotToEdit.value = spot; // Set the spot to edit
  showAddModal.value = true; // Reuse the same modal
};

const closeAddModal = () => {
  showAddModal.value = false;
  spotToEdit.value = null; // Reset when closing so "Add New" is clean next time
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
      :spotToEdit="spotToEdit"
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
</style>
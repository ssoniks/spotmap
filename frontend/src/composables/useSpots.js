// src/composables/useSpots.js
import { ref } from 'vue';
import { spotApi } from '../services/api';

const spots = ref([]);

export function useSpots() {
  const loading = ref(false);
  const error = ref(null);

  // Get List (Summary only)
  const getAllSpots = async () => {
    loading.value = true;
    try {
      const res = await spotApi.get('/spots');
      spots.value = res.data;
    } catch (err) {
      console.error(err);
      error.value = 'Could not load spots.';
    } finally {
      loading.value = false;
    }
  };

  // NEW: Get Full Details
  const getSpotDetails = async (id) => {
    try {
      console.log(`Fetching details for Spot ID: ${id}...`);
      const res = await spotApi.get(`/spots/${id}`);
      
      // LOG: Check if the backend is sending the image_url
      console.log("Spot Details Received:", res.data);
      
      return res.data;
    } catch (err) {
      console.error("Failed to load details", err);
      return null;
    }
  };

  const createSpot = async (spotData) => {
    loading.value = true;
    error.value = null;
    try {
      const payload = {
        ...spotData,
        latitude: parseFloat(spotData.latitude),
        longitude: parseFloat(spotData.longitude)
      };
      
      const res = await spotApi.post('/spots', payload);
      
      // Refresh list
      await getAllSpots(); 
      
      return res.data; 
    } catch (err) {
      console.error(err);
      error.value = 'Failed to create spot.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteSpot = async (id) => {
    loading.value = true;
    try {
      await spotApi.delete(`/spots/${id}`);
      // Remove from local list immediately so UI updates fast
      spots.value = spots.value.filter(s => s.id !== id);
      return true;
    } catch (err) {
      console.error("Failed to delete spot", err);
      error.value = "Failed to delete spot.";
      return false;
    } finally {
      loading.value = false;
    }
  };

  return { spots, loading, error, getAllSpots, getSpotDetails, createSpot, deleteSpot };
}
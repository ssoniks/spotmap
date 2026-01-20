<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card">
      <h2>Add New Spot</h2>
      
      <form @submit.prevent="handleSubmit">
        <label>Spot Name</label>
        <input v-model="form.name" required class="input-field" placeholder="e.g. Plaza Ledge" />

        <div class="row">
          <div class="col">
            <label>Lat</label>
            <input v-model="form.latitude" required type="number" step="any" class="input-field" />
          </div>
          <div class="col">
            <label>Lng</label>
            <input v-model="form.longitude" required type="number" step="any" class="input-field" />
          </div>
        </div>

        <label>Type</label>
        <select v-model="form.spot_type" class="input-field">
          <option>Street</option>
          <option>Park</option>
          <option>DIY</option>
          <option>Stairs</option>
        </select>

        <label>Description</label>
        <textarea v-model="form.description" class="input-field"></textarea>
        
        <label>Pro Tips</label>
        <input v-model="form.tips" class="input-field" placeholder="Best time to skate, security, etc." />

        <label>Photo</label>
        <input type="file" @change="handleFile" class="input-field" accept="image/*" />

        <button type="submit" class="btn-primary full-width" :disabled="loading || uploading">
          {{ uploading ? 'Uploading Image...' : (loading ? 'Creating Spot...' : 'Create Spot') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { mediaApi, spotApi } from '../services/api';
import { useSpots } from '../composables/useSpots';

const emit = defineEmits(['close']);
const { createSpot, loading } = useSpots();

const uploading = ref(false);
const selectedFile = ref(null);

const form = reactive({
  name: '',
  latitude: '',
  longitude: '',
  spot_type: 'Street',
  description: '',
  tips: ''
});

const handleFile = (e) => {
  selectedFile.value = e.target.files[0];
};

const handleSubmit = async () => {
  if (loading.value || uploading.value) return;

  // 1. Create the Spot
  console.log("Step 1: Creating Spot...");
  const newSpot = await createSpot(form);

  if (!newSpot) {
    alert("Error creating spot. Please try again.");
    return;
  }
  console.log("Step 1 Success: Spot Created with ID:", newSpot.id);

  // 2. Upload Image
  if (selectedFile.value && newSpot.id) { 
    uploading.value = true;
    try {
      console.log("Step 2: Uploading Image...");
      const formData = new FormData();
      formData.append('image', selectedFile.value);
      formData.append('spotId', newSpot.id);

      const mediaRes = await mediaApi.post('/media/upload', formData);
      
      // LOG: Check what the Media Service actually returned
      console.log("Step 2 Success: Media API Response:", mediaRes.data);
      
      const imageUrl = mediaRes.data.url; 

      // 3. Update Spot Service with URL
      if (imageUrl) {
        console.log("Step 3: Updating Spot with Image URL:", imageUrl);
        
        await spotApi.put(`/spots/${newSpot.id}`, { 
           ...newSpot, 
           image_url: imageUrl 
        });
        
        console.log("Step 3 Success: Spot Updated!");
      } else {
        console.warn("Step 3 Skipped: No image URL found in Media Response.");
      }
      
    } catch (err) {
      console.error("Image upload failed", err);
      alert("Spot created, but image upload failed.");
    } finally {
      uploading.value = false;
    }
  }

  emit('close');
};
</script>

<style scoped>
/* Same styles as before */
.modal-backdrop {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.8); z-index: 2000;
  display: flex; align-items: center; justify-content: center;
}
.modal-card {
  background: var(--bg-card); padding: 30px; border-radius: 12px;
  width: 90%; max-width: 400px; border: 1px solid #444;
}
.row { display: flex; gap: 10px; }
.col { flex: 1; }
h2 { margin-bottom: 20px; color: var(--accent); }
</style>
<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card">
      <h2>{{ isEditMode ? 'Edit Spot' : 'Add New Spot' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <label>Spot Name</label>
        <input v-model="form.name" required class="input-field" placeholder="e.g. Plaza Ledge" />

        <label>Type</label>
        <select v-model="form.spot_type" class="input-field">
          <option>Ledge</option>
          <option>Park</option>
          <option>Rail</option>
          <option>DIY</option>
          <option>Stairs</option>
          <option>Polejam</option>
          <option>Gap</option>
          <option>Slappy</option>
          <option>Custom</option>
        </select>

        <label>Description</label>
        <textarea v-model="form.description" class="input-field"></textarea>
        
        <label>Pro Tips</label>
        <input v-model="form.tips" class="input-field" placeholder="Best time to skate, security, etc." />

        <label>Photo {{ isEditMode ? '(Leave empty to keep current)' : '' }}</label>
        <input type="file" @change="handleFile" class="input-field" accept="image/*" />

        <button type="submit" class="btn-primary full-width" :disabled="loading || uploading">
          {{ uploading ? 'Uploading Image...' : (loading ? 'Saving...' : (isEditMode ? 'Update Spot' : 'Create Spot')) }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { mediaApi, spotApi } from '../services/api';
import { useSpots } from '../composables/useSpots';
import { useAuth } from '../composables/useAuth'; // <--- 1. Import Auth

const props = defineProps(['spotToEdit', 'initialLocation']);
const emit = defineEmits(['close']);

const { createSpot, updateSpot, loading } = useSpots();
const auth = useAuth(); // <--- 2. Initialize Auth
const uploading = ref(false);
const selectedFile = ref(null);

const isEditMode = computed(() => !!props.spotToEdit);

const form = reactive({
  name: '',
  latitude: '',
  longitude: '',
  spot_type: 'Street',
  description: '',
  tips: ''
});

// Pre-fill form
onMounted(() => {
  if (isEditMode.value) {
    // Edit Mode: Fill from existing spot
    form.name = props.spotToEdit.name;
    form.latitude = props.spotToEdit.latitude;
    form.longitude = props.spotToEdit.longitude;
    form.spot_type = props.spotToEdit.spot_type;
    form.description = props.spotToEdit.description;
    form.tips = props.spotToEdit.tips;
  } else if (props.initialLocation) {
    // Add Mode: Fill from Map Click
    form.latitude = props.initialLocation.lat;
    form.longitude = props.initialLocation.lng;
  }
});

const handleFile = (e) => {
  selectedFile.value = e.target.files[0];
};

const handleSubmit = async () => {
  if (loading.value || uploading.value) return;

  if (isEditMode.value) {
    // --- EDIT MODE (Unchanged) ---
    let finalImageUrl = props.spotToEdit.image_url;
    if (selectedFile.value) {
      uploading.value = true;
      try {
        const formData = new FormData();
        formData.append('image', selectedFile.value);
        formData.append('spotId', props.spotToEdit.id);
        const mediaRes = await mediaApi.post('/media/upload', formData);
        finalImageUrl = mediaRes.data.url;
      } catch (err) {
        console.error("Image upload failed", err);
        alert("Failed to upload new image");
        uploading.value = false;
        return;
      } finally {
        uploading.value = false;
      }
    }
    const updated = await updateSpot(props.spotToEdit.id, { ...form, image_url: finalImageUrl });
    if (updated) emit('close');
    else alert("Failed to update spot");

  } else {
    // --- CREATE MODE (Updated) ---
    
    // 3. Prepare payload with invisible username
    const payload = {
      ...form,
      creator_username: auth.user.value?.username || 'Skater'
    };

    const newSpot = await createSpot(payload);
    
    if (!newSpot) {
      alert("Error creating spot. Please try again.");
      return;
    }
    
    if (selectedFile.value && newSpot.id) { 
      uploading.value = true;
      try {
        const formData = new FormData();
        formData.append('image', selectedFile.value);
        formData.append('spotId', newSpot.id);
        const mediaRes = await mediaApi.post('/media/upload', formData);
        const imageUrl = mediaRes.data.url; 
        if (imageUrl) {
          await spotApi.put(`/spots/${newSpot.id}`, { ...newSpot, image_url: imageUrl });
        }
      } catch (err) {
        console.error("Image upload failed", err);
        alert("Spot created, but image upload failed.");
      } finally {
        uploading.value = false;
      }
    }
    await auth.checkAuth(); 

    emit('close');
  }
};
</script>

<style scoped>
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000; display: flex; align-items: center; justify-content: center; }
.modal-card { background: var(--bg-card); padding: 30px; border-radius: 12px; width: 90%; max-width: 400px; border: 1px solid #444; }
.row { display: flex; gap: 10px; }
.col { flex: 1; }
h2 { margin-bottom: 20px; color: var(--accent); }
</style>
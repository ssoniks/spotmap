<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card">
      <h2>{{ isRegister ? 'Join the Crew' : 'Welcome Back' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div v-if="isRegister" class="form-group">
          <label>Username</label>
          <input v-model="form.username" class="input-field" required placeholder="Name" />
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" class="input-field" required placeholder="email@example.com" />
        </div>
        
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" class="input-field" required placeholder="••••••" />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="btn-primary full-width">
          {{ isRegister ? 'Register' : 'Login' }}
        </button>
      </form>

      <p class="switch-mode">
        {{ isRegister ? 'Already have an account?' : 'Need an account?' }}
        <span @click="isRegister = !isRegister">
          {{ isRegister ? 'Login' : 'Register' }}
        </span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const emit = defineEmits(['close']);
const auth = useAuth();

const isRegister = ref(false);
const error = ref('');
const form = reactive({ username: '', email: '', password: '' });

const handleSubmit = async () => {
  error.value = '';
  let success;
  
  if (isRegister.value) {
    success = await auth.register(form.username, form.email, form.password);
  } else {
    success = await auth.login(form.email, form.password);
  }

  if (success) {
    emit('close');
  } else {
    error.value = 'Authentication failed. Check credentials.';
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%;
  background: rgba(0,0,0,0.85); /* Slightly darker backdrop */
  z-index: 2000;
  display: flex; 
  align-items: center; 
  justify-content: center;
  backdrop-filter: blur(5px); /* Adds a modern blur effect */
}

.modal-card {
  background: var(--bg-card); 
  padding: 40px; /* More padding for breathing room */
  border-radius: 16px;
  width: 90%; 
  max-width: 380px; 
  border: 1px solid #444;
  color: white; /* FIX: Explicitly set text color to white */
  box-shadow: 0 20px 50px rgba(0,0,0,0.6);
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: var(--accent);
  font-size: 1.8rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px; /* Consistent spacing between inputs */
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 500;
  margin-left: 2px;
}

.input-field {
  width: 100%;
  padding: 14px;
  background: #2a2a2a;
  border: 1px solid #444;
  color: white;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--accent);
  background: #333;
  box-shadow: 0 0 0 3px rgba(0, 210, 255, 0.1);
}

.btn-primary {
  margin-top: 10px;
  padding: 14px;
  font-size: 1rem;
  border-radius: 8px;
}

.switch-mode { 
  margin-top: 25px; 
  font-size: 0.95rem; 
  text-align: center; 
  color: #aaa; 
}

.switch-mode span { 
  color: var(--accent); 
  cursor: pointer; 
  font-weight: bold; 
  margin-left: 5px;
}

.switch-mode span:hover {
  text-decoration: underline;
}

.error { 
  color: var(--danger); 
  font-size: 0.9rem; 
  text-align: center;
  background: rgba(255, 77, 77, 0.1);
  padding: 10px;
  border-radius: 6px;
}
</style>
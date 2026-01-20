<template>
  <aside class="sidebar" :class="{ 'is-open': isOpen }">
    <div class="sidebar-header">
      <h1 class="brand-title">SpotFinder<span class="dot">.</span></h1>
      
      <div v-if="auth.isAuthenticated.value" class="user-badge">
        <div class="user-details">
          <span class="username">@{{ auth.user.value?.username }}</span>
          <button @click="auth.logout()" class="btn-logout">Logout</button>
        </div>
      </div>
      
      <button v-else @click="$emit('open-auth')" class="btn-login">
        Login / Join
      </button>
    </div>

    <div class="controls-area">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          placeholder="Search spots..." 
          class="search-input"
        />
      </div>
      
      <button 
        v-if="auth.isAuthenticated.value" 
        @click="$emit('open-add')" 
        class="btn-add-spot"
      >
        <span class="plus">+</span> Add New Spot
      </button>
    </div>

    <div class="spot-list custom-scroll">
      <div 
        v-for="spot in filteredSpots" 
        :key="spot.id" 
        class="spot-card"
        @click="$emit('select-spot', spot)"
      >
        <div class="spot-info">
          <h3>{{ spot.name }}</h3>
          <span class="spot-tag">{{ spot.spot_type }}</span>
        </div>
        <div class="card-action">
          <span class="arrow">→</span>
        </div>
      </div>
      
      <div v-if="filteredSpots.length === 0" class="empty-state">
        <p>No spots found matching your search.</p>
      </div>
    </div>
  </aside>
  
  <button class="mobile-toggle" @click="isOpen = !isOpen">
    {{ isOpen ? '✕' : '☰' }}
  </button>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuth } from '../composables/useAuth';

const props = defineProps(['spots']);
const emit = defineEmits(['select-spot', 'open-add', 'open-auth']);
const auth = useAuth();

const isOpen = ref(true); // Default open on desktop
const searchQuery = ref('');

const filteredSpots = computed(() => {
  if (!searchQuery.value) return props.spots;
  return props.spots.filter(s => 
    s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    s.spot_type.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});
</script>

<style scoped>
/* --- Layout & Container --- */
.sidebar {
  width: 360px;
  background: var(--bg-card);
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #333;
  box-shadow: 4px 0 15px rgba(0,0,0,0.3);
  z-index: 1000;
  position: absolute;
  left: 0;
  top: 0;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.is-open { transform: translateX(0); }

@media (min-width: 768px) {
  .sidebar { position: relative; transform: none; }
  .mobile-toggle { display: none; }
}

/* --- Header --- */
.sidebar-header {
  padding: 25px 20px;
  border-bottom: 1px solid #2a2a2a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 30, 30, 0.5);
}

.brand-title {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -1px;
  color: white;
}

.brand-title .dot { color: var(--accent); }

/* --- User Badge --- */
.user-badge {
  text-align: right;
}

.username {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.btn-logout {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: none;
  padding: 0;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: all 0.2s;
}
.btn-logout:hover { color: var(--danger); text-decoration-color: var(--danger); }

.btn-login {
  background: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-login:hover { background: var(--accent); color: black; }

/* --- Controls Area --- */
.controls-area {
  padding: 20px;
  background: var(--bg-card);
}

.search-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  opacity: 0.5;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 38px;
  background: #121212;
  border: 1px solid #333;
  color: white;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}
.search-input:focus { outline: none; border-color: var(--accent); }

.btn-add-spot {
  width: 100%;
  background: var(--accent);
  color: #000;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.2s, background 0.2s;
}
.btn-add-spot:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 210, 255, 0.2);
}
.plus { font-size: 1.2rem; line-height: 0; }

/* --- Spot List --- */
.spot-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
}

.spot-card {
  background: var(--bg-panel);
  padding: 16px;
  border-radius: 10px;
  margin-bottom: 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.spot-card:hover {
  border-color: var(--accent);
  background: #2a2a2a;
  transform: translateX(4px);
}

.spot-info h3 {
  font-size: 1rem;
  margin-bottom: 4px;
  color: white;
}

.spot-tag {
  font-size: 0.7rem;
  background: #333;
  color: #ccc;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.card-action {
  width: 32px;
  height: 32px;
  background: #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
}

.spot-card:hover .card-action {
  background: var(--accent);
  color: black;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  margin-top: 40px;
  font-style: italic;
}

/* --- Mobile Toggle --- */
.mobile-toggle {
  position: fixed;
  bottom: 25px;
  left: 25px;
  z-index: 2000;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--accent);
  color: black;
  font-weight: bold;
  font-size: 1.4rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}
.mobile-toggle:active { transform: scale(0.9); }

/* --- Custom Scrollbar --- */
.custom-scroll::-webkit-scrollbar { width: 6px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background: #444; }
</style>
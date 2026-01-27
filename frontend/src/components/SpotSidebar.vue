<template>
  <aside class="sidebar" :class="{ 'is-open': isOpen }">
    
    <div v-if="viewMode === 'main'" class="sidebar-header">
      <h1 class="brand-title">SpotFinder<span class="dot">.</span></h1>
      
      <div v-if="auth.isAuthenticated.value" class="user-badge">
        
        <NotificationBell />

        <div class="user-details">
          <span class="username clickable" @click="enterProfileMode(auth.user.value)">
            @{{ auth.user.value?.username }}
          </span>
          <button @click="auth.logout()" class="btn-logout">Logout</button>
        </div>
      </div>
      
      <button v-else @click="$emit('open-auth')" class="btn-login">
        Login / Join
      </button>
    </div>

    <div v-else class="sidebar-header profile-header">
      <button class="btn-back" @click="exitProfileMode">← Back</button>
      
      <div class="profile-info">
        <h2 class="profile-name">@{{ profileUser?.username }}</h2>
        <div v-if="profileUser?.status" class="profile-stats">
          <span class="stat-badge">{{ profileUser.status }}</span>
          
          <span v-if="isViewingSelf" class="stat-points">
            {{ profileUser.points || 0 }} pts
          </span>
        </div>
        <div v-else class="profile-stats">
          <span class="stat-loading">Loading status...</span>
        </div>
      </div>
    </div>

    <div class="controls-area">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          :placeholder="viewMode === 'profile' ? `Search ${profileUser?.username}'s spots...` : 'Search spots...'" 
          class="search-input"
        />
      </div>
      
      <button 
        v-if="auth.isAuthenticated.value && (viewMode === 'main' || isViewingSelf)" 
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
        
        <div class="spot-meta">
          <span class="created-by" @click.stop="enterProfileMode({ username: spot.creator_username })">
            by @{{ spot.creator_username || 'Unknown' }}
          </span>
        </div>

        <div class="card-action">
          <span class="arrow">→</span>
        </div>
      </div>
      
      <div v-if="filteredSpots.length === 0" class="empty-state">
        <p v-if="viewMode === 'profile'">{{ profileUser?.username }} hasn't posted any spots yet.</p>
        <p v-else>No spots found matching your search.</p>
      </div>
    </div>
  </aside>
  
  <button class="sidebar-toggle" :class="{ 'is-open': isOpen }" @click="isOpen = !isOpen">
    {{ isOpen ? '◀' : '▶' }}
  </button>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios'; // Import Axios
import { useAuth } from '../composables/useAuth';
import NotificationBell from './NotificationBell.vue';

const props = defineProps(['spots']);
const emit = defineEmits(['select-spot', 'open-add', 'open-auth']);
const auth = useAuth();

const isOpen = ref(true); 
const searchQuery = ref('');

// --- Profile Mode Logic ---
const viewMode = ref('main'); 
const profileUser = ref(null);

const isViewingSelf = computed(() => {
  return auth.user.value && profileUser.value && auth.user.value.username === profileUser.value.username;
});

const enterProfileMode = async (user) => {
  if (!user || !user.username) return;
  
  viewMode.value = 'profile';
  searchQuery.value = '';

  // 1. If clicking SELF, use local data (has points + status)
  if (auth.user.value && user.username === auth.user.value.username) {
    profileUser.value = auth.user.value;
  } else {
    // 2. If clicking OTHERS, set partial data first...
    profileUser.value = { username: user.username }; 
    
    // ...then fetch public status from backend
    try {
      // Ensure this URL matches your Auth Service port (4001)
      const res = await axios.get(`http://localhost:4001/auth/users/${user.username}`);
      profileUser.value = res.data; // Updates with { username, status }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      profileUser.value = { username: user.username, status: 'Unknown' };
    }
  }
};

const exitProfileMode = () => {
  viewMode.value = 'main';
  profileUser.value = null;
  searchQuery.value = '';
};

defineExpose({
  enterProfileMode
});

// --- Filtering Logic ---
const filteredSpots = computed(() => {
  let spots = props.spots;

  if (viewMode.value === 'profile' && profileUser.value) {
    spots = spots.filter(s => s.creator_username === profileUser.value.username);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    spots = spots.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.spot_type.toLowerCase().includes(query)
    );
  }

  return spots;
});
</script>

<style scoped>
/* --- Global & Layout --- */
* { box-sizing: border-box; }

.sidebar {
  background: var(--bg-card);
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #333;
  box-shadow: 4px 0 15px rgba(0,0,0,0.3);
  z-index: 1000;
  position: absolute; top: 0; left: 0; width: 300px;
  transform: translateX(-100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar.is-open { transform: translateX(0); }

@media (min-width: 768px) {
  .sidebar { position: relative; transform: none; width: 0; opacity: 0; overflow: hidden; }
  .sidebar.is-open { width: 360px; opacity: 1; }
}

/* --- Header Styles --- */
.sidebar-header {
  padding: 25px 20px;
  border-bottom: 1px solid #2a2a2a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 30, 30, 0.5);
  min-width: 360px;
}

/* --- FIX: Profile Specific Header --- */
.profile-header {
  background: #1a1a1a;
  /* Changed from flex-start to space-between to push items to edges */
  justify-content: space-between; 
  gap: 0; /* Remove gap since we are spacing between */
}

.btn-back {
  background: none; border: none; color: var(--text-muted);
  font-size: 0.9rem; cursor: pointer; padding: 0;
  transition: color 0.2s;
}
.btn-back:hover { color: white; }

.profile-info { 
  display: flex; 
  flex-direction: column; 
  /* FIX: Align text to the right so it looks like the main user badge */
  text-align: right; 
  align-items: flex-end; 
}

.profile-name { font-size: 1.1rem; color: white; margin: 0; }
.profile-stats { font-size: 0.8rem; margin-top: 4px; display: flex; gap: 8px; }
.stat-badge { color: var(--accent); font-weight: bold; text-transform: uppercase; }
.stat-points { color: #888; }
.stat-loading { font-size: 0.75rem; color: #666; font-style: italic; }

/* --- Main Header Elements --- */
.brand-title { font-size: 1.5rem; font-weight: 900; letter-spacing: -1px; color: white; }
.brand-title .dot { color: var(--accent); }

.user-badge { text-align: right; display: flex; align-items: center; }
.username { display: block; font-size: 0.85rem; font-weight: 600; color: #fff; margin-bottom: 4px; }
.username.clickable { cursor: pointer; text-decoration: underline; text-decoration-color: transparent; transition: all 0.2s; }
.username.clickable:hover { color: var(--accent); text-decoration-color: var(--accent); }

.btn-logout {
  font-size: 0.75rem; color: var(--text-muted); background: none; padding: 0;
  text-decoration: underline; text-decoration-color: transparent; transition: all 0.2s;
}
.btn-logout:hover { color: var(--danger); text-decoration-color: var(--danger); }

.btn-login {
  background: transparent; border: 1px solid var(--accent); color: var(--accent);
  padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; transition: all 0.2s;
}
.btn-login:hover { background: var(--accent); color: black; }

/* --- Controls --- */
.controls-area { padding: 20px; background: var(--bg-card); min-width: 360px; }
.search-wrapper { position: relative; margin-bottom: 12px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 0.9rem; opacity: 0.5; }
.search-input {
  width: 100%; padding: 12px 12px 12px 38px; background: #121212; border: 1px solid #333;
  color: white; border-radius: 8px; font-size: 0.95rem; transition: border-color 0.2s;
}
.search-input:focus { outline: none; border-color: var(--accent); }

.btn-add-spot {
  width: 100%; background: var(--accent); color: #000; border: none; padding: 12px;
  border-radius: 8px; font-weight: 700; font-size: 0.9rem; text-transform: uppercase;
  letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center;
  gap: 8px; transition: transform 0.2s, background 0.2s;
}
.btn-add-spot:hover { background: var(--accent-hover); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 210, 255, 0.2); }
.plus { font-size: 1.2rem; line-height: 0; }

/* --- Spot List --- */
.spot-list { flex: 1; overflow-y: auto; padding: 0 20px 20px; min-width: 360px; }
.spot-card {
  background: var(--bg-panel); padding: 16px; border-radius: 10px; margin-bottom: 12px;
  cursor: pointer; display: flex; flex-direction: column; 
  border: 1px solid transparent; transition: all 0.2s; position: relative;
}
.spot-card:hover { border-color: var(--accent); background: #2a2a2a; transform: translateX(4px); }

.spot-info { width: 100%; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.spot-info h3 { font-size: 1rem; margin: 0; color: white; }
.spot-tag {
  font-size: 0.7rem; background: #333; color: #ccc; padding: 4px 8px;
  border-radius: 4px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;
}

.spot-meta { width: 100%; font-size: 0.75rem; color: #666; display: flex; justify-content: space-between; align-items: center; }
.created-by { transition: color 0.2s; }
.created-by:hover { color: var(--accent); text-decoration: underline; }

.card-action {
  position: absolute; right: 16px; bottom: 16px;
  width: 24px; height: 24px; background: #1a1a1a; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; color: #666; transition: all 0.2s;
}
.spot-card:hover .card-action { background: var(--accent); color: black; }

.empty-state { text-align: center; color: var(--text-muted); margin-top: 40px; font-style: italic; }

.custom-scroll::-webkit-scrollbar { width: 6px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background: #444; }

/* Toggle Button */
.sidebar-toggle {
  position: fixed; bottom: 25px; left: 20px; z-index: 2000; width: 50px; height: 50px;
  border-radius: 50%; background: var(--accent); color: black; font-weight: bold;
  font-size: 1.2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.5); display: flex;
  align-items: center; justify-content: center; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}
.sidebar-toggle:hover { transform: scale(1.05); }
.sidebar-toggle:active { transform: scale(0.95); }

@media (min-width: 768px) {
  .sidebar-toggle.is-open { left: 380px; }
}
</style>
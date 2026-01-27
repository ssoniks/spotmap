<template>
    <div class="notification-container">
      <button class="bell-btn" @click.stop="toggleDropdown">
        <span class="bell-icon">🔔</span>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </button>
  
      <div v-if="isOpen" class="dropdown" @click.stop>
        <div class="dropdown-header">
          <h3>Notifications</h3>
          <button class="refresh-btn" @click="fetchNotifications">↻</button>
        </div>
  
        <div class="list custom-scroll">
          <div 
            v-for="n in notifications" 
            :key="n.id" 
            class="notification-item"
            :class="{ 'unread': !n.is_read }"
            @click="markAsRead(n)"
          >
            <div class="notif-icon">
              {{ n.type === 'reward' ? '🏆' : '💬' }}
            </div>
            <div class="notif-content">
              <p>{{ n.message }}</p>
              <span class="time">{{ new Date(n.created_at).toLocaleDateString() }}</span>
            </div>
            <div v-if="!n.is_read" class="dot"></div>
          </div>
  
          <div v-if="notifications.length === 0" class="empty">
            No notifications yet.
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, onUnmounted } from 'vue';
  import { useNotifications } from '../composables/useNotifications';
  
  const { 
    notifications, 
    unreadCount, 
    isOpen, 
    fetchNotifications, 
    markAsRead, 
    toggleDropdown 
  } = useNotifications();
  
  // Close dropdown if clicking outside
  const closeDropdown = () => isOpen.value = false;
  
  onMounted(() => {
    fetchNotifications();
    // Optional: Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    window.addEventListener('click', closeDropdown);
    
    onUnmounted(() => {
      clearInterval(interval);
      window.removeEventListener('click', closeDropdown);
    });
  });
  </script>
  
  <style scoped>
  .notification-container {
    position: relative;
    margin-right: 15px; /* Spacing from username */
  }
  
  .bell-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    position: relative;
    padding: 5px;
    transition: transform 0.2s;
  }
  .bell-btn:hover { transform: scale(1.1); }
  
  .badge {
    position: absolute;
    top: 0;
    right: 0;
    background: var(--danger);
    color: white;
    font-size: 0.7rem;
    font-weight: bold;
    height: 16px;
    min-width: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #1a1a1a;
  }
  
  /* Dropdown */
  .dropdown {
    position: absolute;
    top: 40px;
    right: -60px; /* Adjust alignment */
    width: 280px;
    max-height: 400px;
    background: #1e1e1e;
    border: 1px solid #444;
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.5);
    z-index: 2000;
    display: flex;
    flex-direction: column;
  }
  
  .dropdown-header {
    padding: 12px;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .dropdown-header h3 { margin: 0; font-size: 0.9rem; color: #fff; }
  .refresh-btn { background: none; border: none; color: #888; cursor: pointer; }
  
  .list { overflow-y: auto; flex: 1; }
  
  .notification-item {
    display: flex;
    padding: 12px;
    border-bottom: 1px solid #2a2a2a;
    cursor: pointer;
    transition: background 0.2s;
    align-items: flex-start;
    gap: 10px;
  }
  .notification-item:hover { background: #2a2a2a; }
  .notification-item.unread { background: rgba(0, 210, 255, 0.05); }
  
  .notif-content p { margin: 0; font-size: 0.85rem; color: #ddd; line-height: 1.3; }
  .time { font-size: 0.7rem; color: #666; margin-top: 4px; display: block; }
  
  .dot {
    width: 8px; height: 8px; background: var(--accent); border-radius: 50%;
    margin-top: 6px;
  }
  
  .empty { padding: 20px; text-align: center; color: #666; font-size: 0.85rem; }
  
  /* Scrollbar */
  .custom-scroll::-webkit-scrollbar { width: 4px; }
  .custom-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }
  </style>
import { ref, computed } from 'vue';
import axios from 'axios';
import { useAuth } from './useAuth';

const notifications = ref([]);
const isOpen = ref(false); // Controls the dropdown visibility

export function useNotifications() {
  const auth = useAuth();
  // Ensure this matches your Notification Service port
  const API_URL = 'http://localhost:4004'; 

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.is_read).length;
  });

  const fetchNotifications = async () => {
    if (!auth.user.value) return;
    
    try {
      const res = await axios.get(`${API_URL}/notifications/${auth.user.value.id}`);
      notifications.value = res.data;
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAsRead = async (notification) => {
    if (notification.is_read) return;

    try {
      // Optimistic update (update UI immediately)
      notification.is_read = true;
      
      await axios.put(`${API_URL}/notifications/${notification.id}/read`);
    } catch (err) {
      console.error("Failed to mark as read:", err);
      notification.is_read = false; // Revert if failed
    }
  };

  // Helper to toggle dropdown
  const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
      fetchNotifications(); // Refresh when opening
    }
  };

  return {
    notifications,
    unreadCount,
    isOpen,
    fetchNotifications,
    markAsRead,
    toggleDropdown
  };
}
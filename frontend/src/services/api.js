// Helper to sanitize URLs (strip trailing slashes)
const cleanUrl = (url) => (url ? url.trim().replace(/\/+$/, '') : '');

const rawNgrokUrl = cleanUrl(import.meta.env.VITE_NGROK_URL);
const rawApiUrl = cleanUrl(import.meta.env.VITE_API_URL);
const rawWsUrl = cleanUrl(import.meta.env.VITE_WS_URL);

const isBrowser = typeof window !== 'undefined';
const isLocalNetwork = isBrowser && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('172.')
);

// 1. Resolve REST API Base URL
// When on local/LAN network, use relative path ('') so Vite proxy handles HTTPS -> HTTP without mixed content issues
export const API_BASE_URL = (() => {
  if (isLocalNetwork) {
    return '';
  }
  return rawNgrokUrl || rawApiUrl || '';
})();

// 2. Resolve WebSocket Base URL
// When on local/LAN network, connect WSS directly to Vite dev server origin which proxies to Django Daphne
export const WS_BASE_URL = (() => {
  if (rawWsUrl) return rawWsUrl;
  if (isBrowser && isLocalNetwork) {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${window.location.host}`;
  }
  if (rawNgrokUrl) {
    return rawNgrokUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  }
  if (rawApiUrl) {
    return rawApiUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  }
  return '';
})();

console.log('[StudyArena Config] Mode:', isLocalNetwork ? 'Local/LAN Proxy' : 'Tunnel/Direct');
console.log('[StudyArena Config] API Base:', API_BASE_URL || '(relative proxy)');
console.log('[StudyArena Config] WS Base:', WS_BASE_URL);

export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

// Auth Token Helper
export const getAuthToken = () => {
  if (!isBrowser) return null;
  return localStorage.getItem('arena_auth_token');
};

export const setAuthToken = (token) => {
  if (!isBrowser) return;
  if (token) {
    localStorage.setItem('arena_auth_token', token);
  } else {
    localStorage.removeItem('arena_auth_token');
  }
};

// Common fetch headers (including ngrok splash screen bypass & auth token)
export const getHeaders = (extraHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bypasses ngrok free tier browser splash warning
    ...extraHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  return headers;
};

export const apiService = {
  // Auth API
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials or login failed.');
      }
      return data;
    } catch (error) {
      console.error('API Error login:', error);
      throw error;
    }
  },

  async logout() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('API Error logout:', error);
    }
  },

  async getCurrentUser() {
    try {
      const token = getAuthToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
        headers: getHeaders(),
      });
      if (!response.ok) {
        setAuthToken(null);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('API Error getCurrentUser:', error);
      return null;
    }
  },

  // Rooms API
  async createRoom(title = 'Arena Discussion Room', hostName = 'Host', maxParticipants = 6) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title,
          host_name: hostName,
          max_participants: maxParticipants,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create room: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Error createRoom:', error);
      throw error;
    }
  },

  async verifyRoom(code) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${code}/verify/`, {
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('API Error verifyRoom:', error);
      throw error;
    }
  },

  async getActiveRooms() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/active/`, {
        headers: getHeaders(),
      });
      if (!response.ok) return { isAuthenticated: false, created_rooms: [], joined_rooms: [], all_rooms: [] };
      return await response.json();
    } catch (error) {
      console.error('API Error getActiveRooms:', error);
      return { isAuthenticated: false, created_rooms: [], joined_rooms: [], all_rooms: [] };
    }
  },

  async deleteRoom(code) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${code}/delete/`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('API Error deleteRoom:', error);
      throw error;
    }
  },

  async clearAllRooms() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/clear-all/`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('API Error clearAllRooms:', error);
      throw error;
    }
  },

  async getQuestions(topic = 'All', query = '') {
    try {
      const params = new URLSearchParams();
      if (topic && topic !== 'All') params.append('topic', topic);
      if (query && query.trim()) params.append('q', query.trim());

      const url = `${API_BASE_URL}/api/rooms/questions/?${params.toString()}`;
      const response = await fetch(url, { headers: getHeaders() });
      if (!response.ok) return { topics: ['All'], questions: [], total: 0 };
      return await response.json();
    } catch (error) {
      console.error('API Error getQuestions:', error);
      return { topics: ['All'], questions: [], total: 0 };
    }
  },

  getWebSocketUrl(roomCode) {
    return `${WS_BASE_URL}/ws/rooms/${roomCode}/`;
  },
};

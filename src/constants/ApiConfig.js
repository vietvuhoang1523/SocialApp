// API Configuration
export const API_URL = 'https://api.socialapp.example.com';

// Socket URL for WebSocket connections
export const SOCKET_URL = 'wss://api.socialapp.example.com/ws';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh-token',
  
  // User
  USER_PROFILE: '/api/users/profile',
  USER_LOCATION: '/api/users/:id/location',
  USER_LOCATION_SETTINGS: '/api/users/:id/location-settings',
  USER_NEARBY: '/api/users/nearby',
  
  // Friends
  FRIENDS: '/api/friends',
  FRIEND_REQUESTS: '/api/friends/requests',
  
  // Posts
  POSTS: '/api/posts',
  POST_COMMENTS: '/api/posts/:id/comments',
  POST_LIKES: '/api/posts/:id/likes',
  
  // Messages
  CONVERSATIONS: '/api/conversations',
  MESSAGES: '/api/conversations/:id/messages',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  
  // Sports
  SPORTS_MATCHING: '/api/sports/matching',
  SPORTS_PROFILE: '/api/sports/profile',
};

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// API response codes
export const API_RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

// Utility function to replace path parameters
export const formatEndpoint = (endpoint, params = {}) => {
  let formattedEndpoint = endpoint;
  
  Object.keys(params).forEach(key => {
    formattedEndpoint = formattedEndpoint.replace(`:${key}`, params[key]);
  });
  
  return formattedEndpoint;
};

// Utility function to build full API URL
export const buildApiUrl = (endpoint, params = {}) => {
  return `${API_URL}${formatEndpoint(endpoint, params)}`;
};

export default {
  API_URL,
  SOCKET_URL,
  API_ENDPOINTS,
  REQUEST_TIMEOUT,
  API_RESPONSE_CODES,
  formatEndpoint,
  buildApiUrl
}; 
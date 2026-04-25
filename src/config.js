// src/config.js
// Central configuration file - ONE place to change API URLs

// DEV mode (when running in Expo Go / development)

//Vinayak
// const DEV_API_URL = 'http://192.168.1.65:5000/api';

//Abhay
const DEV_API_URL = 'http://192.168.1.51:5000/api';


// Production mode (when app is built)
const PROD_API_URL = 'https://your-production-server.com/api';

// Auto-detect based on __DEV__ flag
export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// Optional: Add other config values here
export const APP_NAME = 'Callyzer';
export const DEFAULT_PAGE_SIZE = 20;
export const SYNC_INTERVAL_MINUTES = 15;

export default { API_BASE_URL, APP_NAME, DEFAULT_PAGE_SIZE, SYNC_INTERVAL_MINUTES };
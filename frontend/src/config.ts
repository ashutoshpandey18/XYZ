// Application Configuration
// This file centralizes all configuration values

// API Configuration
export const getApiBaseUrl = (): string => {
  // Check for environment variable first (allows override)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In production (Vercel build), use Railway backend
  if (import.meta.env.PROD) {
    return 'https://xyz-production-b23d.up.railway.app';
  }

  // Local development
  return 'http://localhost:3000';
};

// Export the base URL for use throughout the app
export const API_BASE_URL = getApiBaseUrl();

// Helper to construct full asset URLs (for images, uploads, etc.)
export const getAssetUrl = (path: string): string => {
  if (!path) return '';
  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Otherwise, prepend the API base URL
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

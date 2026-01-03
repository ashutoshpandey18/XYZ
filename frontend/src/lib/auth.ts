import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
  sub?: string;
  userId?: string;
  email?: string;
  role: 'STUDENT' | 'ADMIN';
  iat: number;
  exp: number;
}

const TOKEN_KEY = 'auth_token';

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  // Also clear legacy key
  localStorage.removeItem('accessToken');
};

export const decodeToken = <T = JwtPayload>(token?: string): T | null => {
  try {
    const tokenToUse = token || getToken();
    if (!tokenToUse) return null;
    return jwtDecode<T>(tokenToUse);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const isTokenExpired = (token?: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;

  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

export const getUserRole = (): 'STUDENT' | 'ADMIN' | null => {
  const decoded = decodeToken();
  return decoded?.role || null;
};

export const getUserId = (): string | null => {
  const decoded = decodeToken();
  // Support both userId and sub (for backward compatibility)
  return decoded?.userId || decoded?.sub || null;
};

/**
 * Get user email from token
 */
export const getUserEmail = (): string | null => {
  const decoded = decodeToken();
  return decoded?.email || null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
};

/**
 * Check if user is admin
 */
export const isAdmin = (): boolean => {
  return getUserRole() === 'ADMIN';
};

/**
 * Check if user is student
 */
export const isStudent = (): boolean => {
  return getUserRole() === 'STUDENT';
};

export const logout = (): void => {
  clearToken();
  // Clear all React Query cache
  const role = getUserRole();

  // Redirect based on role
  if (role === 'ADMIN') {
    window.location.href = '/login';
  } else {
    window.location.href = '/login';
  }
};

/**
 * Get redirect path based on role
 */
export const getRedirectPath = (): string => {
  const role = getUserRole();
  if (role === 'ADMIN') return '/admin';
  if (role === 'STUDENT') return '/dashboard';
  return '/login';
};

interface DecodedToken {
  sub: string;
  role: 'STUDENT' | 'ADMIN';
  iat: number;
  exp: number;
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const getUserRole = (): 'STUDENT' | 'ADMIN' | null => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  const decoded = decodeToken(token);
  return decoded?.role || null;
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;

  return decoded.exp * 1000 < Date.now();
};

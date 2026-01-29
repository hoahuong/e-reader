/**
 * Google Drive API Service - Dùng Redirect Flow thay vì Popup
 * Tránh popup blocker của trình duyệt
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.host}${window.location.pathname}` 
  : '';

/**
 * Tạo URL để redirect đến Google OAuth
 */
export function getGoogleAuthUrl() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('VITE_GOOGLE_CLIENT_ID không được cấu hình');
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'token',
    scope: SCOPES,
    include_granted_scopes: 'true',
    state: 'google_drive_auth', // Để nhận biết khi redirect về
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Xử lý redirect sau khi authorize
 * Gọi hàm này trong useEffect khi component mount để check URL hash
 */
export function handleAuthRedirect() {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash;
  if (!hash) return null;

  // Parse hash: #access_token=...&token_type=Bearer&expires_in=3600
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const error = params.get('error');

  if (error) {
    throw new Error(`OAuth error: ${error}`);
  }

  if (!accessToken) {
    return null;
  }

  const expiresIn = parseInt(params.get('expires_in') || '3600', 10);
  const tokenResponse = {
    access_token: accessToken,
    expires_in: expiresIn,
    token_type: params.get('token_type') || 'Bearer',
  };

  // Lưu token
  localStorage.setItem('google_access_token', accessToken);
  localStorage.setItem('google_token_expiry', String(Date.now() + expiresIn * 1000));

  // Xóa hash khỏi URL
  window.history.replaceState(null, '', window.location.pathname);

  return tokenResponse;
}

/**
 * Kiểm tra xem có token hợp lệ không
 */
export function hasValidToken() {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('google_access_token');
  const expiry = localStorage.getItem('google_token_expiry');
  
  if (!token || !expiry) return false;
  
  return Date.now() < parseInt(expiry, 10);
}

/**
 * Lấy access token từ localStorage
 */
export function getAccessToken() {
  if (!hasValidToken()) {
    return null;
  }
  return localStorage.getItem('google_access_token');
}

/**
 * Logout - xóa token
 */
export function logoutGoogle() {
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_token_expiry');
}

/**
 * Authentication Service
 * Handles Firebase authentication with error handling and fallback strategies
 */

import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider, 
  Auth,
  AuthError 
} from 'firebase/auth';

export interface AuthError {
  code: string;
  message: string;
  type: 'popup-blocked' | 'network-error' | 'auth-error' | 'unknown';
}

/**
 * Parse Firebase auth errors and return user-friendly messages
 */
export const parseAuthError = (error: any): AuthError => {
  const code = error.code || 'unknown';
  let type: AuthError['type'] = 'unknown';
  let message = 'Tizimga kirishda xatolik yuzaga keldi';

  // Network errors
  if (code === 'auth/network-request-failed') {
    type = 'network-error';
    message = '🌐 Tarmoq xatosi! Iltimos:\n• Internet aloqasini tekshiring\n• Sahifani yangilang (F5)\n• Adblocker/VPN ni o\'chirib ko\'ring';
  }
  
  // Popup blocked errors
  else if (code === 'auth/popup-blocked' || error.message?.includes('popup')) {
    type = 'popup-blocked';
    message = '🔒 Popup oyna blokirovkalangan. Popuplarni ruxsat qilishni quyidagicha o\'rnatashingiz kerak:\n1. Brauzer sozlamalaridan popuplarni ruxsat qiling\n2. Ad blocker-ni o\'chirib ko\'ring\n3. Brauzerni yangilang';
  }
  
  // User cancelled
  else if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
    type = 'auth-error';
    message = 'Kirish jarayoni bekor qilindi';
  }
  
  // Account exists with different provider
  else if (code === 'auth/account-exists-with-different-credential') {
    type = 'auth-error';
    message = 'Bu email boshqa provayder bilan ro\'yxatdan o\'tgan. Boshqa usul bilan kirishga harakat qiling.';
  }
  
  // CORS errors
  else if (error.message?.includes('CORS') || error.message?.includes('Origin')) {
    type = 'network-error';
    message = '🔐 CORS xatosi! Bu odatda:\n• Saytning noto\'g\'ri HTTPS konfiguratsiyasi\n• Firebase console-da URL ruxsat etilmagan\n\nAdministratorga murojaat qiling';
  }
  
  // Default auth errors
  else {
    type = 'auth-error';
    message = error.message || 'Tizimga kirishda xatolik yuzaga keldi';
  }

  return { code, message, type };
};

/**
 * Sign in with Google using popup first, then redirect as fallback
 * @param auth Firebase Auth instance
 * @param provider Google Auth Provider instance
 */
export const signInWithGoogle = async (
  auth: Auth, 
  provider: GoogleAuthProvider
): Promise<void> => {
  try {
    // First, check if redirect result exists (user returning from redirect)
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult?.user) {
      console.log('✅ Redirect login successful:', redirectResult.user.email);
      return;
    }

    // Set custom parameters for account selection
    provider.setCustomParameters({ 
      prompt: 'select_account',
      'login_hint': ''
    });

    // Try popup first
    try {
      console.log('🔄 Trying popup sign-in...');
      await signInWithPopup(auth, provider);
      console.log('✅ Popup sign-in successful');
      return;
    } catch (popupError: any) {
      const error = parseAuthError(popupError);
      
      // If popup is blocked, use redirect instead
      if (error.type === 'popup-blocked') {
        console.warn('⚠️ Popup blocked, switching to redirect method...');
        
        // Show a warning to user before redirect
        const userConfirm = confirm(
          'Popup blokirovkalangan, redirect usuliga o\'tamiz. Davom etamiz?'
        );
        
        if (userConfirm) {
          await signInWithRedirect(auth, provider);
          // Note: page will reload after redirect
        }
        return;
      }
      
      // Re-throw other errors
      throw popupError;
    }
  } catch (error: any) {
    const authError = parseAuthError(error);
    console.error('❌ Sign-in error:', authError);
    throw authError;
  }
};

/**
 * Sign out and handle cleanup
 */
export const handleSignOut = async (auth: Auth): Promise<void> => {
  try {
    await auth.signOut();
    console.log('✅ User signed out successfully');
    // Optional: reload page to clear any cached data
    // window.location.reload();
  } catch (error) {
    const authError = parseAuthError(error);
    console.error('❌ Sign-out error:', authError);
    throw authError;
  }
};

/**
 * Check if popups are blocked by attempting a micro-popup
 */
export const checkIfPopupsBlocked = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const popup = window.open('', '_blank', 'width=1,height=1');
    
    if (!popup || popup.closed) {
      resolve(true); // Popups are blocked
    } else {
      popup.close();
      resolve(false); // Popups are allowed
    }
  });
};

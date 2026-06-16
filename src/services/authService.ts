/**
 * Firebase Authentication Service
 * Handles Google Sign-In with popup and redirect fallback
 */

import { 
  signInWithPopup, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  Auth
} from 'firebase/auth';

/**
 * Sign in with Google using popup or redirect fallback
 */
export const signInWithGoogle = async (auth: Auth, provider: GoogleAuthProvider) => {
  try {
    // Check internet connection
    if (!navigator.onLine) {
      throw new Error('Internet aloqasi yo\'q');
    }

    provider.setCustomParameters({ prompt: 'select_account' });

    // Try popup first
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (popupError: any) {
      // If popup blocked, try redirect
      if (
        popupError.code === 'auth/popup-blocked' ||
        popupError.message?.includes('popup')
      ) {
        console.log('Popup blokirovkalangan, redirect usuliga o\'tamiz...');
        await signInWithRedirect(auth, provider);
        return null; // Redirect will handle the result
      }
      
      // Re-throw other errors
      throw popupError;
    }
  } catch (error: any) {
    // User-friendly error messages
    let message = 'Tizimga kirishda xatolik yuzaga keldi';

    if (error.message === 'Internet aloqasi yo\'q') {
      message = "Internet aloqasi yo'q. Iltimos, tarmoqni tekshiring.";
    } else if (error.code === 'auth/network-request-failed') {
      message = 'Tarmoq xatosi. Iltimos, sahifani yangilang yoki adblocker-ni o\'chirib ko\'ring.';
    } else if (error.message?.includes('popup')) {
      message = 'Popup oyna blokirovkalangan. Popuplarni brauzer sozlamalarida ruxsat qiling.';
    }

    console.error('Auth Error:', error);
    throw new Error(message);
  }
};

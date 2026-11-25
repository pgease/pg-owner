/**
 * Central Error Mapper for PG Ease
 * Translates raw technical / network / API errors into human-friendly messages.
 * Logs raw technical errors to console only (never exposed to users).
 */

export interface FriendlyError {
  title: string;
  message: string;
}

export function mapFriendlyError(error: any, fallbackTitle: string = 'Something went wrong'): FriendlyError {
  // Always log raw error to console for debugging
  if (error) {
    console.error('[PG Ease Error Intercepted]:', error);
  }

  const rawMsg = (
    error?.message ||
    error?.error ||
    error?.response?.data?.message ||
    error?.data?.message ||
    (typeof error === 'string' ? error : '')
  ).toString();

  const lower = rawMsg.toLowerCase();
  const status = Number(error?.status || error?.response?.status || error?.statusCode || 0);

  // 1. Network / Failed to fetch / timeout / offline / CORS preflight block
  if (
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('networkrequestfailed') ||
    lower.includes('timeout') ||
    lower.includes('not allowed by cors') ||
    lower.includes('abort') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  ) {
    return {
      title: 'No internet connection',
      message: 'Check your connection and try again.',
    };
  }

  // 2. Rate-limited (429)
  if (status === 429 || lower.includes('too many') || lower.includes('rate limit')) {
    const match = rawMsg.match(/(\d+)\s*(?:seconds|secs|s)/i);
    const secs = match ? match[1] : '30';
    return {
      title: 'Too many attempts',
      message: `Please wait ${secs} seconds before retrying.`,
    };
  }

  // 3. Invalid OTP / wrong code
  if (
    lower.includes('invalid otp') ||
    lower.includes('wrong otp') ||
    lower.includes('incorrect otp') ||
    lower.includes('invalid code') ||
    lower.includes('otp expired')
  ) {
    return {
      title: 'Wrong OTP',
      message: 'Please check the code and try again.',
    };
  }

  // 4. Server 5xx
  if (status >= 500 && status < 600) {
    return {
      title: 'Something went wrong',
      message: 'Please try again in a moment.',
    };
  }

  // 5. OTP send failed (4xx with backend message)
  if (lower.includes('otp') || lower.includes('channel') || lower.includes('sms') || lower.includes('whatsapp')) {
    const backendMessage = error?.response?.data?.message || error?.data?.message;
    return {
      title: "Couldn't send OTP",
      message:
        typeof backendMessage === 'string' && backendMessage.length > 5 && !backendMessage.includes('CORS')
          ? backendMessage
          : 'Please try again or use WhatsApp.',
    };
  }

  // 6. Friendly backend message
  const backendMsg = error?.response?.data?.message || error?.data?.message;
  if (typeof backendMsg === 'string' && backendMsg.length > 3 && !backendMsg.includes('CORS') && !backendMsg.includes('fetch')) {
    return {
      title: fallbackTitle,
      message: backendMsg,
    };
  }

  return {
    title: fallbackTitle,
    message: 'Please try again in a moment.',
  };
}

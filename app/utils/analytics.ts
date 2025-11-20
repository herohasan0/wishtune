// Google Analytics & Google Tag Manager event tracking utilities

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: Array<Record<string, any>>;
  }
}

// Track custom events (works with both GTM and direct GA)
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, any>
) => {
  if (typeof window === 'undefined') return;

  // Try GTM dataLayer first (recommended approach)
  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...parameters,
    });
  }
  
  // Fallback to gtag for direct GA implementation
  if (window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

// Track button clicks
export const trackButtonClick = (buttonName: string, location?: string) => {
  trackEvent('button_click', {
    button_name: buttonName,
    location: location || window.location.pathname,
  });
};

// Track form submissions
export const trackFormSubmit = (formName: string, success: boolean) => {
  trackEvent('form_submit', {
    form_name: formName,
    success: success,
  });
};

// Track user actions
export const trackUserAction = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  trackEvent(action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track song creation steps
export const trackSongCreationStep = (
  step: 'name_entered' | 'celebration_selected' | 'style_selected' | 'create_clicked' | 'song_completed',
  data?: Record<string, any>
) => {
  trackEvent('song_creation_step', {
    step: step,
    ...data,
  });
};

// Track page engagement time (when user leaves page)
export const trackPageEngagement = (pageName: string, timeSpent: number) => {
  trackEvent('page_engagement', {
    page_name: pageName,
    engagement_time_seconds: Math.round(timeSpent / 1000),
  });
};

// Track errors
export const trackError = (errorType: string, errorMessage: string) => {
  trackEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
  });
};

// Track conversions (purchases)
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string = 'USD',
  items?: Array<{ name: string; quantity: number; price: number }>
) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items,
  });
};

// Track sign up
export const trackSignUp = (method: string) => {
  trackEvent('sign_up', {
    method: method,
  });
};

// Track login
export const trackLogin = (method: string) => {
  trackEvent('login', {
    method: method,
  });
};

// Track page exits (call this in useEffect cleanup)
export const setupPageExitTracking = (pageName: string) => {
  const startTime = Date.now();

  const handleExit = () => {
    const timeSpent = Date.now() - startTime;
    trackPageEngagement(pageName, timeSpent);
  };

  // Track on page unload
  window.addEventListener('beforeunload', handleExit);

  // Return cleanup function
  return () => {
    handleExit();
    window.removeEventListener('beforeunload', handleExit);
  };
};


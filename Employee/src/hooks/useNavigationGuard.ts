import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useNavigationGuard
 *
 * A reusable hook that prevents rapid navigation clicks, cancels pending
 * API requests via AbortController, and ensures only the last clicked
 * menu item navigates through.
 *
 * Features:
 *  - AbortController integration to cancel in-flight fetch requests
 *  - Navigation lock (debounce) to prevent double-clicks
 *  - Tracks navigation-in-progress state to disable header clicks
 *  - Returns a `navigateWithGuard` function that replaces `navigate()`
 *  - Returns a `getSignal()` function to pass AbortSignal to API calls
 *
 * @returns { navigateWithGuard, getSignal, isNavigating, abortPendingRequests }
 */
export function useNavigationGuard() {
  const navigate = useNavigate();

  // Refs to persist across renders without causing re-renders
  const abortControllerRef = useRef<AbortController | null>(null);
  const isNavigatingRef = useRef(false);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNavigationRef = useRef<{ key: string; href: string } | null>(null);

  // State to track if navigation is in progress (for disabling clicks)
  const [isNavigating, setIsNavigating] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
    };
  }, []);

  /**
   * Returns an AbortSignal that can be passed to apiRequest().
   * The signal is aborted automatically when a new navigation starts,
   * canceling any pending API requests from the previous page.
   */
  const getSignal = useCallback((): AbortSignal => {
    // If there's an existing controller, abort it (cancel old requests)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Create a new controller for the current request
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  /**
   * Aborts any pending requests without navigating.
   * Useful for cleanup when the component unmounts or when explicitly cancelling.
   */
  const abortPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Navigates with a guard that:
   *  1. Cancels any pending API requests
   *  2. Ignores duplicate clicks on the same menu item
   *  3. Prevents rapid successive navigation (debounce)
   *  4. Ensures the last clicked item is the one that navigates
   *  5. Temporarily disables clicks while navigation is in progress
   *
   * @param key   – Unique key for the navigation item (e.g., "home", "events")
   * @param href  – The route path to navigate to
   * @param options – Optional react-router navigate options
   */
  const navigateWithGuard = useCallback(
    (key: string, href: string, options?: { replace?: boolean; state?: unknown }) => {
      // Store this as the latest navigation request
      lastNavigationRef.current = { key, href };

      // If navigation is currently in progress, don't start another one.
      // The last clicked item will be handled when the current navigation finishes.
      if (isNavigatingRef.current) {
        return;
      }

      /**
       * Debounce mechanism: if the user clicks rapidly, only the LAST
       * click within 300ms will actually trigger navigation.
       */
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }

      navigationTimerRef.current = setTimeout(() => {
        // Check if this is still the latest requested navigation
        const latest = lastNavigationRef.current;
        if (!latest || latest.key !== key) {
          // A newer navigation was requested — skip this one
          return;
        }

        // Cancel any pending API requests from the previous page
        abortPendingRequests();

        // Lock navigation to prevent further clicks
        isNavigatingRef.current = true;
        setIsNavigating(true);

        // Navigate to the requested route
        navigate(href, options);

        // Unlock after a brief delay (enough for the route to start loading)
        setTimeout(() => {
          isNavigatingRef.current = false;
          setIsNavigating(false);
          lastNavigationRef.current = null;
        }, 400); // 400ms lockout – adjust if needed for slower connections
      }, 200); // 200ms debounce delay
    },
    [navigate, abortPendingRequests]
  );

  return {
    /** Call this instead of `navigate()` for guarded navigation */
    navigateWithGuard,
    /** Call to get an AbortSignal for fetch/apiRequest calls */
    getSignal,
    /** Whether navigation is currently in progress (disables clicks) */
    isNavigating,
    /** Abort all pending requests manually */
    abortPendingRequests,
  };
}

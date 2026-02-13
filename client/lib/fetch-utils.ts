// Utility function for resilient fetch without AbortController conflicts
export const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  console.log(`🔄 Fetching: ${url}`);

  try {
    // Normalize API root to absolute origin when a relative /api path is used.
    let requestUrl = url;
    try {
      if (typeof window !== 'undefined' && url.startsWith('/api/')) {
        requestUrl = window.location.origin + url;
      }
    } catch (e) {
      // ignore window access errors
    }

    // Use Promise.race for timeout without AbortController
    const fetchPromise = fetch(requestUrl, options);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout: ${requestUrl}`)), timeout);
    });

    const response: any = await Promise.race([fetchPromise, timeoutPromise]);
    console.log(`✅ Fetch completed: ${requestUrl} - ${response && response.status}`);
    return response;
  } catch (error) {
    console.error(`❌ Fetch failed: ${url}`, error);
    throw error;
  }
};

// Helper for JSON fetch with timeout
export const fetchJSON = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const response = await fetchWithTimeout(url, options, timeout);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

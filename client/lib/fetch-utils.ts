// Utility function for resilient fetch without AbortController conflicts
export const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  console.log(`🔄 Fetching: ${url}`);

  try {
    // Use Promise.race for timeout without AbortController
    const fetchPromise = fetch(url, options);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout: ${url}`)), timeout);
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    console.log(`✅ Fetch completed: ${url} - ${response.status}`);
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

// ===================================================================
// PrintQueue Frontend API Client Helper
// Connects the UI to the Express backend (default: http://localhost:5000)
// ===================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; message: string; data: T }> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || "An unexpected error occurred");
  }

  return json;
}

export { API_BASE_URL };

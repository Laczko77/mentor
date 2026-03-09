const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function apiFetch<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

    const res = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...(options.headers || {}),
        },
    }).catch(err => {
        console.error("NETWORK ERROR in apiFetch:", err, { url, method: options.method || "GET" });
        throw err;
    });

    if (res.status === 401 && typeof window !== "undefined") {
        // Automatically redirect to login if an API call fails with 401 on the client side
        window.location.href = "/login";
        throw new Error("Unauthorized");
    }

    if (!res.ok) {
        let errorMsg = `API error: ${res.status}`;
        try {
            const error = await res.json();
            errorMsg = error.detail || error.error || errorMsg;
        } catch (e) {
            // Ignore if not JSON
        }
        throw new Error(errorMsg);
    }

    if (res.status === 204) {
        return null as unknown as T;
    }

    return res.json();
}

// Convenience methods
export const api = {
    get: <T = unknown>(endpoint: string) => apiFetch<T>(endpoint),

    post: <T = unknown>(endpoint: string, data?: unknown) =>
        apiFetch<T>(endpoint, {
            method: "POST",
            body: data ? JSON.stringify(data) : undefined,
        }),

    put: <T = unknown>(endpoint: string, data?: unknown) =>
        apiFetch<T>(endpoint, {
            method: "PUT",
            body: data ? JSON.stringify(data) : undefined,
        }),

    delete: <T = unknown>(endpoint: string) =>
        apiFetch<T>(endpoint, { method: "DELETE" }),
};

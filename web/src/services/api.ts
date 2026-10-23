import { AuthResponse, User, Subscription, Channel, AdminUserItem } from "../types";

const BASE_URL = "/api";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem("golstream_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.message || `Error del servidor (${res.status})`;
    const error = new Error(errorMsg) as Error & { code?: string; status?: number };
    error.code = data.code;
    error.status = res.status;
    throw error;
  }
  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<AuthResponse>(res);
    localStorage.setItem("golstream_token", data.token);
    return data;
  },

  async getMe(): Promise<{
    user: User;
    subscription: Subscription | null;
    iptvAccountConfigured: boolean;
    iptvAccountValid: boolean;
  }> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  logout(): void {
    localStorage.removeItem("golstream_token");
  },

  // User area
  async getChannels(): Promise<Channel[]> {
    const res = await fetch(`${BASE_URL}/user/channels`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async toggleFavorite(channelId: string): Promise<{ isFavorite: boolean }> {
    const res = await fetch(`${BASE_URL}/user/channels/${channelId}/favorite`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getStreamToken(channelId: string): Promise<{ streamToken: string; streamUrl: string }> {
    const res = await fetch(`${BASE_URL}/user/channels/${channelId}/stream-token`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Admin area
  async getAdminUsers(): Promise<AdminUserItem[]> {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async createAdminUser(userData: {
    name: string;
    email: string;
    password: string;
    role: "admin" | "user";
  }): Promise<User> {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  async updateAdminUser(id: string, userData: Partial<AdminUserItem> & { password?: string }): Promise<User> {
    const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  async deleteAdminUser(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async setIptvCredentials(
    userId: string,
    credentials: { username: string; password: string; host: string }
  ): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/iptv`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  async testIptvCredentials(userId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/iptv/test`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async activateSubscription(userId: string): Promise<{ message: string; subscription: Subscription }> {
    const res = await fetch(`${BASE_URL}/admin/subscriptions/${userId}/activate`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async renewSubscription(userId: string): Promise<{ message: string; subscription: Subscription }> {
    const res = await fetch(`${BASE_URL}/admin/subscriptions/${userId}/renew`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async suspendSubscription(userId: string): Promise<{ message: string; subscription: Subscription }> {
    const res = await fetch(`${BASE_URL}/admin/subscriptions/${userId}/suspend`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async cancelSubscription(userId: string): Promise<{ message: string; subscription: Subscription }> {
    const res = await fetch(`${BASE_URL}/admin/subscriptions/${userId}/cancel`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getAdminChannels(): Promise<Channel[]> {
    const res = await fetch(`${BASE_URL}/admin/channels`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateChannel(id: string, data: Partial<Channel>): Promise<Channel> {
    const res = await fetch(`${BASE_URL}/admin/channels/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

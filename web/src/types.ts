export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface Subscription {
  id: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "SUSPENDED";
  daysRemaining: number;
  isExpired: boolean;
}

export interface Channel {
  id: string;
  name: string;
  logoUrl?: string;
  isWorking: boolean;
  isVisible?: boolean;
  category: string;
  categoryId?: string;
  isFavorite: boolean;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  role: "admin" | "user";
  createdAt: string;
  subscription: Subscription | null;
  iptvAccount: {
    configured: boolean;
    isValid: boolean;
    lastTestedAt: string | null;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
  subscription: Subscription | null;
}

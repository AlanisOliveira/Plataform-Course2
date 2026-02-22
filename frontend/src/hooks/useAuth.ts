import { create } from "zustand";

export interface Profile {
  id: number;
  name: string;
  is_admin: number;
  avatar_color: string;
}

interface AuthStore {
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setProfile: (profile: Profile | null) => void;
  login: (apiUrl: string, profileId: number, password: string) => Promise<boolean>;
  logout: (apiUrl: string) => Promise<void>;
  checkAuth: (apiUrl: string) => Promise<void>;
}

const useAuth = create<AuthStore>((set) => ({
  profile: null,
  isAuthenticated: false,
  isLoading: true,

  setProfile: (profile) =>
    set({ profile, isAuthenticated: !!profile }),

  login: async (apiUrl, profileId, password) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profile_id: profileId, password }),
      });

      if (response.ok) {
        const data = await response.json();
        set({ profile: data, isAuthenticated: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  logout: async (apiUrl) => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors
    }
    set({ profile: null, isAuthenticated: false });
  },

  checkAuth: async (apiUrl) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        set({ profile: data, isAuthenticated: true, isLoading: false });
      } else {
        set({ profile: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ profile: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export default useAuth;

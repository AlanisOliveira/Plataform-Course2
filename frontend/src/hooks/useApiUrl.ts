import { create } from "zustand";

// Usar mesma origem (SEM CORS!) - tanto em dev quanto prod
const defaultUrl = "";

interface Store {
  apiUrl: string;
  setApiUrl: (url: string) => void;
  resetApiUrl: () => void;
}

const useApiUrl = create<Store>((set) => ({
  apiUrl: defaultUrl,
  setApiUrl: (url) => {
    localStorage.setItem("apiUrl", url);
    set({ apiUrl: url });
  },
  resetApiUrl: () => {
    localStorage.setItem("apiUrl", defaultUrl);
    set({ apiUrl: defaultUrl });
  },
}));

export default useApiUrl;

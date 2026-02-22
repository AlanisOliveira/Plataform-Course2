import { useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import useApiUrl from "@/hooks/useApiUrl";

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { checkAuth, isLoading } = useAuth();
  const { apiUrl } = useApiUrl();

  useEffect(() => {
    checkAuth(apiUrl);
  }, [apiUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}

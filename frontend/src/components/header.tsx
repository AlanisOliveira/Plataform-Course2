import { Cookie, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-theme-toggle";
import { useNavigate } from "react-router-dom";
import APIUrl from "./api-url";
import useAuth from "@/hooks/useAuth";
import useApiUrl from "@/hooks/useApiUrl";

function Header() {
  let navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { apiUrl } = useApiUrl();

  function handleNavigate(path: string) {
    navigate(path);
  }

  async function handleLogout() {
    await logout(apiUrl);
    navigate("/login");
  }

  return (
    <div className="relative min-h-20 p-6 shadow-md bg-white dark:shadow-white/10 dark:bg-neutral-900">
      <div className="flex justify-between items-center">
        <div
          onClick={() => handleNavigate("/")}
          className="inline-flex flex-wrap gap-3 cursor-pointer font-medium text-xl"
        >
          <Cookie className="w-8 h-8" /> Receitas
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <APIUrl />

          {/* Receitas */}
          <Button onClick={() => handleNavigate("/")} variant="link">
            Dashboard
          </Button>
          <Button onClick={() => handleNavigate("/receitas")} variant="link">
            Biblioteca de Receitas
          </Button>
          <Button onClick={() => handleNavigate("/receitas/gestao")} variant="link">
            Gestão de Receitas
          </Button>

          {/* Livros */}
          <Button onClick={() => handleNavigate("/livros")} variant="link">
            Livros
          </Button>

          <Button
            onClick={() => handleNavigate("/configuracoes")}
            variant="link"
          >
            Configurações
          </Button>

          {/* Admin (condicional) */}
          {profile?.is_admin ? (
            <Button onClick={() => handleNavigate("/admin")} variant="link">
              <Shield className="w-4 h-4 mr-1" />
              Admin
            </Button>
          ) : null}

          <ModeToggle />

          {/* Perfil atual e Logout */}
          {profile && (
            <div className="flex items-center gap-2 ml-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: profile.avatar_color }}
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {profile.name}
              </span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;

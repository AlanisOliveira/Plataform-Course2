import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import useAuth, { Profile } from "@/hooks/useAuth";
import useApiUrl from "@/hooks/useApiUrl";
import { toast } from "sonner";
import { Cookie, Lock } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { apiUrl } = useApiUrl();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [password, setPassword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadProfiles();
  }, [apiUrl]);

  const loadProfiles = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/profiles`);
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      }
    } catch {
      toast.error("Erro ao carregar perfis");
    }
  };

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setPassword("");
    setDialogOpen(true);
  };

  const handleLogin = async () => {
    if (!selectedProfile) return;
    setLoading(true);

    const success = await login(apiUrl, selectedProfile.id, password);
    if (success) {
      navigate("/", { replace: true });
    } else {
      toast.error("Senha incorreta");
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <Cookie className="w-12 h-12" />
          <h1 className="text-4xl font-bold">Receitas</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Quem está assistindo?
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => handleProfileClick(profile)}
            className="group flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-accent transition-colors"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg group-hover:ring-4 ring-primary transition-all"
              style={{ backgroundColor: profile.avatar_color }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground">
              {profile.name}
            </span>
            {profile.is_admin ? (
              <span className="text-xs text-muted-foreground">Admin</span>
            ) : null}
          </button>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {selectedProfile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: selectedProfile?.avatar_color }}
              >
                {selectedProfile?.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLogin} disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import useApiUrl from "@/hooks/useApiUrl";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Users, Plus, Pencil, Trash2, Shield } from "lucide-react";

interface AdminProfile {
  id: number;
  name: string;
  is_admin: number;
  avatar_color: string;
  created_at: string | null;
}

const AVATAR_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
];

export default function AdminPage() {
  const { apiUrl } = useApiUrl();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<AdminProfile | null>(null);
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formColor, setFormColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [apiUrl]);

  const loadProfiles = async () => {
    try {
      const response = await apiFetch(`${apiUrl}/api/admin/profiles`);
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      }
    } catch {
      toast.error("Erro ao carregar perfis");
    }
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formPassword) {
      toast.error("Nome e senha são obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`${apiUrl}/api/admin/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          password: formPassword,
          avatar_color: formColor,
        }),
      });

      if (response.ok) {
        toast.success("Perfil criado com sucesso!");
        setCreateDialogOpen(false);
        resetForm();
        loadProfiles();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao criar perfil");
      }
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedProfile || !formName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = {
        name: formName.trim(),
        avatar_color: formColor,
      };
      if (formPassword) {
        body.password = formPassword;
      }

      const response = await apiFetch(
        `${apiUrl}/api/admin/profiles/${selectedProfile.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        toast.success("Perfil atualizado com sucesso!");
        setEditDialogOpen(false);
        resetForm();
        loadProfiles();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao atualizar perfil");
      }
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProfile) return;

    setLoading(true);
    try {
      const response = await apiFetch(
        `${apiUrl}/api/admin/profiles/${selectedProfile.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Perfil deletado com sucesso!");
        setDeleteDialogOpen(false);
        loadProfiles();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao deletar perfil");
      }
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormPassword("");
    setFormColor(AVATAR_COLORS[0]);
  };

  const openEditDialog = (profile: AdminProfile) => {
    setSelectedProfile(profile);
    setFormName(profile.name);
    setFormPassword("");
    setFormColor(profile.avatar_color);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (profile: AdminProfile) => {
    setSelectedProfile(profile);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Administração
        </h1>
        <p className="text-muted-foreground">
          Gerencie os perfis da plataforma
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Perfis
              </CardTitle>
              <CardDescription>
                Crie, edite e remova perfis de acesso
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setCreateDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Perfil
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Perfil</th>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="border-t hover:bg-muted/50">
                    <td className="p-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: profile.avatar_color }}
                      >
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                    </td>
                    <td className="p-3 font-medium">{profile.name}</td>
                    <td className="p-3">
                      {profile.is_admin ? (
                        <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Usuário
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(profile)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {!profile.is_admin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteDialog(profile)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Criar Perfil */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome do perfil"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Senha"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor do Avatar</Label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-10 h-10 rounded-full transition-all ${
                      formColor === color
                        ? "ring-2 ring-offset-2 ring-primary"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Perfil */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome do perfil"
              />
            </div>
            <div className="space-y-2">
              <Label>Nova Senha (deixe vazio para manter)</Label>
              <Input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Nova senha (opcional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor do Avatar</Label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-10 h-10 rounded-full transition-all ${
                      formColor === color
                        ? "ring-2 ring-offset-2 ring-primary"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Deletar Perfil */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados do perfil (cursos,
              livros, progresso, notas) serão permanentemente deletados.
              <br />
              <br />
              <strong>Perfil: {selectedProfile?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

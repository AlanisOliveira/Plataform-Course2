import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "sonner";
import { Download, Upload, Trash2, Database, RefreshCw } from "lucide-react";

interface Backup {
  filename: string;
  size: number;
  created_at: string;
}

export default function BackupManager() {
  const { apiUrl } = useApiUrl();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  const loadBackups = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/backup/list`);
      if (response.ok) {
        const data = await response.json();
        setBackups(data);
      } else {
        toast.error("Erro ao carregar backups");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    }
  };

  useEffect(() => {
    loadBackups();
  }, [apiUrl]);

  const createBackup = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/backup/create`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Backup criado com sucesso!");
        loadBackups();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao criar backup");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = (filename: string) => {
    window.open(`${apiUrl}/api/backup/download/${filename}`, "_blank");
  };

  const downloadCurrentDatabase = () => {
    window.open(`${apiUrl}/api/backup/download-current`, "_blank");
  };

  const restoreBackup = async () => {
    if (!selectedBackup) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/backup/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename: selectedBackup }),
      });

      if (response.ok) {
        toast.success("Backup restaurado com sucesso! Recarregue a página.");
        setRestoreDialogOpen(false);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao restaurar backup");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async () => {
    if (!selectedBackup) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/backup/delete/${selectedBackup}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Backup deletado com sucesso!");
        loadBackups();
        setDeleteDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao deletar backup");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const uploadBackup = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${apiUrl}/api/backup/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Backup importado com sucesso! Recarregue a página.");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao importar backup");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Gerenciar Backups
          </CardTitle>
          <CardDescription>
            Crie, baixe e restaure backups do banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={createBackup} disabled={loading}>
              <Database className="w-4 h-4 mr-2" />
              Criar Backup Agora
            </Button>
            <Button onClick={downloadCurrentDatabase} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Baixar Banco Atual
            </Button>
            <Button
              variant="outline"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar Backup
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".sqlite"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  uploadBackup(file);
                }
              }}
            />
            <Button onClick={loadBackups} variant="ghost" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="border rounded-lg">
            <div className="max-h-96 overflow-y-auto">
              {backups.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum backup encontrado
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-3">Nome do Arquivo</th>
                      <th className="text-left p-3">Tamanho</th>
                      <th className="text-left p-3">Data de Criação</th>
                      <th className="text-right p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup) => (
                      <tr key={backup.filename} className="border-t hover:bg-muted/50">
                        <td className="p-3 font-mono text-sm">{backup.filename}</td>
                        <td className="p-3">{formatFileSize(backup.size)}</td>
                        <td className="p-3">{formatDate(backup.created_at)}</td>
                        <td className="p-3 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBackup(backup.filename)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBackup(backup.filename);
                              setRestoreDialogOpen(true);
                            }}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBackup(backup.filename);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá substituir o banco de dados atual pelo backup selecionado.
              Um backup de segurança será criado automaticamente antes da restauração.
              <br />
              <br />
              <strong>Arquivo: {selectedBackup}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={restoreBackup} disabled={loading}>
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O backup será permanentemente deletado.
              <br />
              <br />
              <strong>Arquivo: {selectedBackup}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteBackup}
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

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote } from "lucide-react";
import { toast } from "sonner";
import useApiUrl from "@/hooks/useApiUrl";

interface NotesDialogProps {
  type: "course" | "lesson";
  id: number;
  title: string;
}

export function NotesDialog({ type, id, title }: NotesDialogProps) {
  const [notes, setNotes] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { apiUrl } = useApiUrl();

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
    }
  }, [isOpen, id, type]);

  const fetchNotes = async () => {
    try {
      const endpoint =
        type === "course"
          ? `${apiUrl}/api/courses/${id}/notes`
          : `${apiUrl}/api/lessons/${id}/notes`;

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || "");
      }
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
      toast.error("Erro ao carregar notas");
    }
  };

  const saveNotes = async () => {
    setIsSaving(true);
    try {
      const endpoint =
        type === "course"
          ? `${apiUrl}/api/courses/${id}/notes`
          : `${apiUrl}/api/lessons/${id}/notes`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        toast.success("Notas salvas com sucesso!");
        setIsOpen(false);
      } else {
        toast.error("Erro ao salvar notas");
      }
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
      toast.error("Erro ao salvar notas");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <StickyNote className="h-4 w-4" />
          Notas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Notas - {title}</DialogTitle>
          <DialogDescription>
            Adicione suas anotações sobre{" "}
            {type === "course" ? "este curso" : "esta aula"}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Digite suas anotações aqui..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[300px]"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={saveNotes} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

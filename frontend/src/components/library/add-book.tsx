import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import useApiUrl from "@/hooks/useApiUrl";
import { Plus } from "lucide-react";

type Props = {
  onCreate: () => void;
};

export default function AddBook({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [filePath, setFilePath] = useState("");
  const [categories, setCategories] = useState("");
  const [bookType, setBookType] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { apiUrl } = useApiUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("file_path", filePath);
      if (author) formData.append("author", author);
      if (categories) formData.append("categories", categories);
      if (bookType) formData.append("book_type", bookType);

      if (imageURL) {
        formData.append("imageURL", imageURL);
      } else if (imageFile) {
        formData.append("imageFile", imageFile);
      }

      const response = await apiFetch(`${apiUrl}/api/books`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao adicionar livro");
      }

      toast.success("Livro adicionado com sucesso!");
      setOpen(false);
      resetForm();
      onCreate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar livro");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setFilePath("");
    setCategories("");
    setBookType("");
    setImageURL("");
    setImageFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Livro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Livro</DialogTitle>
          <DialogDescription>
            Adicione um novo livro (PDF ou EPUB) à sua biblioteca digital
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do livro"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="author">Autor</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nome do autor"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="filePath">Caminho do Arquivo *</Label>
              <Input
                id="filePath"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="/caminho/para/livro.pdf ou /caminho/para/livro.epub"
                required
              />
              <p className="text-xs text-slate-500">
                Caminho completo do arquivo PDF ou EPUB no sistema
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bookType">Tipo</Label>
              <Input
                id="bookType"
                value={bookType}
                onChange={(e) => setBookType(e.target.value)}
                placeholder="Ex: Livro, Revista, Artigo, Documento"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categories">Categorias</Label>
              <Input
                id="categories"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                placeholder="Ficção, Romance, Técnico (separadas por vírgula)"
              />
            </div>

            <div className="grid gap-2">
              <Label>Capa do Livro</Label>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="imageURL" className="text-sm font-normal">
                    URL da imagem
                  </Label>
                  <Input
                    id="imageURL"
                    type="url"
                    value={imageURL}
                    onChange={(e) => setImageURL(e.target.value)}
                    placeholder="https://exemplo.com/capa.jpg"
                    disabled={!!imageFile}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">ou</span>
                </div>
                <div>
                  <Label htmlFor="imageFile" className="text-sm font-normal">
                    Upload de arquivo
                  </Label>
                  <Input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    disabled={!!imageURL}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adicionando..." : "Adicionar Livro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

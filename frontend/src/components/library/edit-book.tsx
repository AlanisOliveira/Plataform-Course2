import { useState } from "react";
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
import { toast } from "sonner";
import useApiUrl from "@/hooks/useApiUrl";
import { Book } from "@/models/models";
import { Pencil } from "lucide-react";

type Props = {
  book: Book;
  onUpdate: () => void;
};

export default function EditBook({ book, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author || "");
  const [filePath, setFilePath] = useState(book.file_path);
  const [categories, setCategories] = useState(book.categories || "");
  const [bookType, setBookType] = useState(book.book_type || "");
  const [imageURL, setImageURL] = useState(book.isCoverUrl ? book.urlCover || "" : "");
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

      const response = await fetch(`${apiUrl}/api/books/${book.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar livro");
      }

      toast.success("Livro atualizado com sucesso!");
      setOpen(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar livro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Livro</DialogTitle>
          <DialogDescription>
            Atualize as informações do livro
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
                placeholder="/caminho/para/livro.pdf"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bookType">Tipo</Label>
              <Input
                id="bookType"
                value={bookType}
                onChange={(e) => setBookType(e.target.value)}
                placeholder="Ex: Livro, Revista, Artigo"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categories">Categorias</Label>
              <Input
                id="categories"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                placeholder="Separadas por vírgula"
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
              {isLoading ? "Atualizando..." : "Atualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

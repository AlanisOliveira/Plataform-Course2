import { useState, useEffect } from "react";
import { toast } from "sonner";
import BooksList from "@/components/library/books-list";
import { Book } from "@/models/models";
import useApiUrl from "@/hooks/useApiUrl";
import AddBook from "@/components/library/add-book";
import { BookOpen } from "lucide-react";

export default function BooksDashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const { apiUrl } = useApiUrl();

  const fetchBooks = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/books`);
      if (!response.ok) throw new Error("Falha ao buscar livros");

      const data = await response.json();
      setBooks(data);
    } catch (error) {
      toast.error("Erro ao carregar livros.");
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <div className="w-full mb-4 space-y-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              Biblioteca de Livros
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {books.length} {books.length === 1 ? "livro" : "livros"}{" "}
              disponíveis
            </p>
          </div>
          <AddBook onCreate={() => fetchBooks()} />
        </div>
        <section className="mt-10 w-full">
          <BooksList books={books} isEditable />
        </section>
      </div>
    </div>
  );
}

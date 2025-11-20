import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Book } from "@/models/models";
import useApiUrl from "@/hooks/useApiUrl";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import PDFReader from "@/components/library/pdf-reader";
import EPUBReader from "@/components/library/epub-reader";

export default function BookReaderPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { apiUrl } = useApiUrl();
  const navigate = useNavigate();

  useEffect(() => {
    if (!bookId) return;

    const fetchBook = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/books/${bookId}`);
        if (!response.ok) throw new Error("Livro não encontrado");

        const data = await response.json();
        setBook(data);
      } catch (error) {
        toast.error("Erro ao carregar livro");
        navigate("/livros");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookId, apiUrl, navigate]);

  // Salvamento automático de progresso
  const handleProgressUpdate = useCallback(
    async (currentPage: number, totalPages: number) => {
      if (!bookId) return;

      try {
        await fetch(`${apiUrl}/api/books/${bookId}/progress`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_page: currentPage,
            total_pages: totalPages,
            is_read: currentPage >= totalPages ? 1 : 0,
          }),
        });
      } catch (error) {
        console.error("Erro ao salvar progresso:", error);
      }
    },
    [bookId, apiUrl]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">Carregando livro...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header do leitor */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/livros")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {book.title}
              </h1>
              {book.author && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {book.author}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 uppercase font-semibold">
              {book.file_type}
            </span>
          </div>
        </div>
      </div>

      {/* Visualizador */}
      <div className="flex-1 overflow-hidden">
        {book.file_type === "pdf" ? (
          <PDFReader
            book={book}
            apiUrl={apiUrl}
            onProgressUpdate={handleProgressUpdate}
          />
        ) : book.file_type === "epub" ? (
          <EPUBReader
            book={book}
            apiUrl={apiUrl}
            onProgressUpdate={handleProgressUpdate}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Tipo de arquivo não suportado: {book.file_type}
              </p>
              <Button onClick={() => navigate("/livros")}>
                Voltar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

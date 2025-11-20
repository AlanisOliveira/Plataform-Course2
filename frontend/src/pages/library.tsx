import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Book } from "@/models/models";
import useApiUrl from "@/hooks/useApiUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search } from "lucide-react";
import AddBook from "@/components/library/add-book";
import BookItem from "@/components/library/book-item";
import { useNavigate } from "react-router-dom";

type ReadingStatus = "all" | "not_started" | "in_progress" | "completed";

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>("all");

  const { apiUrl } = useApiUrl();
  const navigate = useNavigate();

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

  // Recarregar livros quando a página ganha foco
  useEffect(() => {
    const handleFocus = () => {
      fetchBooks();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Filtrar livros
  const filteredBooks = books.filter((book) => {
    // Filtro por tipo
    if (selectedType && book.book_type !== selectedType) {
      return false;
    }

    // Filtro por status de leitura
    if (readingStatus !== "all") {
      const hasProgress = book.current_page > 0 || book.epub_cfi_position;
      const isCompleted = book.is_read === 1;

      if (readingStatus === "not_started" && hasProgress) {
        return false;
      }
      if (readingStatus === "in_progress" && (!hasProgress || isCompleted)) {
        return false;
      }
      if (readingStatus === "completed" && !isCompleted) {
        return false;
      }
    }

    // Filtro por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesTitle = book.title.toLowerCase().includes(searchLower);
      const matchesAuthor = book.author?.toLowerCase().includes(searchLower);
      const matchesCategories = book.categories?.toLowerCase().includes(searchLower);
      return matchesTitle || matchesAuthor || matchesCategories;
    }

    return true;
  });

  // Agrupar por tipo
  const booksByType: Record<string, Book[]> = {};
  filteredBooks.forEach((book) => {
    const type = book.book_type || "Outros";
    if (!booksByType[type]) {
      booksByType[type] = [];
    }
    booksByType[type].push(book);
  });

  const types = Object.keys(booksByType).sort();

  // Obter todos os tipos únicos para o filtro
  const allTypes = Array.from(new Set(books.map((b) => b.book_type).filter(Boolean)));

  // Estatísticas
  const stats = {
    total: books.length,
    notStarted: books.filter((b) => !b.current_page && !b.epub_cfi_position).length,
    inProgress: books.filter(
      (b) => (b.current_page > 0 || b.epub_cfi_position) && b.is_read !== 1
    ).length,
    completed: books.filter((b) => b.is_read === 1).length,
  };

  const handleReadBook = (bookId: number) => {
    navigate(`/biblioteca/${bookId}`);
  };

  return (
    <div className="py-6 w-full">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              Biblioteca Digital
            </h1>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {stats.total} {stats.total === 1 ? "livro" : "livros"}
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                {stats.inProgress} em progresso
              </span>
              <span className="text-green-600 dark:text-green-400">
                {stats.completed} concluídos
              </span>
            </div>
          </div>
          <AddBook onCreate={fetchBooks} />
        </div>

        {/* Filtros */}
        {books.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="space-y-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar por título, autor ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtro por status de leitura */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status de Leitura
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={readingStatus === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReadingStatus("all")}
                  >
                    Todos ({stats.total})
                  </Button>
                  <Button
                    variant={readingStatus === "not_started" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReadingStatus("not_started")}
                  >
                    Não Iniciados ({stats.notStarted})
                  </Button>
                  <Button
                    variant={readingStatus === "in_progress" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReadingStatus("in_progress")}
                  >
                    Em Progresso ({stats.inProgress})
                  </Button>
                  <Button
                    variant={readingStatus === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReadingStatus("completed")}
                  >
                    Concluídos ({stats.completed})
                  </Button>
                </div>
              </div>

              {/* Filtro por tipo */}
              {allTypes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tipo
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={selectedType === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(null)}
                    >
                      Todos
                    </Button>
                    {allTypes.map((type) => (
                      <Button
                        key={type}
                        variant={selectedType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lista de livros por tipo */}
      {types.length > 0 ? (
        types.map((type) => (
          <section key={type} className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {type}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {booksByType[type].map((book) => (
                <BookItem
                  key={book.id}
                  book={book}
                  onRead={() => handleReadBook(book.id)}
                  isEditable={true}
                  onUpdate={fetchBooks}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
            {searchTerm || selectedType
              ? "Nenhum livro encontrado com os filtros aplicados"
              : "Nenhum livro cadastrado ainda!"}
          </p>
          {!searchTerm && !selectedType && (
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              Adicione seu primeiro livro para começar sua biblioteca digital
            </p>
          )}
        </div>
      )}
    </div>
  );
}

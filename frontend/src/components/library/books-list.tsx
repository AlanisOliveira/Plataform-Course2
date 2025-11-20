import { Book } from "@/models/models";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import BookItem from "./book-item";
import useApiUrl from "@/hooks/useApiUrl";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  isEditable?: boolean;
  books: Book[] | null;
};

export default function BooksList({
  isEditable = false,
  books: providedBooks,
}: Props) {
  const [books, setBooks] = useState<Book[] | null>();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const navigate = useNavigate();
  const { apiUrl } = useApiUrl();

  function handleReadBook(bookId: number) {
    navigate(`/livros/${bookId}`);
  }

  const loadBooks = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/books`);
      if (!response.ok) throw new Error("Falha ao buscar livros");

      const books = await response.json();
      if (books) {
        setBooks(books);
        return;
      }
      toast.error("Erro ao carregar livros.");
    } catch (error) {
      toast.error("Erro ao carregar livros.");
    }
  };

  useEffect(() => {
    if (providedBooks && providedBooks.length > 0) {
      setBooks(providedBooks);
    } else {
      loadBooks();
    }
  }, [providedBooks]);

  // Filtrar livros
  const filteredBooks = books?.filter((book) => {
    // Filtro por tipo
    if (selectedType && book.book_type !== selectedType) {
      return false;
    }

    // Filtro por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesTitle = book.title.toLowerCase().includes(searchLower);
      const matchesAuthor = book.author?.toLowerCase().includes(searchLower);
      const matchesCategories = book.categories
        ?.toLowerCase()
        .includes(searchLower);
      return matchesTitle || matchesAuthor || matchesCategories;
    }

    return true;
  });

  // Agrupar livros por tipo
  const booksByType: Record<string, Book[]> = {};
  filteredBooks?.forEach((book) => {
    const type = book.book_type || "Outros";
    if (!booksByType[type]) {
      booksByType[type] = [];
    }
    booksByType[type].push(book);
  });

  const types = Object.keys(booksByType).sort();

  // Obter todos os tipos únicos para o filtro
  const allTypes = Array.from(
    new Set(books?.map((b) => b.book_type).filter(Boolean))
  );

  return (
    <>
      {/* Filtros */}
      {books && books.length > 0 && (
        <div className="px-4 mb-6 bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
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
                      onClick={() => setSelectedType(type ?? null)}
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

      {/* Livros agrupados por tipo */}
      {types.length > 0 ? (
        types.map((type) => (
          <section key={type} className="mb-12 px-4">
            <h3 className="text-slate-900 dark:text-white text-2xl font-bold mb-6">
              {type}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {booksByType[type].map((book) => (
                <BookItem
                  key={book.id}
                  book={book}
                  onRead={() => handleReadBook(book.id)}
                  isEditable={isEditable}
                  onUpdate={() => loadBooks()}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="col-span-full px-4">
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
              Nenhum livro encontrado!
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              Que tal cadastrar o primeiro?
            </p>
          </div>
        </div>
      )}
    </>
  );
}

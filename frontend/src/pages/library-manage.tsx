import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Book } from "@/models/models";
import useApiUrl from "@/hooks/useApiUrl";
import AddBook from "@/components/library/add-book";
import BookItem from "@/components/library/book-item";
import { useNavigate } from "react-router-dom";

export default function LibraryManagePage() {
  const [books, setBooks] = useState<Book[]>([]);
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

  const handleReadBook = (bookId: number) => {
    navigate(`/biblioteca/${bookId}`);
  };

  return (
    <div className="w-full mb-4 space-y-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Livros</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {books.length} {books.length === 1 ? 'livro' : 'livros'} cadastrados
            </p>
          </div>
          <AddBook onCreate={fetchBooks} />
        </div>

        <section className="mt-10 w-full">
          {books.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {books.map((book) => (
                <BookItem
                  key={book.id}
                  book={book}
                  onRead={() => handleReadBook(book.id)}
                  isEditable={true}
                  onUpdate={fetchBooks}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
                Nenhum livro cadastrado ainda!
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-sm">
                Adicione seu primeiro livro para começar
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

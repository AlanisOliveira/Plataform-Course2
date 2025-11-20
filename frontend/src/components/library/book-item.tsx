import { Book } from "@/models/models";
import useApiUrl from "@/hooks/useApiUrl";
import noImage from "../../../public/sem-foto.png";
import { BookOpen } from "lucide-react";
import EditBook from "./edit-book";
import DeleteBook from "./delete-book";

type Props = {
  book: Book;
  onRead: () => void;
  isEditable?: boolean;
  onUpdate: () => void;
};

export default function BookItem({ book, onRead, isEditable, onUpdate }: Props) {
  const { apiUrl } = useApiUrl();

  const bookCover = book.isCoverUrl
    ? book.urlCover
    : book.fileCover
    ? `${apiUrl}/uploads/${book.fileCover}`
    : noImage;

  const progressPercentage = book.total_pages
    ? (book.current_page / book.total_pages) * 100
    : 0;

  const hasProgress = book.current_page > 0 || book.epub_cfi_position;
  const isInProgress = hasProgress && book.is_read !== 1;

  return (
    <div className="flex flex-col bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all hover:-translate-y-1">
      {/* Capa do livro */}
      <div
        className="aspect-[2/3] bg-center bg-no-repeat bg-cover cursor-pointer relative"
        style={{ backgroundImage: `url(${bookCover})` }}
        onClick={onRead}
      >
        {!book.fileCover && !book.urlCover && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-700">
            <BookOpen className="w-12 h-12 text-slate-400" />
          </div>
        )}

        {/* Badge de tipo de arquivo */}
        <div className="absolute top-2 right-2">
          <span className="text-xs px-2 py-1 rounded-full bg-purple-600 text-white uppercase font-semibold shadow-lg">
            {book.file_type}
          </span>
        </div>

        {/* Badge de status */}
        {book.is_read === 1 ? (
          <div className="absolute top-2 left-2">
            <span className="text-xs px-2 py-1 rounded-full bg-green-600 text-white font-semibold shadow-lg">
              Concluído
            </span>
          </div>
        ) : isInProgress ? (
          <div className="absolute top-2 left-2">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white font-semibold shadow-lg">
              Lendo
            </span>
          </div>
        ) : null}
      </div>

      {/* Informações */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-sm line-clamp-2 mb-1 text-slate-900 dark:text-white">
          {book.title}
        </h3>

        {book.author && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mb-2">
            {book.author}
          </p>
        )}

        {/* Categorias */}
        {book.categories && (
          <div className="flex flex-wrap gap-1 mb-3">
            {book.categories.split(",").slice(0, 2).map((cat, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                {cat.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Progresso */}
        {progressPercentage > 0 && book.total_pages ? (
          <div className="mt-auto mb-3">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {Math.round(progressPercentage)}% concluído • Página {book.current_page} de {book.total_pages}
            </p>
          </div>
        ) : isInProgress && !book.total_pages ? (
          <div className="mt-auto mb-3">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Em progresso
            </p>
          </div>
        ) : null}

        {/* Botões */}
        {isEditable ? (
          <div className="flex gap-2 mt-auto">
            <EditBook book={book} onUpdate={onUpdate} />
            <DeleteBook book={book} onUpdate={onUpdate} />
          </div>
        ) : (
          <button
            onClick={onRead}
            className="w-full mt-auto flex items-center justify-center rounded-lg h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold tracking-wide transition-colors"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Ler
          </button>
        )}
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from "react";
import { Book, BookNote, BookHighlight, BookBookmark } from "@/models/models";
import { Button } from "@/components/ui/button";
import {
  StickyNote,
  Sun,
  Moon,
  Minus,
  Plus,
  PanelRightOpen,
  PanelRightClose,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import ePub, { Book as EpubBook, Rendition, Contents } from "epubjs";
import BookSidebar from "@/components/library/book-sidebar";
import NoteDialog from "@/components/library/note-dialog";

type Props = {
  book: Book;
  apiUrl: string;
  onProgressUpdate: (page: number, total: number) => void;
};

// Cores disponíveis para highlight
const HIGHLIGHT_COLORS = {
  yellow: "#fef08a",
  green: "#bbf7d0",
  blue: "#bfdbfe",
  pink: "#fbcfe8",
};

export default function EPUBReader({ book, apiUrl, onProgressUpdate }: Props) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [epubBook, setEpubBook] = useState<EpubBook | null>(null);
  const [rendition, setRendition] = useState<Rendition | null>(null);
  const [currentCfi, setCurrentCfi] = useState<string>(book.epub_cfi_position || "");

  // Carregar fontSize do localStorage ou usar padrão
  const savedFontSize = localStorage.getItem(`book-${book.id}-fontsize`);
  const [fontSize, setFontSize] = useState(
    savedFontSize ? parseInt(savedFontSize) : 100
  );

  // Carregar tema do localStorage
  const savedTheme = localStorage.getItem(`book-${book.id}-theme`) as
    | "light"
    | "dark"
    | "sepia"
    | null;
  const [theme, setTheme] = useState<"light" | "dark" | "sepia">(
    savedTheme || "light"
  );

  // Estados para seleção de texto e highlight
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightMenuPosition, setHighlightMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedCfiRange, setSelectedCfiRange] = useState<string>("");

  // Estados para anotações
  const [notes, setNotes] = useState<BookNote[]>([]);
  const [highlights, setHighlights] = useState<BookHighlight[]>([]);
  const [bookmarks, setBookmarks] = useState<BookBookmark[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [currentNote, setCurrentNote] = useState<BookNote | null>(null);

  const epubPath = `${apiUrl}/serve-content?path=${encodeURIComponent(
    book.file_path
  )}`;

  // Inicializar EPUB
  useEffect(() => {
    if (!viewerRef.current) return;

    console.log("Initializing EPUB with path:", epubPath);
    const loadedBook = ePub(epubPath);
    setEpubBook(loadedBook);

    const newRendition = loadedBook.renderTo(viewerRef.current, {
      width: "100%",
      height: "100%",
      spread: "none",
    });

    setRendition(newRendition);

    // Exibir o livro
    if (book.epub_cfi_position) {
      console.log("Displaying at saved position:", book.epub_cfi_position);
      newRendition.display(book.epub_cfi_position);
    } else {
      newRendition.display();
    }

    return () => {
      newRendition.destroy();
    };
  }, [epubPath, book.epub_cfi_position]);

  // Aplicar tema e font size quando o rendition estiver pronto
  useEffect(() => {
    if (!rendition) return;

    rendition.themes.fontSize(`${fontSize}%`);

    const themeStyles = getThemeStyles(theme);

    // Aplicar tema usando o método correto do epub.js
    rendition.themes.default({
      "body": {
        "color": `${themeStyles.color} !important`,
        "background-color": `${themeStyles.backgroundColor} !important`,
      },
      "p": {
        "color": `${themeStyles.color} !important`,
      },
      "span": {
        "color": `${themeStyles.color} !important`,
      },
      "h1, h2, h3, h4, h5, h6": {
        "color": `${themeStyles.color} !important`,
      },
      "a": {
        "color": `${themeStyles.color} !important`,
      },
      "li": {
        "color": `${themeStyles.color} !important`,
      },
      "div": {
        "color": `${themeStyles.color} !important`,
      }
    });
  }, [rendition, fontSize, theme]);

  // Listener para mudanças de localização
  useEffect(() => {
    if (!rendition) return;

    const handleRelocated = async (location: any) => {
      const cfi = location.start.cfi;
      console.log("Location changed to:", cfi);
      setCurrentCfi(cfi);

      // Salvar progresso
      try {
        await fetch(`${apiUrl}/api/books/${book.id}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            epub_cfi_position: cfi,
            current_page: 1,
          }),
        });
      } catch (error) {
        console.error("Erro ao salvar progresso:", error);
      }
    };

    rendition.on("relocated", handleRelocated);

    return () => {
      rendition.off("relocated", handleRelocated);
    };
  }, [rendition, apiUrl, book.id]);

  // Listener para seleção de texto
  useEffect(() => {
    if (!rendition) return;

    const handleSelected = (cfiRange: string, contents: Contents) => {
      console.log("Text selected:", cfiRange);
      setSelectedCfiRange(cfiRange);

      // Obter a seleção e sua posição
      const selection = contents.window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const iframe = contents.document.defaultView?.frameElement as HTMLIFrameElement;
        const iframeRect = iframe?.getBoundingClientRect();

        if (iframeRect) {
          setHighlightMenuPosition({
            x: iframeRect.left + rect.left + rect.width / 2,
            y: iframeRect.top + rect.bottom + 10,
          });
          setShowHighlightMenu(true);
        }
      }
    };

    rendition.on("selected", handleSelected);

    // Fechar menu ao clicar fora
    const handleClick = () => {
      setShowHighlightMenu(false);
    };

    document.addEventListener("click", handleClick);

    return () => {
      rendition.off("selected", handleSelected);
      document.removeEventListener("click", handleClick);
    };
  }, [rendition]);

  // Carregar highlights existentes e renderizá-los
  useEffect(() => {
    if (!rendition || highlights.length === 0) return;

    // Limpar highlights anteriores
    rendition.annotations.remove(undefined, "highlight");

    // Adicionar cada highlight
    highlights.forEach((highlight) => {
      if (highlight.cfi_position) {
        const color = (HIGHLIGHT_COLORS as any)[highlight.color] || HIGHLIGHT_COLORS.yellow;
        rendition.annotations.highlight(
          highlight.cfi_position,
          {},
          undefined,
          undefined,
          { fill: color, "fill-opacity": "0.3", "mix-blend-mode": "multiply" }
        );
      }
    });
  }, [rendition, highlights]);

  // Salvar fontSize e tema no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem(`book-${book.id}-fontsize`, fontSize.toString());
  }, [fontSize, book.id]);

  useEffect(() => {
    localStorage.setItem(`book-${book.id}-theme`, theme);
  }, [theme, book.id]);

  // Carregar anotações
  const loadAnnotations = useCallback(async () => {
    try {
      const [notesRes, highlightsRes, bookmarksRes] = await Promise.all([
        fetch(`${apiUrl}/api/books/${book.id}/book-notes`),
        fetch(`${apiUrl}/api/books/${book.id}/highlights`),
        fetch(`${apiUrl}/api/books/${book.id}/bookmarks`),
      ]);

      if (notesRes.ok) setNotes(await notesRes.json());
      if (highlightsRes.ok) setHighlights(await highlightsRes.json());
      if (bookmarksRes.ok) setBookmarks(await bookmarksRes.json());
    } catch (error) {
      console.error("Erro ao carregar anotações:", error);
    }
  }, [apiUrl, book.id]);

  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  const getThemeStyles = (themeName: string) => {
    switch (themeName) {
      case "dark":
        return { backgroundColor: "#0f172a", color: "#f1f5f9" };
      case "sepia":
        return { backgroundColor: "#fef3c7", color: "#78350f" };
      default:
        return { backgroundColor: "#ffffff", color: "#000000" };
    }
  };

  const increaseFontSize = () => {
    if (fontSize < 250) {
      const newSize = fontSize + 10;
      setFontSize(newSize);
      toast.success(`Tamanho da fonte: ${newSize}%`);
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 50) {
      const newSize = fontSize - 10;
      setFontSize(newSize);
      toast.success(`Tamanho da fonte: ${newSize}%`);
    }
  };

  const resetFontSize = () => {
    setFontSize(100);
    toast.success("Tamanho da fonte resetado");
  };

  const handleHighlight = async (color: keyof typeof HIGHLIGHT_COLORS) => {
    if (!selectedCfiRange || !rendition) return;

    try {
      // Salvar no banco de dados
      const response = await fetch(`${apiUrl}/api/books/${book.id}/highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cfi_position: selectedCfiRange,
          color: color,
          highlighted_text: "", // epub.js não fornece o texto facilmente
        }),
      });

      if (response.ok) {
        toast.success("Texto destacado!");
        loadAnnotations();
      }
    } catch (error) {
      toast.error("Erro ao destacar texto");
    }

    setShowHighlightMenu(false);
  };

  // Funções para notas
  const handleAddNote = () => {
    setCurrentNote(null);
    setShowNoteDialog(true);
  };

  const handleSaveNote = async (noteText: string) => {
    try {
      if (currentNote) {
        await fetch(
          `${apiUrl}/api/books/${book.id}/book-notes/${currentNote.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note_text: noteText }),
          }
        );
        toast.success("Nota atualizada!");
      } else {
        await fetch(`${apiUrl}/api/books/${book.id}/book-notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cfi_position: currentCfi,
            note_text: noteText,
          }),
        });
        toast.success("Nota adicionada!");
      }
      loadAnnotations();
    } catch (error) {
      toast.error("Erro ao salvar nota");
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await fetch(`${apiUrl}/api/books/${book.id}/book-notes/${noteId}`, {
        method: "DELETE",
      });
      toast.success("Nota deletada!");
      loadAnnotations();
    } catch (error) {
      toast.error("Erro ao deletar nota");
    }
  };

  const handleEditNote = (note: BookNote) => {
    setCurrentNote(note);
    setShowNoteDialog(true);
  };

  const handleDeleteHighlight = async (highlightId: number) => {
    try {
      await fetch(`${apiUrl}/api/books/${book.id}/highlights/${highlightId}`, {
        method: "DELETE",
      });
      toast.success("Destaque removido!");
      loadAnnotations();
    } catch (error) {
      toast.error("Erro ao remover destaque");
    }
  };

  // Funções para marcadores
  const handleAddBookmark = async () => {
    try {
      await fetch(`${apiUrl}/api/books/${book.id}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cfi_position: currentCfi,
          name: "Marcador EPUB",
        }),
      });
      toast.success("Marcador adicionado!");
      loadAnnotations();
    } catch (error) {
      toast.error("Erro ao adicionar marcador");
    }
  };

  const handleDeleteBookmark = async (bookmarkId: number) => {
    try {
      await fetch(`${apiUrl}/api/books/${book.id}/bookmarks/${bookmarkId}`, {
        method: "DELETE",
      });
      toast.success("Marcador removido!");
      loadAnnotations();
    } catch (error) {
      toast.error("Erro ao remover marcador");
    }
  };

  const handleGoToAnnotation = (cfiPosition?: string) => {
    if (cfiPosition && rendition) {
      rendition.display(cfiPosition);
    }
  };

  const goToNextPage = () => {
    if (rendition) {
      rendition.next();
    }
  };

  const goToPrevPage = () => {
    if (rendition) {
      rendition.prev();
    }
  };

  return (
    <div className="h-full flex relative bg-slate-50 dark:bg-slate-900">
      {/* Barra de ferramentas flutuante */}
      <div className="absolute top-4 right-4 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-2 flex items-center gap-2">
        {/* Controle de fonte */}
        <Button
          variant="ghost"
          size="sm"
          onClick={decreaseFontSize}
          disabled={fontSize <= 50}
          title="Diminuir fonte"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFontSize}
          title={`Resetar fonte (${fontSize}%)`}
          className="min-w-[60px]"
        >
          <span className="text-xs font-medium">{fontSize}%</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={increaseFontSize}
          disabled={fontSize >= 250}
          title="Aumentar fonte"
        >
          <Plus className="w-4 h-4" />
        </Button>

        {/* Seletor de tema */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              {theme === "dark" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Tema de leitura</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="w-4 h-4 mr-2" />
              Claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="w-4 h-4 mr-2" />
              Escuro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("sepia")}>
              Sépia
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" onClick={handleAddNote}>
          <StickyNote className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={handleAddBookmark}>
          <Bookmark className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Botões de navegação */}
      <Button
        variant="ghost"
        size="lg"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 shadow-lg"
        onClick={goToPrevPage}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      <Button
        variant="ghost"
        size="lg"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 shadow-lg"
        onClick={goToNextPage}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Menu de highlight flutuante */}
      {showHighlightMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-2 flex gap-1"
          style={{
            left: `${highlightMenuPosition.x}px`,
            top: `${highlightMenuPosition.y}px`,
            transform: "translateX(-50%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            className="w-8 h-8 p-0"
            style={{ backgroundColor: HIGHLIGHT_COLORS.yellow }}
            onClick={() => handleHighlight("yellow")}
            title="Amarelo"
          />
          <Button
            size="sm"
            className="w-8 h-8 p-0"
            style={{ backgroundColor: HIGHLIGHT_COLORS.green }}
            onClick={() => handleHighlight("green")}
            title="Verde"
          />
          <Button
            size="sm"
            className="w-8 h-8 p-0"
            style={{ backgroundColor: HIGHLIGHT_COLORS.blue }}
            onClick={() => handleHighlight("blue")}
            title="Azul"
          />
          <Button
            size="sm"
            className="w-8 h-8 p-0"
            style={{ backgroundColor: HIGHLIGHT_COLORS.pink }}
            onClick={() => handleHighlight("pink")}
            title="Rosa"
          />
        </div>
      )}

      {/* Viewer EPUB */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          ref={viewerRef}
          className="w-full h-full max-w-4xl mx-auto bg-white dark:bg-slate-800 shadow-2xl rounded-lg overflow-hidden"
        />
      </div>

      {/* Sidebar de anotações */}
      {showSidebar && (
        <BookSidebar
          bookId={book.id}
          fileType="epub"
          notes={notes}
          highlights={highlights}
          bookmarks={bookmarks}
          onClose={() => setShowSidebar(false)}
          onNoteClick={(note) => handleGoToAnnotation(note.cfi_position)}
          onHighlightClick={(highlight) =>
            handleGoToAnnotation(highlight.cfi_position)
          }
          onBookmarkClick={(bookmark) =>
            handleGoToAnnotation(bookmark.cfi_position)
          }
          onDeleteNote={handleDeleteNote}
          onDeleteHighlight={handleDeleteHighlight}
          onDeleteBookmark={handleDeleteBookmark}
          onEditNote={handleEditNote}
        />
      )}

      {/* Diálogo de nota */}
      <NoteDialog
        open={showNoteDialog}
        onClose={() => {
          setShowNoteDialog(false);
          setCurrentNote(null);
        }}
        onSave={handleSaveNote}
        existingNote={currentNote}
        cfiPosition={currentCfi}
      />
    </div>
  );
}

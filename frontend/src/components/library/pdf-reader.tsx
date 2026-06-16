import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { Book, BookNote, BookHighlight, BookBookmark } from "@/models/models";
import { Button } from "@/components/ui/button";
import {
  StickyNote,
  PanelRightOpen,
  PanelRightClose,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { highlightPlugin, MessageIcon } from "@react-pdf-viewer/highlight";
import { bookmarkPlugin } from "@react-pdf-viewer/bookmark";

// Import styles
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";

import BookSidebar from "@/components/library/book-sidebar";
import NoteDialog from "@/components/library/note-dialog";

type Props = {
  book: Book;
  apiUrl: string;
  onProgressUpdate: (page: number, total: number) => void;
};

export default function PDFReader({ book, apiUrl, onProgressUpdate }: Props) {
  // Garantir que current_page seja no mínimo 1
  const initialPage = Math.max(book.current_page || 1, 1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(book.total_pages || 0);

  // Estados para anotações
  const [notes, setNotes] = useState<BookNote[]>([]);
  const [highlights, setHighlights] = useState<BookHighlight[]>([]);
  const [bookmarks, setBookmarks] = useState<BookBookmark[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [currentNote, setCurrentNote] = useState<BookNote | null>(null);

  const pdfPath = `${apiUrl}/serve-content?path=${encodeURIComponent(
    book.file_path
  )}`;

  // Configurar plugins
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      defaultTabs[0], // Thumbnails
      defaultTabs[1], // Bookmarks
    ],
  });

  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget: (props) => (
      <div
        style={{
          background: "#eee",
          display: "flex",
          position: "absolute",
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
          transform: "translate(0, 8px)",
          zIndex: 1,
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleHighlightFromPlugin(props, "yellow")}
          className="bg-yellow-300 hover:bg-yellow-400 text-black"
        >
          Amarelo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleHighlightFromPlugin(props, "green")}
          className="bg-green-300 hover:bg-green-400 text-black"
        >
          Verde
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleHighlightFromPlugin(props, "blue")}
          className="bg-blue-300 hover:bg-blue-400 text-black"
        >
          Azul
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleHighlightFromPlugin(props, "pink")}
          className="bg-pink-300 hover:bg-pink-400 text-black"
        >
          Rosa
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCurrentNote(null);
            setShowNoteDialog(true);
          }}
        >
          <MessageIcon />
        </Button>
      </div>
    ),
    renderHighlightContent: (props) => (
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0, 0, 0, .3)",
          borderRadius: "2px",
          padding: "8px",
          position: "absolute",
          left: `${props.highlightAreas[0].left}%`,
          top: `${props.highlightAreas[0].top + props.highlightAreas[0].height}%`,
          zIndex: 1,
        }}
      >
        <div>{props.selectedText}</div>
      </div>
    ),
  });

  const bookmarkPluginInstance = bookmarkPlugin();

  // Carregar anotações
  const loadAnnotations = useCallback(async () => {
    try {
      const [notesRes, highlightsRes, bookmarksRes] = await Promise.all([
        apiFetch(`${apiUrl}/api/books/${book.id}/book-notes`),
        apiFetch(`${apiUrl}/api/books/${book.id}/highlights`),
        apiFetch(`${apiUrl}/api/books/${book.id}/bookmarks`),
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

  const handleDocumentLoad = (e: any) => {
    setTotalPages(e.doc.numPages);
    if (!book.total_pages) {
      onProgressUpdate(currentPage, e.doc.numPages);
    }
  };

  const handlePageChange = (e: any) => {
    const newPage = e.currentPage + 1; // @react-pdf-viewer uses 0-based index
    setCurrentPage(newPage);
    onProgressUpdate(newPage, totalPages);
  };

  const handleHighlightFromPlugin = async (props: any, color: string) => {
    const selectedText = props.selectedText;
    const pageNumber = props.selectionRegion.pageIndex + 1;

    try {
      await apiFetch(`${apiUrl}/api/books/${book.id}/highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_number: pageNumber,
          highlighted_text: selectedText,
          color: color,
        }),
      });
      toast.success("Texto destacado!");
      loadAnnotations();
    } catch (error) {
      toast.error("Erro ao destacar texto");
    }
  };

  // Funções para notas
  const handleAddNote = () => {
    setCurrentNote(null);
    setShowNoteDialog(true);
  };

  const handleSaveNote = async (noteText: string) => {
    try {
      if (currentNote) {
        await apiFetch(
          `${apiUrl}/api/books/${book.id}/book-notes/${currentNote.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note_text: noteText }),
          }
        );
        toast.success("Nota atualizada!");
      } else {
        await apiFetch(`${apiUrl}/api/books/${book.id}/book-notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page_number: currentPage,
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
      await apiFetch(`${apiUrl}/api/books/${book.id}/book-notes/${noteId}`, {
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
      await apiFetch(`${apiUrl}/api/books/${book.id}/highlights/${highlightId}`, {
        method: "DELETE",
      });
      toast.success("Destaque removido!");
      loadAnnotations();
    } catch (error) {
      toast.error("Erro ao remover destaque");
    }
  };

  const handleDeleteBookmark = async (bookmarkId: number) => {
    try {
      await apiFetch(`${apiUrl}/api/books/${book.id}/bookmarks/${bookmarkId}`, {
        method: "DELETE",
      });
      toast.success("Marcador removido!");
      loadAnnotations();
    } catch (error) {
      toast.error("Erro ao remover marcador");
    }
  };

  const handleGoToAnnotation = (pageNumber?: number) => {
    if (pageNumber && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      onProgressUpdate(pageNumber, totalPages);
    }
  };

  const handleAddBookmark = async () => {
    try {
      await apiFetch(`${apiUrl}/api/books/${book.id}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_number: currentPage,
          name: `Página ${currentPage}`,
        }),
      });
      toast.success("Marcador adicionado!");
      loadAnnotations();
    } catch (error) {
      toast.error("Erro ao adicionar marcador");
    }
  };

  return (
    <div className="h-full flex bg-slate-100 dark:bg-slate-900">
      {/* Área principal */}
      <div className="flex-1 flex flex-col">
        {/* Barra de ferramentas superior */}
        <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleAddNote}>
              <StickyNote className="w-4 h-4 mr-2" />
              Adicionar Nota
            </Button>
            <Button variant="ghost" size="sm" onClick={handleAddBookmark}>
              <Bookmark className="w-4 h-4 mr-2" />
              Adicionar Marcador
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? (
              <>
                <PanelRightClose className="w-4 h-4 mr-2" />
                Ocultar Anotações
              </>
            ) : (
              <>
                <PanelRightOpen className="w-4 h-4 mr-2" />
                Mostrar Anotações
              </>
            )}
          </Button>
        </div>

        {/* Área de visualização do PDF */}
        <div className="flex-1 overflow-hidden">
          <Worker
            workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}
          >
            <Viewer
              fileUrl={pdfPath}
              plugins={[
                defaultLayoutPluginInstance,
                highlightPluginInstance,
                bookmarkPluginInstance,
              ]}
              onDocumentLoad={handleDocumentLoad}
              onPageChange={handlePageChange}
              initialPage={initialPage - 1} // 0-based index
            />
          </Worker>
        </div>

        {/* Barra de progresso inferior */}
        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      totalPages > 0 ? (currentPage / totalPages) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Página {currentPage} de {totalPages} •{" "}
              {totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0}
              % concluído
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar de anotações */}
      {showSidebar && (
        <BookSidebar
          bookId={book.id}
          fileType="pdf"
          notes={notes}
          highlights={highlights}
          bookmarks={bookmarks}
          onClose={() => setShowSidebar(false)}
          onNoteClick={(note) => handleGoToAnnotation(note.page_number)}
          onHighlightClick={(highlight) =>
            handleGoToAnnotation(highlight.page_number)
          }
          onBookmarkClick={(bookmark) =>
            handleGoToAnnotation(bookmark.page_number)
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
        pageNumber={currentPage}
      />
    </div>
  );
}

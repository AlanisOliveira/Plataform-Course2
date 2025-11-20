import { useState } from "react";
import { BookNote, BookHighlight, BookBookmark } from "@/models/models";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    StickyNote,
    Highlighter,
    Bookmark,
    Trash2,
    Edit,
    X,
} from "lucide-react";

type Props = {
    bookId: number;
    fileType: "pdf" | "epub";
    notes: BookNote[];
    highlights: BookHighlight[];
    bookmarks: BookBookmark[];
    onClose: () => void;
    onNoteClick: (note: BookNote) => void;
    onHighlightClick: (highlight: BookHighlight) => void;
    onBookmarkClick: (bookmark: BookBookmark) => void;
    onDeleteNote: (noteId: number) => void;
    onDeleteHighlight: (highlightId: number) => void;
    onDeleteBookmark: (bookmarkId: number) => void;
    onEditNote: (note: BookNote) => void;
};

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins}min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `há ${diffDays}d`;

    return date.toLocaleDateString("pt-BR");
}

export default function BookSidebar({
    notes,
    highlights,
    bookmarks,
    onClose,
    onNoteClick,
    onHighlightClick,
    onBookmarkClick,
    onDeleteNote,
    onDeleteHighlight,
    onDeleteBookmark,
    onEditNote,
}: Props) {
    const [activeTab, setActiveTab] = useState("notes");

    const getHighlightColor = (color: string) => {
        const colors: Record<string, string> = {
            yellow: "bg-yellow-200 dark:bg-yellow-800",
            green: "bg-green-200 dark:bg-green-800",
            blue: "bg-blue-200 dark:bg-blue-800",
            pink: "bg-pink-200 dark:bg-pink-800",
        };
        return colors[color] || colors.yellow;
    };

    return (
        <div className="w-96 h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Anotações
                </h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="mx-4 mt-3 grid grid-cols-3">
                    <TabsTrigger value="notes" className="text-xs">
                        <StickyNote className="w-4 h-4 mr-1" />
                        Notas
                    </TabsTrigger>
                    <TabsTrigger value="highlights" className="text-xs">
                        <Highlighter className="w-4 h-4 mr-1" />
                        Destaques
                    </TabsTrigger>
                    <TabsTrigger value="bookmarks" className="text-xs">
                        <Bookmark className="w-4 h-4 mr-1" />
                        Marcadores
                    </TabsTrigger>
                </TabsList>

                {/* Notas */}
                <TabsContent value="notes" className="flex-1 m-0">
                    <ScrollArea className="h-full px-4">
                        {notes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <StickyNote className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Nenhuma nota ainda
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 py-4">
                                {notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors cursor-pointer group"
                                        onClick={() => onNoteClick(note)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {note.page_number ? `Página ${note.page_number}` : "EPUB"}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditNote(note);
                                                    }}
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteNote(note.id);
                                                    }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                                            {note.note_text}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                            {formatDate(note.created_at)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>

                {/* Destaques */}
                <TabsContent value="highlights" className="flex-1 m-0">
                    <ScrollArea className="h-full px-4">
                        {highlights.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <Highlighter className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Nenhum destaque ainda
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 py-4">
                                {highlights.map((highlight) => (
                                    <div
                                        key={highlight.id}
                                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors cursor-pointer group"
                                        onClick={() => onHighlightClick(highlight)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {highlight.page_number
                                                    ? `Página ${highlight.page_number}`
                                                    : "EPUB"}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteHighlight(highlight.id);
                                                }}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <p
                                            className={`text-sm text-slate-700 dark:text-slate-300 p-2 rounded ${getHighlightColor(
                                                highlight.color
                                            )}`}
                                        >
                                            {highlight.highlighted_text}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                            {formatDate(highlight.created_at)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>

                {/* Marcadores */}
                <TabsContent value="bookmarks" className="flex-1 m-0">
                    <ScrollArea className="h-full px-4">
                        {bookmarks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Nenhum marcador ainda
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 py-4">
                                {bookmarks.map((bookmark) => (
                                    <div
                                        key={bookmark.id}
                                        className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors cursor-pointer group flex items-center justify-between"
                                        onClick={() => onBookmarkClick(bookmark)}
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {bookmark.name || "Marcador sem nome"}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {bookmark.page_number
                                                    ? `Página ${bookmark.page_number}`
                                                    : "EPUB"}{" "}
                                                • {formatDate(bookmark.created_at)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteBookmark(bookmark.id);
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}

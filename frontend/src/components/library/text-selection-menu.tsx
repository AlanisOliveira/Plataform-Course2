import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Highlighter,
    StickyNote,
    Bookmark as BookmarkIcon,
} from "lucide-react";

type Props = {
    position: { x: number; y: number };
    selectedText: string;
    onHighlight: (color: string) => void;
    onAddNote: () => void;
    onAddBookmark: () => void;
    onClose: () => void;
};

const highlightColors = [
    { name: "Amarelo", value: "yellow", class: "bg-yellow-300 hover:bg-yellow-400" },
    { name: "Verde", value: "green", class: "bg-green-300 hover:bg-green-400" },
    { name: "Azul", value: "blue", class: "bg-blue-300 hover:bg-blue-400" },
    { name: "Rosa", value: "pink", class: "bg-pink-300 hover:bg-pink-400" },
];

export default function TextSelectionMenu({
    position,
    selectedText,
    onHighlight,
    onAddNote,
    onAddBookmark,
    onClose,
}: Props) {
    const [showColorPicker, setShowColorPicker] = useState(false);

    return (
        <div
            className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-2"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: "translate(-50%, -110%)",
            }}
            onMouseLeave={onClose}
        >
            {!showColorPicker ? (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => setShowColorPicker(true)}
                        title="Destacar texto"
                    >
                        <Highlighter className="w-4 h-4 mr-1" />
                        <span className="text-xs">Destacar</span>
                    </Button>

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3"
                        onClick={onAddNote}
                        title="Adicionar nota"
                    >
                        <StickyNote className="w-4 h-4 mr-1" />
                        <span className="text-xs">Nota</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3"
                        onClick={onAddBookmark}
                        title="Adicionar marcador"
                    >
                        <BookmarkIcon className="w-4 h-4 mr-1" />
                        <span className="text-xs">Marcar</span>
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 px-2">
                        Escolha a cor:
                    </p>
                    {highlightColors.map((color) => (
                        <button
                            key={color.value}
                            className={`w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600 ${color.class} transition-transform hover:scale-110`}
                            onClick={() => {
                                onHighlight(color.value);
                                onClose();
                            }}
                            title={color.name}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

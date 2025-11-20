import { useState, useEffect } from "react";
import { BookNote } from "@/models/models";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = {
    open: boolean;
    onClose: () => void;
    onSave: (noteText: string) => void;
    existingNote?: BookNote | null;
    pageNumber?: number;
    cfiPosition?: string;
};

export default function NoteDialog({
    open,
    onClose,
    onSave,
    existingNote,
    pageNumber,
    cfiPosition,
}: Props) {
    const [noteText, setNoteText] = useState("");

    useEffect(() => {
        if (existingNote) {
            setNoteText(existingNote.note_text);
        } else {
            setNoteText("");
        }
    }, [existingNote, open]);

    const handleSave = () => {
        if (noteText.trim()) {
            onSave(noteText.trim());
            setNoteText("");
            onClose();
        }
    };

    const handleClose = () => {
        setNoteText("");
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {existingNote ? "Editar Nota" : "Adicionar Nota"}
                    </DialogTitle>
                    <DialogDescription>
                        {pageNumber
                            ? `Página ${pageNumber}`
                            : cfiPosition
                                ? "Posição no EPUB"
                                : "Adicione uma nota à página atual"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="note-text">Texto da nota</Label>
                        <Textarea
                            id="note-text"
                            placeholder="Digite sua nota aqui..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={6}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={!noteText.trim()}>
                        {existingNote ? "Atualizar" : "Salvar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import { Course } from "@/models/models";
import noImage from "../../../public/sem-foto.png";
import { Button } from "../ui/button";
import DeleteCourse from "./delete-course";
import EditCourse from "./edit-course";
import useApiUrl from "@/hooks/useApiUrl";
import CoursePercentage from "../course-percentage";
import { typeColors } from "./course-filters";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

type Props = {
  course: Course;
  onPlay: () => void;
  isEditable?: boolean;
  onUpdate: () => void;
};

export default function CourseItem({
  course,
  onPlay,
  isEditable,
  onUpdate,
}: Props) {
  const { apiUrl } = useApiUrl();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const courseCover = course.isCoverUrl
    ? course.urlCover
    : course.fileCover
    ? `${apiUrl}/uploads/${course.fileCover}`
    : noImage;

  const colors = typeColors[course.course_type || "Outro"] || typeColors["Outro"];

  const handleRescanLessons = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`${apiUrl}/api/courses/${course.id}/rescan`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Erro ao atualizar lições");
        return;
      }

      const data = await response.json();
      toast.success(data.message || "Lições atualizadas com sucesso!");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 transition-all hover:shadow-xl hover:-translate-y-1">
      {/* Imagem do Curso */}
      <div
        className="bg-center bg-no-repeat aspect-video bg-cover cursor-pointer"
        style={{ backgroundImage: `url(${courseCover})` }}
        onClick={onPlay}
      />

      {/* Conteúdo do Card */}
      <div className="p-5 flex flex-col flex-1">
        {/* Badge de Tipo e Progresso */}
        <div className="flex justify-between items-center mb-3">
          {course.course_type && (
            <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text} ${colors.badgeBg} px-2 py-1 rounded-full`}>
              {course.course_type}
            </span>
          )}
          <div className="ml-auto">
            <CoursePercentage courseId={course.id} />
          </div>
        </div>

        {/* Título */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
          {course.name}
        </h3>

        {/* Categorias */}
        {course.categories && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {course.categories.split(",").slice(0, 3).map((cat, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                {cat.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Botões */}
        <div className="mt-auto flex gap-2">
          {isEditable ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRescanLessons}
                disabled={isRefreshing}
                title="Atualizar lições do curso"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <EditCourse course={course} onUpdate={onUpdate} />
              <DeleteCourse course={course} onUpdate={onUpdate} />
            </>
          ) : (
            <button
              onClick={onPlay}
              className="w-full flex items-center justify-center rounded-lg h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold tracking-wide transition-colors"
            >
              <span>Assistir Curso</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

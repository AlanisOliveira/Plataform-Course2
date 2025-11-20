import { useState, useEffect } from "react";
import { Course } from "@/models/models";
import useApiUrl from "@/hooks/useApiUrl";
import { toast } from "sonner";
import ContinueWatching from "@/components/dashboard/continue-watching";
import RecentlyAdded from "@/components/dashboard/recently-added";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Props = {};

export default function HomeScreen({}: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const { apiUrl } = useApiUrl();

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/courses/with-progress`);
      if (!response.ok) throw new Error("Falha ao buscar cursos");

      const data = await response.json();
      setCourses(data);
    } catch (error) {
      toast.error("Erro ao carregar cursos.");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filtrar cursos em andamento (não mostrar os 100% completos)
  const inProgressCourses = courses
    .filter(
      (c) =>
        c.has_progress &&
        (c.completion_percentage || 0) > 0 &&
        (c.completion_percentage || 0) < 100
    )
    .sort((a, b) => {
      const dateA = a.last_watched_at ? new Date(a.last_watched_at).getTime() : 0;
      const dateB = b.last_watched_at ? new Date(b.last_watched_at).getTime() : 0;
      return dateB - dateA;
    });

  // Cursos recém adicionados (ordenar por ID decrescente, IDs maiores = mais recentes)
  const recentlyAddedCourses = [...courses]
    .sort((a, b) => b.id - a.id)
    .slice(0, 8);

  return (
    <div className="py-6 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Minhas Receitas</h1>
      </div>

      <div className="space-y-8">
        {inProgressCourses.length > 0 && (
          <ContinueWatching courses={inProgressCourses} onUpdate={fetchCourses} />
        )}

        {recentlyAddedCourses.length > 0 && (
          <RecentlyAdded courses={recentlyAddedCourses} onUpdate={fetchCourses} />
        )}

        {courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">
              Nenhum curso cadastrado ainda!
            </p>
            <Link to="/receitas/cadastradas">
              <Button>Começar a adicionar cursos</Button>
            </Link>
          </div>
        )}

        {courses.length > 0 && inProgressCourses.length === 0 && (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">
              Você ainda não começou nenhum curso!
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mb-4">
              Escolha um curso abaixo ou navegue pela biblioteca completa.
            </p>
            <Link to="/receitas/cadastradas">
              <Button>Ver Biblioteca</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

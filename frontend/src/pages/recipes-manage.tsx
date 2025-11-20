import { useState, useEffect } from "react";
import { toast } from "sonner";
import CoursesList from "@/components/courses/courses-list";
import { Course } from "@/models/models";
import useApiUrl from "@/hooks/useApiUrl";
import AddCourse from "@/components/courses/add-course";

export default function RecipesManage() {
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

  return (
    <>
      <div className="w-full mb-4 space-y-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Gestão de Receitas</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {courses.length} {courses.length === 1 ? 'receita' : 'receitas'} cadastradas
              </p>
            </div>
            <AddCourse onCreate={() => fetchCourses()} />
          </div>
          <section className="mt-10 w-full">
            <CoursesList courses={courses} isEditable />
          </section>
        </div>
      </div>
    </>
  );
}

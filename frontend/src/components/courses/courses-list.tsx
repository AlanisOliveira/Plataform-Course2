import { Course } from "@/models/models";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import CourseItem from "./course-item";
import useApiUrl from "@/hooks/useApiUrl";
import CourseFilters from "./course-filters";

type Props = {
  isEditable?: boolean;
  courses: Course[] | null;
};

export default function CoursesList({
  isEditable = false,
  courses: providedCourses,
}: Props) {
  const [courses, setCourses] = useState<Course[] | null>();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const navigate = useNavigate();
  const { apiUrl } = useApiUrl();

  function handlePlayButtonClick(courseId: number) {
    navigate(`/receitas/${courseId}`);
  }

  const loadCourses = async () => {
    try {
      // Usar o novo endpoint com informações de progresso
      const response = await apiFetch(`${apiUrl}/api/courses/with-progress`);
      if (!response.ok) throw new Error("Falha ao buscar cursos");

      const courses = await response.json();
      if (courses) {
        setCourses(courses);
        return;
      }
      toast.error("Erro ao carregar cursos.");
    } catch (error) {
      toast.error("Erro ao carregar cursos.");
    }
  };

  useEffect(() => {
    if (providedCourses && providedCourses.length > 0) {
      setCourses(providedCourses);
    } else {
      loadCourses();
    }
  }, [providedCourses]);

  // Filtrar cursos
  const filteredCourses = courses?.filter((course) => {
    // Filtro por tipo
    if (selectedType && course.course_type !== selectedType) {
      return false;
    }

    // Filtro por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = course.name.toLowerCase().includes(searchLower);
      const matchesCategories = course.categories
        ?.toLowerCase()
        .includes(searchLower);
      const matchesType = course.course_type?.toLowerCase().includes(searchLower);
      return matchesName || matchesCategories || matchesType;
    }

    return true;
  });

  // Agrupar cursos por tipo
  const coursesByType: Record<string, Course[]> = {};
  filteredCourses?.forEach((course) => {
    const type = course.course_type || "Outros";
    if (!coursesByType[type]) {
      coursesByType[type] = [];
    }
    coursesByType[type].push(course);
  });

  const types = Object.keys(coursesByType).sort();

  return (
    <>
      {/* Filtros acima de tudo */}
      {courses && courses.length > 0 && (
        <div className="px-4 mb-6">
          <CourseFilters
            courses={courses}
            selectedType={selectedType}
            searchTerm={searchTerm}
            onTypeSelect={setSelectedType}
            onSearchChange={setSearchTerm}
          />
        </div>
      )}

      {/* Cursos agrupados por tipo */}
      {types.length > 0 ? (
        types.map((type) => (
          <section key={type} className="mb-12 px-4">
            <h3 className="text-slate-900 dark:text-white text-2xl font-bold mb-6">
              {type}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {coursesByType[type].map((course) => (
                <CourseItem
                  key={course.id}
                  course={course}
                  onPlay={() => handlePlayButtonClick(course.id)}
                  isEditable={isEditable}
                  onUpdate={() => loadCourses()}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="col-span-full px-4">
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
              Nenhum curso encontrado!
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">
              Que tal cadastrar o primeiro?
            </p>
          </div>
        </div>
      )}
    </>
  );
}

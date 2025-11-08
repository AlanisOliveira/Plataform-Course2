import { Course } from "@/models/models";
import { Search, X, ChevronDown } from "lucide-react";
import { Input } from "../ui/input";
import { useState } from "react";

type Props = {
  courses: Course[];
  selectedType: string | null;
  searchTerm: string;
  onTypeSelect: (type: string | null) => void;
  onSearchChange: (search: string) => void;
};

// Cores modernas e vibrantes para cada tipo
const typeColors: Record<string, { bg: string; text: string; badgeBg: string }> = {
  "Tecnologia": { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", badgeBg: "bg-blue-500/10 dark:bg-blue-500/20" },
  "Cozinha": { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", badgeBg: "bg-orange-500/10 dark:bg-orange-500/20" },
  "Design": { bg: "bg-pink-500/10", text: "text-pink-600 dark:text-pink-400", badgeBg: "bg-pink-500/10 dark:bg-pink-500/20" },
  "Negócios": { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20" },
  "Marketing": { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", badgeBg: "bg-purple-500/10 dark:bg-purple-500/20" },
  "Música": { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", badgeBg: "bg-indigo-500/10 dark:bg-indigo-500/20" },
  "Idiomas": { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", badgeBg: "bg-cyan-500/10 dark:bg-cyan-500/20" },
  "Fitness": { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", badgeBg: "bg-red-500/10 dark:bg-red-500/20" },
  "Fotografia": { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", badgeBg: "bg-amber-500/10 dark:bg-amber-500/20" },
  "Outro": { bg: "bg-gray-500/10", text: "text-gray-600 dark:text-gray-400", badgeBg: "bg-gray-500/10 dark:bg-gray-500/20" },
};

export { typeColors };

export default function CourseFilters({
  courses,
  selectedType,
  searchTerm,
  onTypeSelect,
  onSearchChange,
}: Props) {
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  // Agrupar cursos por tipo
  const coursesByType = courses.reduce((acc, course) => {
    const type = course.course_type || "Sem Tipo";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  // Ordenar tipos alfabeticamente
  const sortedTypes = Object.keys(coursesByType).sort();

  return (
    <div className="mb-8">
      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Busca */}
        <div className="relative w-full sm:flex-1 max-w-md">
          <div className="flex w-full items-stretch rounded-xl h-12 shadow-sm">
            <div className="flex items-center justify-center pl-4 rounded-l-xl border-y border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex w-full min-w-0 flex-1 rounded-r-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 border-y border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-full placeholder:text-slate-500 px-4 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Select de Tipo */}
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            className="flex w-full sm:w-auto h-12 items-center justify-between gap-x-2 rounded-lg bg-white dark:bg-slate-800 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-w-[200px]"
          >
            <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">
              {selectedType || "Todos os tipos"}
            </p>
            <ChevronDown className={`text-slate-500 h-4 w-4 transition-transform ${isTypeDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {isTypeDropdownOpen && (
            <div className="absolute top-14 left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-2 max-h-80 overflow-y-auto">
              <button
                onClick={() => {
                  onTypeSelect(null);
                  setIsTypeDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Todos os tipos ({courses.length})
              </button>
              {sortedTypes.map((type) => {
                const colors = typeColors[type] || typeColors["Outro"];
                const count = coursesByType[type].length;

                return (
                  <button
                    key={type}
                    onClick={() => {
                      onTypeSelect(type);
                      setIsTypeDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 ${
                      selectedType === type ? colors.text + " font-semibold" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {type} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

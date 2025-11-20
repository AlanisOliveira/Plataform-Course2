import { Course } from "@/models/models";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";

type Props = {
  courses: Course[];
};

export default function QuickStats({ courses }: Props) {
  if (!courses || courses.length === 0) return null;

  const totalCourses = courses.length;
  const inProgressCount = courses.filter(
    (c) => c.has_progress && (c.completion_percentage || 0) > 0 && (c.completion_percentage || 0) < 100
  ).length;
  const completedCount = courses.filter(
    (c) => (c.completion_percentage || 0) === 100
  ).length;
  const notStartedCount = courses.filter(
    (c) => !c.has_progress || (c.completion_percentage || 0) === 0
  ).length;

  const overallProgress = courses.reduce((sum, course) => sum + (course.completion_percentage || 0), 0) / totalCourses;

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Visão Geral
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total de Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {totalCourses}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {inProgressCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {completedCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Progresso Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {overallProgress.toFixed(0)}%
            </div>
            <Progress value={overallProgress} className="h-2" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

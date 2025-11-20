import { Course } from "@/models/models";
import CourseItem from "../courses/course-item";
import { useNavigate } from "react-router-dom";

type Props = {
  courses: Course[];
  onUpdate: () => void;
};

export default function RecentCourses({ courses, onUpdate }: Props) {
  const navigate = useNavigate();

  function handlePlayButtonClick(courseId: number) {
    navigate(`/receitas/${courseId}`);
  }

  if (!courses || courses.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Assistidos recentemente
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {courses.map((course) => (
          <CourseItem
            key={course.id}
            course={course}
            onPlay={() => handlePlayButtonClick(course.id)}
            isEditable={false}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </section>
  );
}

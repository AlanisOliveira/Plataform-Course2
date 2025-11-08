import { Lesson, Modules } from "@/models/models";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import LessonListItem from "./lesson-list-item";
import useSelectedLesson from "@/hooks/useSelectedLesson";

import {
  calculateCompletionPercentage,
  setLastViewedLesson,
} from "@/utils/utils";

import { toast } from "sonner";
import ProgressCard from "../progress-card";
import { Folder } from "lucide-react";

type Props = { modules: Modules; onUpdate: () => void; courseId: string };

type HierarchyNode = {
  [key: string]: HierarchyNode | Lesson[] | any;
  _lessons?: Lesson[];
};

// Componente recursivo para renderizar a hierarquia
function HierarchyItem({
  title,
  node,
  path,
  courseId,
  onUpdate,
}: {
  title: string;
  node: HierarchyNode;
  path: string;
  courseId: string;
  onUpdate: () => void;
}) {
  const { selectLesson, selectedLesson } = useSelectedLesson();

  function handleCompleteLesson() {
    try {
      onUpdate();
    } catch {
      toast.error("erro ao atualizar progresso");
    }
  }

  const lessons = node._lessons || [];
  const subfolders = Object.entries(node).filter(
    ([key]) => key !== "_lessons"
  );

  // Calcular todas as aulas recursivamente para mostrar o progresso
  const getAllLessons = (n: HierarchyNode): Lesson[] => {
    let allLessons: Lesson[] = [...(n._lessons || [])];
    Object.entries(n).forEach(([key, value]) => {
      if (key !== "_lessons" && typeof value === "object") {
        allLessons = [...allLessons, ...getAllLessons(value)];
      }
    });
    return allLessons;
  };

  const allLessons = getAllLessons(node);

  return (
    <AccordionItem className="p-4" value={path} key={path}>
      <AccordionTrigger className="" title={title}>
        <div className="w-full space-y-2">
          <div className="flex items-center gap-2 px-2">
            <Folder className="h-4 w-4 text-purple-500" />
            <span className="line-clamp-1 text-sm text-left">{title}</span>
          </div>
          <ProgressCard value={calculateCompletionPercentage(allLessons)} />
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {/* Renderizar subpastas primeiro */}
        {subfolders.length > 0 && (
          <Accordion type="single" collapsible className="w-full pl-4">
            {subfolders
              .sort((a, b) =>
                a[0].localeCompare(b[0], undefined, {
                  numeric: true,
                  sensitivity: "base",
                })
              )
              .map(([subTitle, subNode]) => (
                <HierarchyItem
                  key={`${path}/${subTitle}`}
                  title={subTitle}
                  node={subNode as HierarchyNode}
                  path={`${path}/${subTitle}`}
                  courseId={courseId}
                  onUpdate={onUpdate}
                />
              ))}
          </Accordion>
        )}

        {/* Renderizar aulas desta pasta */}
        {lessons.map((lesson, index) => (
          <LessonListItem
            key={lesson.id}
            lesson={lesson}
            index={index + 1}
            onSelect={() => {
              selectLesson(lesson);
              setLastViewedLesson(courseId, lesson);
            }}
            selectedLessonId={selectedLesson?.id}
            onComplete={handleCompleteLesson}
          />
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}

export default function ModuleList({ modules, onUpdate, courseId }: Props) {
  return (
    <div className="">
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(modules)
          .sort((a, b) =>
            a[0].localeCompare(b[0], undefined, {
              numeric: true,
              sensitivity: "base",
            })
          )
          .map(([title, node]) => (
            <HierarchyItem
              key={title}
              title={title}
              node={node as HierarchyNode}
              path={title}
              courseId={courseId}
              onUpdate={onUpdate}
            />
          ))}
      </Accordion>
    </div>
  );
}

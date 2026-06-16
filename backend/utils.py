import os
from pathlib import Path
from app import db, Lesson
from video_utils import get_video_duration_v1
from app import db, Course


def find_subtitle_for_media(media_path):
    base_path = Path(media_path).with_suffix("")
    candidates = [
        f"{base_path}-pt-br.vtt",
        f"{base_path}.pt-BR.vtt",
        f"{base_path}.vtt",
        f"{base_path}-pt-br.srt",
        f"{base_path}.pt-BR.srt",
        f"{base_path}.srt",
    ]

    for candidate in candidates:
        if os.path.exists(candidate):
            print(f"Legenda detectada: {candidate}")
            return candidate

    return ""

def list_and_register_lessons(course_path, course_id):
    if not os.path.exists(course_path):
        error_msg = f"ERRO: Path do curso não existe: {course_path}"
        print(error_msg)
        raise FileNotFoundError(error_msg)

    if not os.path.isdir(course_path):
        error_msg = f"ERRO: Path do curso não é um diretório: {course_path}"
        print(error_msg)
        raise NotADirectoryError(error_msg)

    existing_lessons = Lesson.query.filter_by(course_id=course_id).all()
    existing_by_media_path = {}
    for lesson in existing_lessons:
        media_path = lesson.video_url or lesson.pdf_url
        if media_path:
            existing_by_media_path[media_path] = lesson

    seen_paths = set()
    list_and_register_lessons_in_directory(course_path, course_id, "", existing_by_media_path, seen_paths)

    for lesson in existing_lessons:
        media_path = lesson.video_url or lesson.pdf_url
        if media_path and media_path not in seen_paths:
            db.session.delete(lesson)

    db.session.commit()

def list_and_register_lessons_in_directory(directory, course_id, hierarchy_prefix="", existing_by_media_path=None, seen_paths=None):
    existing_by_media_path = existing_by_media_path or {}
    seen_paths = seen_paths if seen_paths is not None else set()
    entries = list(os.scandir(directory))
    entries.sort(key=lambda e: (e.is_file(), os.path.splitext(e.name)[0]))

    for entry in entries:
        if entry.is_dir():
            new_hierarchy_prefix = f"{hierarchy_prefix}/{entry.name}" if hierarchy_prefix else entry.name
            list_and_register_lessons_in_directory(
                entry.path,
                course_id,
                new_hierarchy_prefix,
                existing_by_media_path,
                seen_paths,
            )
        elif entry.is_file() and entry.name.lower().endswith((".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm", ".pdf", ".ts", ".txt", "html")):
            title = os.path.splitext(entry.name)[0]
            is_pdf = entry.name.lower().endswith(".pdf")

            duration = get_video_duration_v1(entry.path)

            video_url = "" if is_pdf else entry.path
            pdf_url = entry.path if is_pdf else ""

            subtitle_url = ""
            if not is_pdf:
                subtitle_url = find_subtitle_for_media(entry.path)

            media_path = pdf_url or video_url
            seen_paths.add(media_path)
            lesson = existing_by_media_path.get(media_path)

            if lesson:
                lesson.title = title
                lesson.module = hierarchy_prefix
                lesson.hierarchy_path = hierarchy_prefix
                lesson.video_url = video_url
                lesson.pdf_url = pdf_url
                lesson.subtitle_url = subtitle_url
                lesson.duration = str(duration)
            else:
                lesson = Lesson(
                    course_id=course_id,
                    title=title,
                    module=hierarchy_prefix,
                    hierarchy_path=hierarchy_prefix,
                    video_url=video_url,
                    duration=str(duration),
                    progressStatus='not_started',
                    isCompleted=0,
                    time_elapsed='0',
                    pdf_url=pdf_url,
                    subtitle_url=subtitle_url
                )
                db.session.add(lesson)

def scan_data_directory_and_register_courses(profile_id=None):
    courses_root = os.environ.get('COURSES_INTERNAL_PATH', '/cursos')
    if not os.path.isdir(courses_root):
        raise FileNotFoundError(f"Diretório de cursos não encontrado: {courses_root}")

    entries = list(os.scandir(courses_root))

    for entry in entries:
        if entry.is_dir():
            if course_already_exists(entry.path, profile_id):
                continue

            course = Course(
                name=entry.name,
                path=entry.path,
                isCoverUrl=0,
                fileCover=None,
                urlCover=None,
                profile_id=profile_id
            )

            db.session.add(course)
            db.session.commit()

            list_and_register_lessons_in_directory(course.path, course.id)

def course_already_exists(path, profile_id=None):
    query = Course.query.filter(Course.path == path)
    if profile_id is not None:
        query = query.filter(Course.profile_id == profile_id)
    return bool(query.first())

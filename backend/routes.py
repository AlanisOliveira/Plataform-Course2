
from flask import request, jsonify, send_file, abort, send_from_directory, render_template, make_response
from werkzeug.utils import secure_filename
import os
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import joinedload

from app import app, db, Lesson, Course
from utils import list_and_register_lessons, scan_data_directory_and_register_courses
from video_utils import open_video

@app.route('/api/debug/routes', methods=['GET'])
def debug_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'path': str(rule)
        })
    return jsonify(routes)

@app.route('/api/courses', methods=['GET'])
def list_courses():
    courses = Course.query.all()
    return jsonify([{'id': course.id, 'name': course.name, 'path': course.path, 'isCoverUrl': course.isCoverUrl, 'fileCover': course.fileCover, 'urlCover': course.urlCover, 'categories': course.categories, 'course_type': course.course_type } for course in courses])

@app.route('/api/courses/<int:course_id>/lessons', methods=['GET'])
def list_lessons_for_course(course_id):
    lessons = Lesson.query \
        .filter_by(course_id=course_id) \
        .options(joinedload(Lesson.course)) \
        .all()

    response = [{
        'course_title': lesson.course.name if lesson.course else None,
        'id': lesson.id,
        'title': lesson.title,
        'module': lesson.module,
        'progressStatus': lesson.progressStatus,
        'isCompleted': lesson.isCompleted,
        'hierarchy_path': lesson.hierarchy_path,
        'time_elapsed': lesson.time_elapsed,
        'video_url': lesson.video_url,
        'duration': lesson.duration,
        'pdf_url': lesson.pdf_url,
    } for lesson in lessons]
    
    return jsonify(response)


@app.route("/serve-content", methods=['GET'])
def serve_lesson_content():
    path = request.args.get('path')

    if not os.path.exists(path):
        abort(404)
        
    if path.lower().endswith(".ts") or path.lower().endswith(".mkv"):
        open_video(path)
        response = make_response(send_from_directory("assets", "video-aviso-reproducao.mp4"))
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    response = make_response(send_file(path))
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

@app.route('/api/update-lesson-progress', methods=['POST'])
def update_lesson_for_end_progress():
    data = request.json
    lesson_id = data.get('lessonId')
    progress_status = data.get('progressStatus')
    is_completed = data.get('isCompleted')
    time_elapsed = data.get('time_elapsed', None)

    lesson = Lesson.query.get(lesson_id)
    if lesson:
        if progress_status:
            lesson.progressStatus = progress_status
        if is_completed is not None:
            lesson.isCompleted = is_completed
        if time_elapsed is not None:
            lesson.time_elapsed = time_elapsed

        db.session.commit()
        return jsonify({'message': 'Progresso da lição atualizado com sucesso'})
    else:
        return jsonify({'error': 'Lição não encontrada'}), 404


@app.route('/api/courses', methods=['POST'])
def add_course():
    try:
        name = request.form['name']
        path = request.form['path']
        categories = request.form.get('categories', None)
        course_type = request.form.get('course_type', None)

        # VALIDAÇÃO: Verificar se o path existe ANTES de criar o curso
        if not os.path.exists(path):
            return jsonify({'error': f'Path do curso não existe: {path}'}), 400

        if not os.path.isdir(path):
            return jsonify({'error': f'Path não é um diretório válido: {path}'}), 400

        isCoverUrl = 1 if 'imageURL' in request.form and request.form['imageURL'] else 0
        urlCover = request.form.get('imageURL', None)

        if not isCoverUrl:
            image_file = request.files.get('imageFile')
            if image_file:
                filename = secure_filename(image_file.filename)
                fileCover = filename

                # Criar diretório uploads se não existir
                upload_folder = app.config['UPLOAD_FOLDER']
                if not os.path.exists(upload_folder):
                    os.makedirs(upload_folder)

                image_file.save(os.path.join(upload_folder, filename))
            else:
                fileCover = None
        else:
            fileCover = None

        course = Course(
            name=name,
            path=path,
            isCoverUrl=isCoverUrl,
            fileCover=fileCover,
            urlCover=urlCover if isCoverUrl else None,
            categories=categories,
            course_type=course_type
        )
        print(f"Saving course with file cover: {course.fileCover}")
        db.session.add(course)
        db.session.commit()

        # Registrar lições com tratamento de erro
        try:
            list_and_register_lessons(request.form['path'], course.id)
        except (FileNotFoundError, NotADirectoryError) as e:
            # Se falhar ao registrar lições, fazer rollback do curso
            db.session.delete(course)
            db.session.commit()
            return jsonify({'error': f'Erro ao registrar lições: {str(e)}'}), 400

        return jsonify({'id': course.id, 'name': course.name}), 201
    except KeyError as e:
        db.session.rollback()
        return jsonify({'error': f'Campo obrigatório faltando: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao adicionar curso: {str(e)}")
        return jsonify({'error': f'Erro ao adicionar curso: {str(e)}'}), 500


@app.route('/api/courses/add-all', methods=['POST'])
def add_courses_automatically():
    scan_data_directory_and_register_courses()
    return jsonify({}), 201


@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    course = Course.query.get_or_404(course_id)
    return jsonify({'id': course.id, 'name': course.name})

@app.route('/api/lessons/<int:lesson_id>', methods=['GET'])
def get_lesson_elapsed_time(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    print(lesson.time_elapsed)
    return jsonify({"elapsedTime": lesson.time_elapsed}) 


@app.route('/api/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    try:
        course = Course.query.get_or_404(course_id)
        old_path = course.path
        new_path = request.form['path']

        # VALIDAÇÃO: Se o path mudou, verificar se o novo path é válido
        if old_path != new_path:
            if not os.path.exists(new_path):
                return jsonify({'error': f'Path do curso não existe: {new_path}'}), 400

            if not os.path.isdir(new_path):
                return jsonify({'error': f'Path não é um diretório válido: {new_path}'}), 400

        course.name = request.form['name']
        course.path = new_path
        course.categories = request.form.get('categories', None)
        course.course_type = request.form.get('course_type', None)
        isCoverUrl = 1 if 'imageURL' in request.form and request.form['imageURL'] else 0

        if isCoverUrl:
            course.urlCover = request.form.get('imageURL')
            course.isCoverUrl = 1
            course.fileCover = None
        else:
            image_file = request.files.get('imageFile')
            if image_file:
                filename = secure_filename(image_file.filename)
                course.fileCover = filename
                course.isCoverUrl = 0
                course.urlCover = None
                image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            else:
                course.fileCover = course.fileCover
        print(f"Saving course with file cover: {course.fileCover}")
        db.session.commit()

        # Se o path mudou, re-registrar as lições
        if old_path != course.path:
            try:
                list_and_register_lessons(course.path, course_id)
            except (FileNotFoundError, NotADirectoryError) as e:
                # Se falhar, reverter o path para o antigo
                course.path = old_path
                db.session.commit()
                return jsonify({'error': f'Erro ao registrar lições no novo path: {str(e)}'}), 400

        return jsonify({'id': course.id, 'name': course.name, 'path': course.path, 'isCoverUrl': course.isCoverUrl, 'fileCover': course.fileCover, 'urlCover': course.urlCover, 'categories': course.categories, 'course_type': course.course_type})

    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar curso: {str(e)}")
        return jsonify({'error': f'Erro ao atualizar curso: {str(e)}'}), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    print(course)
    print(course_id)
    
    Lesson.query.filter_by(course_id=course_id).delete()
    
    if course.fileCover:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], course.fileCover))
        except FileNotFoundError:
            print(f"Arquivo {course.fileCover} não encontrado.")

    db.session.delete(course)
    db.session.commit()
    return jsonify({'message': 'Course and associated lessons deleted'})



@app.route('/api/courses/<int:course_id>/completed_percentage', methods=['GET'])
def course_completion_percentage(course_id):

    course = Course.query.get_or_404(course_id)

    if course is None:
        return jsonify({'error': 'Curso não encontrado'}), 404

    total_lessons = len(Lesson.query \
        .filter_by(course_id=course_id) \
        .all())

    if total_lessons == 0:
        return jsonify({'completion_percentage': 0})

    completed_lessons = Lesson.query.filter_by(course_id=course_id, isCompleted=1).count()

    completion_percentage = (completed_lessons / total_lessons) * 100

    return jsonify({'completion_percentage': completion_percentage})


# Rotas para gerenciar notas dos cursos
@app.route('/api/courses/<int:course_id>/notes', methods=['GET'])
def get_course_notes(course_id):
    course = Course.query.get_or_404(course_id)
    return jsonify({'notes': course.notes if course.notes else ''})

@app.route('/api/courses/<int:course_id>/notes', methods=['PUT'])
def update_course_notes(course_id):
    course = Course.query.get_or_404(course_id)
    data = request.json
    course.notes = data.get('notes', '')
    db.session.commit()
    return jsonify({'message': 'Notas do curso atualizadas com sucesso', 'notes': course.notes})


# Rotas para gerenciar notas das aulas
@app.route('/api/lessons/<int:lesson_id>/notes', methods=['GET'])
def get_lesson_notes(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    return jsonify({'notes': lesson.notes if lesson.notes else ''})

@app.route('/api/lessons/<int:lesson_id>/notes', methods=['PUT'])
def update_lesson_notes(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    data = request.json
    lesson.notes = data.get('notes', '')
    db.session.commit()
    return jsonify({'message': 'Notas da aula atualizadas com sucesso', 'notes': lesson.notes})


# Rota catch-all para React Router - DEVE SER A ÚLTIMA ROTA
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    # Ignorar rotas da API
    if path.startswith('api/') or path.startswith('uploads/'):
        abort(404)

    # Se o arquivo existe nos assets estáticos (CSS, JS, imagens), servir
    if path and app.static_folder:
        static_file_path = os.path.join(app.static_folder, path)
        if os.path.isfile(static_file_path):
            return send_from_directory(app.static_folder, path)

    # Caso contrário, servir index.html para o React Router
    if app.static_folder and os.path.isfile(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')

    # Se não encontrou nada, retornar erro
    return "Frontend build not found. Run 'npm run build' first.", 404
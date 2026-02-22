
from flask import request, jsonify, send_file, abort, send_from_directory, render_template, make_response, session
from werkzeug.utils import secure_filename
import os
import shutil
from datetime import datetime
from pathlib import Path
from sqlalchemy import event, func, or_
from sqlalchemy.engine import Engine
from sqlalchemy.orm import joinedload

from app import app, db, Lesson, Course, Book, BookNote, BookHighlight, BookBookmark, Profile
from utils import list_and_register_lessons, scan_data_directory_and_register_courses
from video_utils import open_video
from auth import login_required, admin_required, get_current_profile_id, get_course_for_profile, get_book_for_profile


# ==================== ROTAS DE AUTENTICAÇÃO ====================

@app.route('/api/auth/profiles', methods=['GET'])
def list_auth_profiles():
    """Lista perfis disponíveis para login (público)"""
    profiles = Profile.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'avatar_color': p.avatar_color,
        'is_admin': p.is_admin
    } for p in profiles])


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Autentica um perfil"""
    data = request.json
    profile_id = data.get('profile_id')
    password = data.get('password', '')

    if not profile_id:
        return jsonify({'error': 'Perfil não informado'}), 400

    profile = Profile.query.get(profile_id)
    if not profile:
        return jsonify({'error': 'Perfil não encontrado'}), 404

    if not profile.check_password(password):
        return jsonify({'error': 'Senha incorreta'}), 401

    session.permanent = True
    session['profile_id'] = profile.id

    return jsonify({
        'id': profile.id,
        'name': profile.name,
        'is_admin': profile.is_admin,
        'avatar_color': profile.avatar_color
    })


@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    """Limpa a sessão"""
    session.clear()
    return jsonify({'message': 'Logout realizado com sucesso'})


@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    """Retorna o perfil da sessão atual"""
    profile_id = session.get('profile_id')
    if not profile_id:
        return jsonify({'error': 'Não autenticado'}), 401

    profile = Profile.query.get(profile_id)
    if not profile:
        session.clear()
        return jsonify({'error': 'Perfil não encontrado'}), 401

    return jsonify({
        'id': profile.id,
        'name': profile.name,
        'is_admin': profile.is_admin,
        'avatar_color': profile.avatar_color
    })


# ==================== ROTAS DE ADMIN ====================

@app.route('/api/admin/profiles', methods=['GET'])
@admin_required
def admin_list_profiles():
    """Lista todos os perfis (admin)"""
    profiles = Profile.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'is_admin': p.is_admin,
        'avatar_color': p.avatar_color,
        'created_at': p.created_at.isoformat() if p.created_at else None
    } for p in profiles])


@app.route('/api/admin/profiles', methods=['POST'])
@admin_required
def admin_create_profile():
    """Cria um novo perfil (admin)"""
    data = request.json
    name = data.get('name', '').strip()
    password = data.get('password', '')
    avatar_color = data.get('avatar_color', '#3B82F6')

    if not name:
        return jsonify({'error': 'Nome é obrigatório'}), 400
    if not password:
        return jsonify({'error': 'Senha é obrigatória'}), 400

    if Profile.query.filter_by(name=name).first():
        return jsonify({'error': 'Já existe um perfil com este nome'}), 409

    profile = Profile(name=name, avatar_color=avatar_color)
    profile.set_password(password)
    db.session.add(profile)
    db.session.commit()

    return jsonify({
        'id': profile.id,
        'name': profile.name,
        'is_admin': profile.is_admin,
        'avatar_color': profile.avatar_color
    }), 201


@app.route('/api/admin/profiles/<int:profile_id>', methods=['PUT'])
@admin_required
def admin_update_profile(profile_id):
    """Edita um perfil (admin)"""
    profile = Profile.query.get_or_404(profile_id)
    data = request.json

    name = data.get('name', '').strip()
    if name and name != profile.name:
        if Profile.query.filter_by(name=name).first():
            return jsonify({'error': 'Já existe um perfil com este nome'}), 409
        profile.name = name

    if 'avatar_color' in data:
        profile.avatar_color = data['avatar_color']

    if 'password' in data and data['password']:
        profile.set_password(data['password'])

    db.session.commit()

    return jsonify({
        'id': profile.id,
        'name': profile.name,
        'is_admin': profile.is_admin,
        'avatar_color': profile.avatar_color
    })


@app.route('/api/admin/profiles/<int:profile_id>', methods=['DELETE'])
@admin_required
def admin_delete_profile(profile_id):
    """Deleta um perfil (admin) - não pode deletar o admin"""
    profile = Profile.query.get_or_404(profile_id)

    if profile.is_admin:
        return jsonify({'error': 'Não é possível deletar o perfil Admin'}), 400

    # Deletar todos os dados associados ao perfil
    courses = Course.query.filter_by(profile_id=profile_id).all()
    for course in courses:
        Lesson.query.filter_by(course_id=course.id).delete()
        db.session.delete(course)

    books = Book.query.filter_by(profile_id=profile_id).all()
    for book in books:
        BookNote.query.filter_by(book_id=book.id).delete()
        BookHighlight.query.filter_by(book_id=book.id).delete()
        BookBookmark.query.filter_by(book_id=book.id).delete()
        db.session.delete(book)

    db.session.delete(profile)
    db.session.commit()

    return jsonify({'message': 'Perfil e dados associados deletados com sucesso'})


# ==================== ROTAS DE EXPORT/IMPORT POR PERFIL ====================

@app.route('/api/profile/export', methods=['GET'])
@login_required
def export_profile_data():
    """Exporta todos os dados do perfil atual como JSON"""
    pid = get_current_profile_id()

    courses = Course.query.filter_by(profile_id=pid).all()
    books = Book.query.filter_by(profile_id=pid).all()

    courses_data = []
    for course in courses:
        lessons = Lesson.query.filter_by(course_id=course.id).all()
        courses_data.append({
            'name': course.name,
            'path': course.path,
            'isCoverUrl': course.isCoverUrl,
            'fileCover': course.fileCover,
            'urlCover': course.urlCover,
            'notes': course.notes,
            'categories': course.categories,
            'course_type': course.course_type,
            'lessons': [{
                'title': l.title,
                'module': l.module,
                'hierarchy_path': l.hierarchy_path,
                'video_url': l.video_url,
                'pdf_url': l.pdf_url,
                'subtitle_url': l.subtitle_url,
                'progressStatus': l.progressStatus,
                'isCompleted': l.isCompleted,
                'time_elapsed': l.time_elapsed,
                'duration': l.duration,
                'notes': l.notes
            } for l in lessons]
        })

    books_data = []
    for book in books:
        notes = BookNote.query.filter_by(book_id=book.id).all()
        highlights = BookHighlight.query.filter_by(book_id=book.id).all()
        bookmarks = BookBookmark.query.filter_by(book_id=book.id).all()

        books_data.append({
            'title': book.title,
            'author': book.author,
            'file_path': book.file_path,
            'file_type': book.file_type,
            'isCoverUrl': book.isCoverUrl,
            'fileCover': book.fileCover,
            'urlCover': book.urlCover,
            'categories': book.categories,
            'book_type': book.book_type,
            'current_page': book.current_page,
            'total_pages': book.total_pages,
            'epub_cfi_position': book.epub_cfi_position,
            'notes': book.notes,
            'is_read': book.is_read,
            'book_notes': [{
                'page_number': n.page_number,
                'cfi_position': n.cfi_position,
                'note_text': n.note_text
            } for n in notes],
            'highlights': [{
                'page_number': h.page_number,
                'cfi_position': h.cfi_position,
                'cfi_range': h.cfi_range,
                'highlighted_text': h.highlighted_text,
                'color': h.color
            } for h in highlights],
            'bookmarks': [{
                'page_number': bm.page_number,
                'cfi_position': bm.cfi_position,
                'name': bm.name
            } for bm in bookmarks]
        })

    return jsonify({
        'version': 1,
        'exported_at': datetime.utcnow().isoformat(),
        'courses': courses_data,
        'books': books_data
    })


@app.route('/api/profile/import', methods=['POST'])
@login_required
def import_profile_data():
    """Importa dados JSON para o perfil atual"""
    pid = get_current_profile_id()
    data = request.json

    if not data:
        return jsonify({'error': 'Dados não fornecidos'}), 400

    imported_courses = 0
    imported_books = 0

    # Importar cursos
    for course_data in data.get('courses', []):
        # Verificar duplicata por path
        existing = Course.query.filter_by(path=course_data['path'], profile_id=pid).first()
        if existing:
            continue

        course = Course(
            name=course_data['name'],
            path=course_data['path'],
            isCoverUrl=course_data.get('isCoverUrl', 0),
            fileCover=course_data.get('fileCover'),
            urlCover=course_data.get('urlCover'),
            notes=course_data.get('notes'),
            categories=course_data.get('categories'),
            course_type=course_data.get('course_type'),
            profile_id=pid
        )
        db.session.add(course)
        db.session.flush()

        for lesson_data in course_data.get('lessons', []):
            lesson = Lesson(
                course_id=course.id,
                title=lesson_data['title'],
                module=lesson_data.get('module', ''),
                hierarchy_path=lesson_data.get('hierarchy_path', ''),
                video_url=lesson_data.get('video_url', ''),
                pdf_url=lesson_data.get('pdf_url', ''),
                subtitle_url=lesson_data.get('subtitle_url', ''),
                progressStatus=lesson_data.get('progressStatus', 'not_started'),
                isCompleted=lesson_data.get('isCompleted', 0),
                time_elapsed=lesson_data.get('time_elapsed', '0'),
                duration=lesson_data.get('duration'),
                notes=lesson_data.get('notes')
            )
            db.session.add(lesson)

        imported_courses += 1

    # Importar livros
    for book_data in data.get('books', []):
        existing = Book.query.filter_by(file_path=book_data['file_path'], profile_id=pid).first()
        if existing:
            continue

        book = Book(
            title=book_data['title'],
            author=book_data.get('author'),
            file_path=book_data['file_path'],
            file_type=book_data['file_type'],
            isCoverUrl=book_data.get('isCoverUrl', 0),
            fileCover=book_data.get('fileCover'),
            urlCover=book_data.get('urlCover'),
            categories=book_data.get('categories'),
            book_type=book_data.get('book_type'),
            current_page=book_data.get('current_page', 0),
            total_pages=book_data.get('total_pages'),
            epub_cfi_position=book_data.get('epub_cfi_position'),
            notes=book_data.get('notes'),
            is_read=book_data.get('is_read', 0),
            profile_id=pid
        )
        db.session.add(book)
        db.session.flush()

        for note_data in book_data.get('book_notes', []):
            note = BookNote(
                book_id=book.id,
                page_number=note_data.get('page_number'),
                cfi_position=note_data.get('cfi_position'),
                note_text=note_data.get('note_text', '')
            )
            db.session.add(note)

        for h_data in book_data.get('highlights', []):
            highlight = BookHighlight(
                book_id=book.id,
                page_number=h_data.get('page_number'),
                cfi_position=h_data.get('cfi_position'),
                cfi_range=h_data.get('cfi_range'),
                highlighted_text=h_data.get('highlighted_text', ''),
                color=h_data.get('color', 'yellow')
            )
            db.session.add(highlight)

        for bm_data in book_data.get('bookmarks', []):
            bookmark = BookBookmark(
                book_id=book.id,
                page_number=bm_data.get('page_number'),
                cfi_position=bm_data.get('cfi_position'),
                name=bm_data.get('name')
            )
            db.session.add(bookmark)

        imported_books += 1

    db.session.commit()

    return jsonify({
        'message': f'Importação concluída: {imported_courses} curso(s), {imported_books} livro(s)',
        'imported_courses': imported_courses,
        'imported_books': imported_books
    })


# ==================== ROTAS EXISTENTES (com auth) ====================

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
@login_required
def list_courses():
    pid = get_current_profile_id()
    courses = Course.query.filter_by(profile_id=pid).all()
    return jsonify([{'id': course.id, 'name': course.name, 'path': course.path, 'isCoverUrl': course.isCoverUrl, 'fileCover': course.fileCover, 'urlCover': course.urlCover, 'categories': course.categories, 'course_type': course.course_type } for course in courses])

@app.route('/api/courses/with-progress', methods=['GET'])
@login_required
def list_courses_with_progress():
    pid = get_current_profile_id()
    courses = Course.query.filter_by(profile_id=pid).all()
    result = []

    for course in courses:
        # Calcular porcentagem de conclusão
        total_lessons = Lesson.query.filter_by(course_id=course.id).count()
        if total_lessons == 0:
            completion_percentage = 0
        else:
            completed_lessons = Lesson.query.filter_by(course_id=course.id, isCompleted=1).count()
            completion_percentage = (completed_lessons / total_lessons) * 100

        # Verificar se tem progresso (alguma lição iniciada)
        has_progress = Lesson.query.filter(
            Lesson.course_id == course.id,
            or_(
                Lesson.isCompleted == 1,
                Lesson.time_elapsed != None,
                Lesson.time_elapsed != '0'
            )
        ).first() is not None

        # Obter a última lição assistida (última com updated_at)
        last_lesson = Lesson.query.filter_by(course_id=course.id)\
            .filter(Lesson.updated_at != None)\
            .order_by(Lesson.updated_at.desc())\
            .first()

        last_watched_at = last_lesson.updated_at.isoformat() if last_lesson and last_lesson.updated_at else None

        result.append({
            'id': course.id,
            'name': course.name,
            'path': course.path,
            'isCoverUrl': course.isCoverUrl,
            'fileCover': course.fileCover,
            'urlCover': course.urlCover,
            'categories': course.categories,
            'course_type': course.course_type,
            'completion_percentage': completion_percentage,
            'has_progress': has_progress,
            'last_watched_at': last_watched_at
        })

    return jsonify(result)

@app.route('/api/courses/<int:course_id>/lessons', methods=['GET'])
@login_required
def list_lessons_for_course(course_id):
    course = get_course_for_profile(course_id)

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
        'subtitle_url': lesson.subtitle_url,
    } for lesson in lessons]

    return jsonify(response)


@app.route("/serve-content", methods=['GET'])
@login_required
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
@login_required
def update_lesson_for_end_progress():
    data = request.json
    lesson_id = data.get('lessonId')
    progress_status = data.get('progressStatus')
    is_completed = data.get('isCompleted')
    time_elapsed = data.get('time_elapsed', None)

    lesson = Lesson.query.get(lesson_id)
    if lesson:
        # Verificar ownership via course
        if lesson.course.profile_id != get_current_profile_id():
            abort(403)

        if progress_status:
            lesson.progressStatus = progress_status
        if is_completed is not None:
            lesson.isCompleted = is_completed
        if time_elapsed is not None:
            lesson.time_elapsed = time_elapsed

        # Atualizar timestamp de última visualização
        lesson.updated_at = datetime.utcnow()

        db.session.commit()
        return jsonify({'message': 'Progresso da lição atualizado com sucesso'})
    else:
        return jsonify({'error': 'Lição não encontrada'}), 404


@app.route('/api/courses', methods=['POST'])
@login_required
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
            course_type=course_type,
            profile_id=get_current_profile_id()
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
@login_required
def add_courses_automatically():
    scan_data_directory_and_register_courses(profile_id=get_current_profile_id())
    return jsonify({}), 201


@app.route('/api/courses/<int:course_id>', methods=['GET'])
@login_required
def get_course(course_id):
    course = get_course_for_profile(course_id)
    return jsonify({'id': course.id, 'name': course.name})

@app.route('/api/lessons/<int:lesson_id>', methods=['GET'])
@login_required
def get_lesson_elapsed_time(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    # Verificar ownership via course
    if lesson.course.profile_id != get_current_profile_id():
        abort(403)
    print(lesson.time_elapsed)
    return jsonify({"elapsedTime": lesson.time_elapsed})


@app.route('/api/courses/<int:course_id>', methods=['PUT'])
@login_required
def update_course(course_id):
    try:
        course = get_course_for_profile(course_id)
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


@app.route('/api/courses/<int:course_id>/rescan', methods=['POST'])
@login_required
def rescan_course_lessons(course_id):
    """Re-escaneia o diretório do curso e atualiza as lições"""
    try:
        course = get_course_for_profile(course_id)

        # Verificar se o path do curso existe
        if not os.path.exists(course.path):
            return jsonify({'error': f'Path do curso não existe: {course.path}'}), 404

        if not os.path.isdir(course.path):
            return jsonify({'error': f'Path não é um diretório válido: {course.path}'}), 400

        # Re-escanear as lições
        try:
            list_and_register_lessons(course.path, course_id)

            # Contar quantas lições foram encontradas
            total_lessons = Lesson.query.filter_by(course_id=course_id).count()

            return jsonify({
                'message': f'Lições atualizadas com sucesso! {total_lessons} lição(ões) encontrada(s).',
                'total_lessons': total_lessons
            }), 200

        except Exception as e:
            return jsonify({'error': f'Erro ao escanear lições: {str(e)}'}), 500

    except Exception as e:
        return jsonify({'error': f'Erro ao atualizar curso: {str(e)}'}), 500


@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
@login_required
def delete_course(course_id):
    course = get_course_for_profile(course_id)
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
@login_required
def course_completion_percentage(course_id):
    course = get_course_for_profile(course_id)

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
@login_required
def get_course_notes(course_id):
    course = get_course_for_profile(course_id)
    return jsonify({'notes': course.notes if course.notes else ''})

@app.route('/api/courses/<int:course_id>/notes', methods=['PUT'])
@login_required
def update_course_notes(course_id):
    course = get_course_for_profile(course_id)
    data = request.json
    course.notes = data.get('notes', '')
    db.session.commit()
    return jsonify({'message': 'Notas do curso atualizadas com sucesso', 'notes': course.notes})


# Rotas para gerenciar notas das aulas
@app.route('/api/lessons/<int:lesson_id>/notes', methods=['GET'])
@login_required
def get_lesson_notes(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    if lesson.course.profile_id != get_current_profile_id():
        abort(403)
    return jsonify({'notes': lesson.notes if lesson.notes else ''})

@app.route('/api/lessons/<int:lesson_id>/notes', methods=['PUT'])
@login_required
def update_lesson_notes(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    if lesson.course.profile_id != get_current_profile_id():
        abort(403)
    data = request.json
    lesson.notes = data.get('notes', '')
    db.session.commit()
    return jsonify({'message': 'Notas da aula atualizadas com sucesso', 'notes': lesson.notes})


# ==================== ROTAS PARA LIVROS ====================

@app.route('/api/books', methods=['GET'])
@login_required
def list_books():
    pid = get_current_profile_id()
    books = Book.query.filter_by(profile_id=pid).all()
    return jsonify([{
        'id': book.id,
        'title': book.title,
        'author': book.author,
        'file_path': book.file_path,
        'file_type': book.file_type,
        'isCoverUrl': book.isCoverUrl,
        'fileCover': book.fileCover,
        'urlCover': book.urlCover,
        'categories': book.categories,
        'book_type': book.book_type,
        'current_page': book.current_page,
        'total_pages': book.total_pages,
        'epub_cfi_position': book.epub_cfi_position,
        'is_read': book.is_read,
        'last_read_at': book.last_read_at.isoformat() if book.last_read_at else None
    } for book in books])

@app.route('/api/books', methods=['POST'])
@login_required
def add_book():
    try:
        title = request.form['title']
        file_path = request.form['file_path']
        author = request.form.get('author', None)
        categories = request.form.get('categories', None)
        book_type = request.form.get('book_type', None)

        # Validar se o arquivo existe
        if not os.path.exists(file_path):
            return jsonify({'error': f'Arquivo não encontrado: {file_path}'}), 400

        # Determinar tipo do arquivo
        file_extension = os.path.splitext(file_path)[1].lower()
        if file_extension == '.pdf':
            file_type = 'pdf'
        elif file_extension == '.epub':
            file_type = 'epub'
        else:
            return jsonify({'error': 'Tipo de arquivo não suportado. Use PDF ou EPUB.'}), 400

        isCoverUrl = 1 if 'imageURL' in request.form and request.form['imageURL'] else 0
        urlCover = request.form.get('imageURL', None)

        if not isCoverUrl:
            image_file = request.files.get('imageFile')
            if image_file:
                filename = secure_filename(image_file.filename)
                fileCover = filename
                upload_folder = app.config['UPLOAD_FOLDER']
                if not os.path.exists(upload_folder):
                    os.makedirs(upload_folder)
                image_file.save(os.path.join(upload_folder, filename))
            else:
                fileCover = None
        else:
            fileCover = None

        book = Book(
            title=title,
            author=author,
            file_path=file_path,
            file_type=file_type,
            isCoverUrl=isCoverUrl,
            fileCover=fileCover,
            urlCover=urlCover if isCoverUrl else None,
            categories=categories,
            book_type=book_type,
            profile_id=get_current_profile_id()
        )

        db.session.add(book)
        db.session.commit()

        return jsonify({'id': book.id, 'title': book.title}), 201
    except KeyError as e:
        db.session.rollback()
        return jsonify({'error': f'Campo obrigatório faltando: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao adicionar livro: {str(e)}")
        return jsonify({'error': f'Erro ao adicionar livro: {str(e)}'}), 500

@app.route('/api/books/<int:book_id>', methods=['GET'])
@login_required
def get_book(book_id):
    book = get_book_for_profile(book_id)
    return jsonify({
        'id': book.id,
        'title': book.title,
        'author': book.author,
        'file_path': book.file_path,
        'file_type': book.file_type,
        'isCoverUrl': book.isCoverUrl,
        'fileCover': book.fileCover,
        'urlCover': book.urlCover,
        'categories': book.categories,
        'book_type': book.book_type,
        'current_page': book.current_page,
        'total_pages': book.total_pages,
        'epub_cfi_position': book.epub_cfi_position,
        'is_read': book.is_read,
        'last_read_at': book.last_read_at.isoformat() if book.last_read_at else None
    })

@app.route('/api/books/<int:book_id>', methods=['PUT'])
@login_required
def update_book(book_id):
    try:
        book = get_book_for_profile(book_id)

        book.title = request.form.get('title', book.title)
        book.author = request.form.get('author', book.author)
        book.file_path = request.form.get('file_path', book.file_path)
        book.categories = request.form.get('categories', book.categories)
        book.book_type = request.form.get('book_type', book.book_type)

        isCoverUrl = 1 if 'imageURL' in request.form and request.form['imageURL'] else 0

        if isCoverUrl:
            book.urlCover = request.form.get('imageURL')
            book.isCoverUrl = 1
            book.fileCover = None
        else:
            image_file = request.files.get('imageFile')
            if image_file:
                filename = secure_filename(image_file.filename)
                book.fileCover = filename
                book.isCoverUrl = 0
                book.urlCover = None
                image_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

        db.session.commit()
        return jsonify({'id': book.id, 'title': book.title})
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar livro: {str(e)}")
        return jsonify({'error': f'Erro ao atualizar livro: {str(e)}'}), 500

@app.route('/api/books/<int:book_id>', methods=['DELETE'])
@login_required
def delete_book(book_id):
    book = get_book_for_profile(book_id)

    if book.fileCover:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], book.fileCover))
        except FileNotFoundError:
            print(f"Arquivo {book.fileCover} não encontrado.")

    db.session.delete(book)
    db.session.commit()
    return jsonify({'message': 'Livro deletado com sucesso'})

@app.route('/api/books/<int:book_id>/progress', methods=['POST'])
@login_required
def update_book_progress(book_id):
    try:
        book = get_book_for_profile(book_id)
        data = request.json

        if 'current_page' in data:
            book.current_page = data['current_page']
        if 'total_pages' in data:
            book.total_pages = data['total_pages']
        if 'is_read' in data:
            book.is_read = data['is_read']
        if 'epub_cfi_position' in data:
            book.epub_cfi_position = data['epub_cfi_position']

        book.last_read_at = datetime.utcnow()

        db.session.commit()
        return jsonify({'message': 'Progresso atualizado com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/books/<int:book_id>/notes', methods=['GET'])
@login_required
def get_book_notes(book_id):
    book = get_book_for_profile(book_id)
    return jsonify({'notes': book.notes if book.notes else ''})

@app.route('/api/books/<int:book_id>/notes', methods=['PUT'])
@login_required
def update_book_notes(book_id):
    book = get_book_for_profile(book_id)
    data = request.json
    book.notes = data.get('notes', '')
    db.session.commit()
    return jsonify({'message': 'Notas atualizadas com sucesso', 'notes': book.notes})


# ==================== ROTAS PARA NOTAS DETALHADAS (BookNotes) ====================

@app.route('/api/books/<int:book_id>/book-notes', methods=['GET'])
@login_required
def list_book_notes(book_id):
    """Listar todas as notas de um livro"""
    get_book_for_profile(book_id)
    notes = BookNote.query.filter_by(book_id=book_id).order_by(BookNote.created_at.desc()).all()

    return jsonify([{
        'id': note.id,
        'book_id': note.book_id,
        'page_number': note.page_number,
        'cfi_position': note.cfi_position,
        'note_text': note.note_text,
        'created_at': note.created_at.isoformat() if note.created_at else None,
        'updated_at': note.updated_at.isoformat() if note.updated_at else None
    } for note in notes])

@app.route('/api/books/<int:book_id>/book-notes', methods=['POST'])
@login_required
def create_book_note(book_id):
    """Criar nova nota"""
    try:
        get_book_for_profile(book_id)
        data = request.json

        note = BookNote(
            book_id=book_id,
            page_number=data.get('page_number'),
            cfi_position=data.get('cfi_position'),
            note_text=data.get('note_text', '')
        )

        db.session.add(note)
        db.session.commit()

        return jsonify({
            'id': note.id,
            'message': 'Nota criada com sucesso'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/books/<int:book_id>/book-notes/<int:note_id>', methods=['PUT'])
@login_required
def update_book_note(book_id, note_id):
    """Editar nota existente"""
    try:
        get_book_for_profile(book_id)
        note = BookNote.query.filter_by(id=note_id, book_id=book_id).first_or_404()
        data = request.json

        note.note_text = data.get('note_text', note.note_text)
        note.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'message': 'Nota atualizada com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/books/<int:book_id>/book-notes/<int:note_id>', methods=['DELETE'])
@login_required
def delete_book_note(book_id, note_id):
    """Deletar nota"""
    try:
        get_book_for_profile(book_id)
        note = BookNote.query.filter_by(id=note_id, book_id=book_id).first_or_404()
        db.session.delete(note)
        db.session.commit()

        return jsonify({'message': 'Nota deletada com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== ROTAS PARA DESTAQUES ====================

@app.route('/api/books/<int:book_id>/highlights', methods=['GET'])
@login_required
def list_book_highlights(book_id):
    """Listar todos os destaques de um livro"""
    get_book_for_profile(book_id)
    highlights = BookHighlight.query.filter_by(book_id=book_id).order_by(BookHighlight.created_at.desc()).all()

    return jsonify([{
        'id': h.id,
        'book_id': h.book_id,
        'page_number': h.page_number,
        'cfi_position': h.cfi_position,
        'cfi_range': h.cfi_range,
        'highlighted_text': h.highlighted_text,
        'color': h.color,
        'created_at': h.created_at.isoformat() if h.created_at else None
    } for h in highlights])

@app.route('/api/books/<int:book_id>/highlights', methods=['POST'])
@login_required
def create_book_highlight(book_id):
    """Criar novo destaque"""
    try:
        get_book_for_profile(book_id)
        data = request.json

        highlight = BookHighlight(
            book_id=book_id,
            page_number=data.get('page_number'),
            cfi_position=data.get('cfi_position'),
            cfi_range=data.get('cfi_range'),
            highlighted_text=data.get('highlighted_text', ''),
            color=data.get('color', 'yellow')
        )

        db.session.add(highlight)
        db.session.commit()

        return jsonify({
            'id': highlight.id,
            'message': 'Destaque criado com sucesso'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/books/<int:book_id>/highlights/<int:highlight_id>', methods=['DELETE'])
@login_required
def delete_book_highlight(book_id, highlight_id):
    """Deletar destaque"""
    try:
        get_book_for_profile(book_id)
        highlight = BookHighlight.query.filter_by(id=highlight_id, book_id=book_id).first_or_404()
        db.session.delete(highlight)
        db.session.commit()

        return jsonify({'message': 'Destaque deletado com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== ROTAS PARA MARCADORES ====================

@app.route('/api/books/<int:book_id>/bookmarks', methods=['GET'])
@login_required
def list_book_bookmarks(book_id):
    """Listar todos os marcadores de um livro"""
    get_book_for_profile(book_id)
    bookmarks = BookBookmark.query.filter_by(book_id=book_id).order_by(BookBookmark.created_at.desc()).all()

    return jsonify([{
        'id': b.id,
        'book_id': b.book_id,
        'page_number': b.page_number,
        'cfi_position': b.cfi_position,
        'name': b.name,
        'created_at': b.created_at.isoformat() if b.created_at else None
    } for b in bookmarks])

@app.route('/api/books/<int:book_id>/bookmarks', methods=['POST'])
@login_required
def create_book_bookmark(book_id):
    """Criar novo marcador"""
    try:
        get_book_for_profile(book_id)
        data = request.json

        bookmark = BookBookmark(
            book_id=book_id,
            page_number=data.get('page_number'),
            cfi_position=data.get('cfi_position'),
            name=data.get('name', f"Marcador {datetime.utcnow().strftime('%d/%m/%Y %H:%M')}")
        )

        db.session.add(bookmark)
        db.session.commit()

        return jsonify({
            'id': bookmark.id,
            'message': 'Marcador criado com sucesso'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/books/<int:book_id>/bookmarks/<int:bookmark_id>', methods=['DELETE'])
@login_required
def delete_book_bookmark(book_id, bookmark_id):
    """Deletar marcador"""
    try:
        get_book_for_profile(book_id)
        bookmark = BookBookmark.query.filter_by(id=bookmark_id, book_id=book_id).first_or_404()
        db.session.delete(bookmark)
        db.session.commit()

        return jsonify({'message': 'Marcador deletado com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== ROTAS PARA BACKUP E RESTORE ====================

@app.route('/api/backup/create', methods=['POST'])
@admin_required
def create_manual_backup():
    """Cria um backup manual do banco de dados"""
    try:
        db_path = '/app/data/platform_course.sqlite'

        if not os.path.exists(db_path):
            return jsonify({'error': 'Banco de dados não encontrado'}), 404

        if os.path.getsize(db_path) == 0:
            return jsonify({'error': 'Banco de dados está vazio'}), 400

        # Criar backup com timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'platform_course_{timestamp}.sqlite'
        backup_path = f'/app/backups/{backup_filename}'

        # Garantir que o diretório existe
        os.makedirs('/app/backups', exist_ok=True)

        # Copiar o banco
        shutil.copy2(db_path, backup_path)

        # Obter tamanho do backup
        backup_size = os.path.getsize(backup_path)

        return jsonify({
            'message': 'Backup criado com sucesso',
            'filename': backup_filename,
            'size': backup_size,
            'created_at': datetime.now().isoformat()
        }), 201

    except Exception as e:
        return jsonify({'error': f'Erro ao criar backup: {str(e)}'}), 500

@app.route('/api/backup/list', methods=['GET'])
@admin_required
def list_backups():
    """Lista todos os backups disponíveis"""
    try:
        backup_dir = Path('/app/backups')

        if not backup_dir.exists():
            return jsonify([])

        backups = []

        for backup_file in sorted(backup_dir.glob('platform_course_*.sqlite'),
                                  key=lambda x: x.stat().st_mtime,
                                  reverse=True):
            stat = backup_file.stat()
            backups.append({
                'filename': backup_file.name,
                'size': stat.st_size,
                'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat()
            })

        return jsonify(backups)

    except Exception as e:
        return jsonify({'error': f'Erro ao listar backups: {str(e)}'}), 500

@app.route('/api/backup/download/<filename>', methods=['GET'])
@admin_required
def download_backup(filename):
    """Baixa um backup específico"""
    try:
        # Validar filename para evitar path traversal
        if '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({'error': 'Nome de arquivo inválido'}), 400

        backup_path = f'/app/backups/{filename}'

        if not os.path.exists(backup_path):
            return jsonify({'error': 'Backup não encontrado'}), 404

        return send_file(
            backup_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/x-sqlite3'
        )

    except Exception as e:
        return jsonify({'error': f'Erro ao baixar backup: {str(e)}'}), 500

@app.route('/api/backup/download-current', methods=['GET'])
@admin_required
def download_current_database():
    """Baixa o banco de dados atual"""
    try:
        db_path = '/app/data/platform_course.sqlite'

        if not os.path.exists(db_path):
            return jsonify({'error': 'Banco de dados não encontrado'}), 404

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'platform_course_current_{timestamp}.sqlite'

        return send_file(
            db_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/x-sqlite3'
        )

    except Exception as e:
        return jsonify({'error': f'Erro ao baixar banco atual: {str(e)}'}), 500

@app.route('/api/backup/restore', methods=['POST'])
@admin_required
def restore_backup():
    """Restaura um backup (sobrescreve o banco atual)"""
    import sqlite3

    try:
        data = request.json
        filename = data.get('filename')

        if not filename:
            return jsonify({'error': 'Nome do arquivo não fornecido'}), 400

        # Validar filename
        if '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({'error': 'Nome de arquivo inválido'}), 400

        backup_path = f'/app/backups/{filename}'
        db_path = '/app/data/platform_course.sqlite'

        if not os.path.exists(backup_path):
            return jsonify({'error': 'Backup não encontrado'}), 404

        # Validar que o backup é um arquivo SQLite válido
        try:
            conn = sqlite3.connect(backup_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            conn.close()

            if len(tables) == 0:
                return jsonify({'error': 'Backup inválido ou vazio'}), 400

            print(f"Backup válido com {len(tables)} tabelas")
        except sqlite3.Error as e:
            return jsonify({'error': f'Backup não é um SQLite válido: {str(e)}'}), 400

        # Criar backup do banco atual antes de restaurar
        if os.path.exists(db_path):
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            safety_backup = f'/app/backups/before_restore_{timestamp}.sqlite'
            shutil.copy2(db_path, safety_backup)
            print(f"Backup de segurança criado: {safety_backup}")

        # IMPORTANTE: Fechar todas as conexões do pool do SQLAlchemy
        try:
            print("Fechando conexões do banco de dados...")
            db.session.remove()
            db.engine.dispose()
            print("Conexões fechadas")
        except Exception as e:
            print(f"Aviso ao fechar conexões: {e}")

        # Aguardar um momento para garantir que as conexões foram fechadas
        import time
        time.sleep(0.5)

        # Restaurar o backup
        try:
            shutil.copy2(backup_path, db_path)
            print(f"Backup restaurado de {filename}")
        except Exception as e:
            print(f"Erro ao restaurar: {e}")
            raise

        return jsonify({
            'message': 'Backup restaurado com sucesso. Recarregue a página para aplicar as mudanças.',
            'restored_from': filename
        })

    except Exception as e:
        print(f"Erro ao restaurar backup: {str(e)}")
        return jsonify({'error': f'Erro ao restaurar backup: {str(e)}'}), 500

@app.route('/api/backup/upload', methods=['POST'])
@admin_required
def upload_and_restore_backup():
    """Faz upload de um arquivo .sqlite e restaura"""
    import sqlite3

    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'Arquivo vazio'}), 400

        if not file.filename.endswith('.sqlite'):
            return jsonify({'error': 'Arquivo deve ser .sqlite'}), 400

        db_path = '/app/data/platform_course.sqlite'

        # Criar backup de segurança do banco atual
        if os.path.exists(db_path):
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            safety_backup = f'/app/backups/before_upload_{timestamp}.sqlite'
            os.makedirs('/app/backups', exist_ok=True)
            shutil.copy2(db_path, safety_backup)
            print(f"Backup de segurança criado: {safety_backup}")

        # Salvar o arquivo enviado temporariamente
        temp_path = '/tmp/uploaded_backup.sqlite'
        file.save(temp_path)
        print(f"Arquivo temporário salvo: {temp_path}")

        # Validar que é um arquivo SQLite válido
        if os.path.getsize(temp_path) == 0:
            os.remove(temp_path)
            return jsonify({'error': 'Arquivo está vazio'}), 400

        # Validar que é um arquivo SQLite válido
        try:
            conn = sqlite3.connect(temp_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            conn.close()

            if len(tables) == 0:
                os.remove(temp_path)
                return jsonify({'error': 'Arquivo SQLite inválido ou vazio'}), 400

            print(f"Arquivo SQLite válido com {len(tables)} tabelas")
        except sqlite3.Error as e:
            os.remove(temp_path)
            return jsonify({'error': f'Arquivo não é um SQLite válido: {str(e)}'}), 400

        # IMPORTANTE: Fechar todas as conexões do pool do SQLAlchemy
        try:
            print("Fechando conexões do banco de dados...")
            db.session.remove()
            db.engine.dispose()
            print("Conexões fechadas")
        except Exception as e:
            print(f"Aviso ao fechar conexões: {e}")

        # Aguardar um momento para garantir que as conexões foram fechadas
        import time
        time.sleep(0.5)

        # Restaurar o backup enviado (copiar ao invés de mover para evitar problemas)
        try:
            shutil.copy2(temp_path, db_path)
            os.remove(temp_path)
            print(f"Backup restaurado com sucesso em {db_path}")
        except Exception as e:
            print(f"Erro ao copiar arquivo: {e}")
            raise

        return jsonify({
            'message': 'Backup importado e restaurado com sucesso. Recarregue a página para aplicar as mudanças.'
        })

    except Exception as e:
        print(f"Erro ao importar backup: {str(e)}")
        return jsonify({'error': f'Erro ao importar backup: {str(e)}'}), 500

@app.route('/api/backup/delete/<filename>', methods=['DELETE'])
@admin_required
def delete_backup(filename):
    """Deleta um backup específico"""
    try:
        # Validar filename
        if '..' in filename or '/' in filename or '\\' in filename:
            return jsonify({'error': 'Nome de arquivo inválido'}), 400

        backup_path = f'/app/backups/{filename}'

        if not os.path.exists(backup_path):
            return jsonify({'error': 'Backup não encontrado'}), 404

        os.remove(backup_path)

        return jsonify({'message': 'Backup deletado com sucesso'})

    except Exception as e:
        return jsonify({'error': f'Erro ao deletar backup: {str(e)}'}), 500


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

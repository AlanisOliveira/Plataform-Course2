from functools import wraps
from flask import session, jsonify, abort
from app import db, Course, Book, Profile


def get_current_profile_id():
    """Retorna o profile_id da sessão atual"""
    return session.get('profile_id')


def login_required(f):
    """Decorador que verifica se o usuário está logado"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'profile_id' not in session:
            return jsonify({'error': 'Login necessário'}), 401
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """Decorador que verifica se o usuário é admin"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'profile_id' not in session:
            return jsonify({'error': 'Login necessário'}), 401
        profile = Profile.query.get(session['profile_id'])
        if not profile or not profile.is_admin:
            return jsonify({'error': 'Acesso restrito ao administrador'}), 403
        return f(*args, **kwargs)
    return decorated_function


def get_course_for_profile(course_id):
    """Busca um curso verificando que pertence ao perfil atual"""
    course = Course.query.get_or_404(course_id)
    if course.profile_id != get_current_profile_id():
        abort(403)
    return course


def get_book_for_profile(book_id):
    """Busca um livro verificando que pertence ao perfil atual"""
    book = Book.query.get_or_404(book_id)
    if book.profile_id != get_current_profile_id():
        abort(403)
    return book

from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config
from db_utils import column_exists, create_admin_if_missing
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__, static_folder="frontend/dist", static_url_path="")
app.config.from_object(Config)

db = SQLAlchemy(app)
CORS(app, supports_credentials=True, origins=os.environ.get('CORS_ORIGINS', '*').split(','))


class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Integer, default=0)
    avatar_color = db.Column(db.String(20), default='#3B82F6')
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    path = db.Column(db.String(255), nullable=False)
    isCoverUrl = db.Column(db.Integer, default=0)
    fileCover = db.Column(db.String(255), nullable=True)
    urlCover = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    categories = db.Column(db.String(255), nullable=True)
    course_type = db.Column(db.String(100), nullable=True)
    profile_id = db.Column(db.Integer, db.ForeignKey("profile.id"), nullable=True)
    profile = db.relationship("Profile", backref=db.backref("courses", lazy=True))


class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    author = db.Column(db.String(150), nullable=True)
    file_path = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(10), nullable=False)  # pdf, epub
    isCoverUrl = db.Column(db.Integer, default=0)
    fileCover = db.Column(db.String(255), nullable=True)
    urlCover = db.Column(db.String(255), nullable=True)
    categories = db.Column(db.String(255), nullable=True)
    book_type = db.Column(db.String(100), nullable=True)  # Livro, Revista, Artigo, etc
    current_page = db.Column(db.Integer, default=0)
    total_pages = db.Column(db.Integer, nullable=True)
    epub_cfi_position = db.Column(db.String(500), nullable=True)  # Posição CFI para EPUBs
    notes = db.Column(db.Text, nullable=True)
    is_read = db.Column(db.Integer, default=0)
    last_read_at = db.Column(db.DateTime, nullable=True)
    profile_id = db.Column(db.Integer, db.ForeignKey("profile.id"), nullable=True)
    profile = db.relationship("Profile", backref=db.backref("books", lazy=True))


class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    course = db.relationship("Course", backref=db.backref("lessons", lazy=True))
    title = db.Column(db.String(150), nullable=False)
    module = db.Column(db.Text)
    hierarchy_path = db.Column(db.Text, nullable=False)
    video_url = db.Column(db.String(255))
    pdf_url = db.Column(db.String(255))
    subtitle_url = db.Column(db.String(255))
    progressStatus = db.Column(db.Text)
    isCompleted = db.Column(db.Integer)
    time_elapsed = db.Column(db.Text)
    duration = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, nullable=True)


class BookNote(db.Model):
    """Notas criadas pelo usuário em livros"""
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey("book.id"), nullable=False)
    book = db.relationship("Book", backref=db.backref("book_notes", lazy=True, cascade="all, delete-orphan"))
    page_number = db.Column(db.Integer, nullable=True)  # Para PDFs
    cfi_position = db.Column(db.String(500), nullable=True)  # Para EPUBs
    note_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())


class BookHighlight(db.Model):
    """Destaques (texto grifado) em livros"""
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey("book.id"), nullable=False)
    book = db.relationship("Book", backref=db.backref("book_highlights", lazy=True, cascade="all, delete-orphan"))
    page_number = db.Column(db.Integer, nullable=True)  # Para PDFs
    cfi_position = db.Column(db.String(500), nullable=True)  # Para EPUBs
    cfi_range = db.Column(db.String(1000), nullable=True)  # Range CFI completo para EPUBs
    highlighted_text = db.Column(db.Text, nullable=False)
    color = db.Column(db.String(20), nullable=False, default='yellow')  # yellow, green, blue, pink
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())


class BookBookmark(db.Model):
    """Marcadores para navegação rápida em livros"""
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey("book.id"), nullable=False)
    book = db.relationship("Book", backref=db.backref("book_bookmarks", lazy=True, cascade="all, delete-orphan"))
    page_number = db.Column(db.Integer, nullable=True)  # Para PDFs
    cfi_position = db.Column(db.String(500), nullable=True)  # Para EPUBs
    name = db.Column(db.String(150), nullable=True)  # Nome opcional do marcador
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())


from routes import *

def run_migrations():
    """Executa migrações necessárias no banco de dados"""
    migrations_applied = False

    try:
        if not column_exists(db, 'course', 'notes'):
            print("Adicionando coluna 'notes' à tabela 'course'...")
            db.session.execute(db.text("ALTER TABLE course ADD COLUMN notes TEXT"))
            db.session.commit()
            print("Coluna 'notes' adicionada com sucesso!")
            migrations_applied = True
    except Exception as e:
        print(f"Erro ao adicionar coluna 'notes' em 'course': {e}")
        db.session.rollback()

    try:
        if not column_exists(db, 'course', 'categories'):
            print("Adicionando coluna 'categories' à tabela 'course'...")
            db.session.execute(db.text("ALTER TABLE course ADD COLUMN categories VARCHAR(255)"))
            db.session.commit()
            print("Coluna 'categories' adicionada com sucesso!")
            migrations_applied = True
    except Exception as e:
        if "duplicate column name" not in str(e).lower():
            print(f"Erro ao adicionar coluna 'categories' em 'course': {e}")
        db.session.rollback()

    try:
        if not column_exists(db, 'lesson', 'notes'):
            print("Adicionando coluna 'notes' à tabela 'lesson'...")
            db.session.execute(db.text("ALTER TABLE lesson ADD COLUMN notes TEXT"))
            db.session.commit()
            print("Coluna 'notes' adicionada à tabela 'lesson' com sucesso!")
            migrations_applied = True
    except Exception as e:
        print(f"Erro ao adicionar coluna 'notes' em 'lesson': {e}")
        db.session.rollback()

    try:
        if not column_exists(db, 'course', 'course_type'):
            print("Adicionando coluna 'course_type' à tabela 'course'...")
            db.session.execute(db.text("ALTER TABLE course ADD COLUMN course_type VARCHAR(100)"))
            db.session.commit()
            print("Coluna 'course_type' adicionada com sucesso!")
            migrations_applied = True
    except Exception as e:
        if "duplicate column name" not in str(e).lower():
            print(f"Erro ao adicionar coluna 'course_type' em 'course': {e}")
        db.session.rollback()

    try:
        if not column_exists(db, 'lesson', 'subtitle_url'):
            print("Adicionando coluna 'subtitle_url' à tabela 'lesson'...")
            db.session.execute(db.text("ALTER TABLE lesson ADD COLUMN subtitle_url VARCHAR(255)"))
            db.session.commit()
            print("Coluna 'subtitle_url' adicionada à tabela 'lesson' com sucesso!")
            migrations_applied = True
    except Exception as e:
        if "duplicate column name" not in str(e).lower():
            print(f"Erro ao adicionar coluna 'subtitle_url' em 'lesson': {e}")
        db.session.rollback()

    try:
        if not column_exists(db, 'lesson', 'updated_at'):
            print("Adicionando coluna 'updated_at' à tabela 'lesson'...")
            db.session.execute(db.text("ALTER TABLE lesson ADD COLUMN updated_at TIMESTAMP"))
            db.session.commit()
            print("Coluna 'updated_at' adicionada à tabela 'lesson' com sucesso!")
            migrations_applied = True
    except Exception as e:
        if "duplicate column name" not in str(e).lower():
            print(f"Erro ao adicionar coluna 'updated_at' em 'lesson': {e}")
        db.session.rollback()

    try:
        if not column_exists(db, 'book', 'epub_cfi_position'):
            print("Adicionando coluna 'epub_cfi_position' à tabela 'book'...")
            db.session.execute(db.text("ALTER TABLE book ADD COLUMN epub_cfi_position VARCHAR(500)"))
            db.session.commit()
            print("Coluna 'epub_cfi_position' adicionada com sucesso!")
            migrations_applied = True
    except Exception as e:
        if "duplicate column name" not in str(e).lower():
            print(f"Erro ao adicionar coluna 'epub_cfi_position' em 'book': {e}")
        db.session.rollback()

    # ==================== MIGRAÇÃO DE PERFIS ====================

    # Garantir que perfil Admin existe
    try:
        if create_admin_if_missing(db):
            print("Perfil Admin criado com sucesso!")
            migrations_applied = True
    except Exception as e:
        print(f"Erro ao criar perfil Admin: {e}")
        db.session.rollback()

    # Adicionar profile_id à tabela course
    try:
        if not column_exists(db, 'course', 'profile_id'):
            print("Adicionando coluna 'profile_id' à tabela 'course'...")
            db.session.execute(db.text("ALTER TABLE course ADD COLUMN profile_id INTEGER REFERENCES profile(id)"))
            db.session.commit()

            # Atribuir cursos existentes ao Admin (profile_id = 1)
            admin = db.session.execute(db.text("SELECT id FROM profile WHERE is_admin = 1 LIMIT 1")).fetchone()
            if admin:
                db.session.execute(db.text("UPDATE course SET profile_id = :pid WHERE profile_id IS NULL"), {'pid': admin[0]})
                db.session.commit()
                print(f"Cursos existentes atribuídos ao perfil Admin (id={admin[0]})")

            print("Coluna 'profile_id' adicionada à tabela 'course' com sucesso!")
            migrations_applied = True
    except Exception as e:
        if "duplicate column name" not in str(e).lower():
            print(f"Erro ao adicionar coluna 'profile_id' em 'course': {e}")
        db.session.rollback()

    # Adicionar profile_id à tabela book
    try:
        if not column_exists(db, 'book', 'profile_id'):
            print("Adicionando coluna 'profile_id' à tabela 'book'...")
            db.session.execute(db.text("ALTER TABLE book ADD COLUMN profile_id INTEGER REFERENCES profile(id)"))
            db.session.commit()

            # Atribuir livros existentes ao Admin (profile_id = 1)
            admin = db.session.execute(db.text("SELECT id FROM profile WHERE is_admin = 1 LIMIT 1")).fetchone()
            if admin:
                db.session.execute(db.text("UPDATE book SET profile_id = :pid WHERE profile_id IS NULL"), {'pid': admin[0]})
                db.session.commit()
                print(f"Livros existentes atribuídos ao perfil Admin (id={admin[0]})")

            print("Coluna 'profile_id' adicionada à tabela 'book' com sucesso!")
            migrations_applied = True
    except Exception as e:
        if "duplicate column name" not in str(e).lower():
            print(f"Erro ao adicionar coluna 'profile_id' em 'book': {e}")
        db.session.rollback()

    if not migrations_applied:
        print("Todas as migrações já foram aplicadas. Banco de dados atualizado!")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        run_migrations()
    port = int(os.environ.get('PORT', 9823))
    app.run(debug=True, port=port, host="0.0.0.0")

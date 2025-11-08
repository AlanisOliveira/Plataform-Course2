from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config
import os

app = Flask(__name__, static_folder="./frontend/dist", static_url_path="")
app.config.from_object(Config)

db = SQLAlchemy(app)
# CORS simplificado - como tudo está na mesma origem, não é necessário configuração complexa
CORS(app)


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


class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.id"), nullable=False)
    course = db.relationship("Course", backref=db.backref("lessons", lazy=True))
    title = db.Column(db.String(150), nullable=False)
    module = db.Column(db.Text)
    hierarchy_path = db.Column(db.Text, nullable=False)
    video_url = db.Column(db.String(255))
    pdf_url = db.Column(db.String(255))
    progressStatus = db.Column(db.Text)
    isCompleted = db.Column(db.Integer)
    time_elapsed = db.Column(db.Text)
    duration = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)


from routes import *

def run_migrations():
    """Executa migrações necessárias no banco de dados"""
    migrations_applied = False

    # Migração 1: Adicionar coluna 'notes' à tabela 'course'
    try:
        result = db.session.execute(db.text("PRAGMA table_info(course)"))
        columns = [row[1] for row in result]

        if 'notes' not in columns:
            print("Adicionando coluna 'notes' à tabela 'course'...")
            db.session.execute(db.text("ALTER TABLE course ADD COLUMN notes TEXT"))
            db.session.commit()
            print("Coluna 'notes' adicionada com sucesso!")
            migrations_applied = True
    except Exception as e:
        print(f"Erro ao adicionar coluna 'notes' em 'course': {e}")
        db.session.rollback()

    # Migração 2: Adicionar coluna 'categories' à tabela 'course'
    try:
        result = db.session.execute(db.text("PRAGMA table_info(course)"))
        columns = [row[1] for row in result]

        if 'categories' not in columns:
            print("Adicionando coluna 'categories' à tabela 'course'...")
            db.session.execute(db.text("ALTER TABLE course ADD COLUMN categories VARCHAR(255)"))
            db.session.commit()
            print("Coluna 'categories' adicionada com sucesso!")
            migrations_applied = True
    except Exception as e:
        if "duplicate column name" not in str(e).lower():
            print(f"Erro ao adicionar coluna 'categories' em 'course': {e}")
        db.session.rollback()

    # Migração 3: Adicionar coluna 'notes' à tabela 'lesson'
    try:
        result = db.session.execute(db.text("PRAGMA table_info(lesson)"))
        lesson_columns = [row[1] for row in result]

        if 'notes' not in lesson_columns:
            print("Adicionando coluna 'notes' à tabela 'lesson'...")
            db.session.execute(db.text("ALTER TABLE lesson ADD COLUMN notes TEXT"))
            db.session.commit()
            print("Coluna 'notes' adicionada à tabela 'lesson' com sucesso!")
            migrations_applied = True
    except Exception as e:
        print(f"Erro ao adicionar coluna 'notes' em 'lesson': {e}")
        db.session.rollback()

    # Migração 4: Adicionar coluna 'course_type' à tabela 'course'
    try:
        result = db.session.execute(db.text("PRAGMA table_info(course)"))
        columns = [row[1] for row in result]

        if 'course_type' not in columns:
            print("Adicionando coluna 'course_type' à tabela 'course'...")
            db.session.execute(db.text("ALTER TABLE course ADD COLUMN course_type VARCHAR(100)"))
            db.session.commit()
            print("Coluna 'course_type' adicionada com sucesso!")
            migrations_applied = True
    except Exception as e:
        if "duplicate column name" not in str(e).lower():
            print(f"Erro ao adicionar coluna 'course_type' em 'course': {e}")
        db.session.rollback()

    if not migrations_applied:
        print("Todas as migrações já foram aplicadas. Banco de dados atualizado!")

with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        # Tables might already exist, check if we can query them
        try:
            db.session.execute(db.text("SELECT 1 FROM course LIMIT 1"))
            print("Database tables already exist, skipping creation")
        except:
            # Tables don't exist and create_all failed, this is a real error
            print(f"Error creating database tables: {e}")
            raise

    # Executar migrações após garantir que as tabelas existem
    run_migrations()

if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")

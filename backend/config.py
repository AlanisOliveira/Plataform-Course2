import os
import secrets

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    APP_DIR = os.environ.get('APP_DIR', '/app')
    DATA_DIR = os.environ.get('DATA_DIR', os.path.join(APP_DIR, 'data'))
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(APP_DIR, 'uploads'))
    BACKUP_DIR = os.environ.get('BACKUP_DIR', os.path.join(APP_DIR, 'backups'))
    COURSES_INTERNAL_PATH = os.environ.get('COURSES_INTERNAL_PATH', '/cursos')

    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(BACKUP_DIR, exist_ok=True)

    DB_FILE = os.path.join(DATA_DIR, 'platform_course.sqlite')
    DEFAULT_DB_URI = f'sqlite:///{DB_FILE}'

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or DEFAULT_DB_URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)

    SESSION_TYPE = 'filesystem'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'false').lower() == 'true'
    PERMANENT_SESSION_LIFETIME = 86400 * 30  # 30 dias

    print(f"Configuração do banco de dados: {SQLALCHEMY_DATABASE_URI}")

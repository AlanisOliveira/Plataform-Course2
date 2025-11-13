import os

class Config:
    # Usar path absoluto para o banco de dados para evitar perda de dados
    # Quando em Docker, usa /app/data/platform_course.sqlite (definido por DATABASE_URL)
    # Quando em desenvolvimento, cria diretório 'data' no backend

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    DATA_DIR = os.path.join(BASE_DIR, 'data')

    # Garantir que o diretório de dados existe
    os.makedirs(DATA_DIR, exist_ok=True)

    # Path absoluto do banco de dados (fallback para desenvolvimento)
    DB_FILE = os.path.join(DATA_DIR, 'platform_course.sqlite')
    DEFAULT_DB_URI = f'sqlite:///{DB_FILE}'

    # Priorizar DATABASE_URL do ambiente (Docker), caso contrário usar path absoluto
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or DEFAULT_DB_URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = 'uploads'
    SECRET_KEY = 'your_secret_key_here'

    print(f"Configuração do banco de dados: {SQLALCHEMY_DATABASE_URI}")
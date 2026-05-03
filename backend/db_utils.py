import os
from pathlib import Path

from sqlalchemy import inspect, text


def get_database_url(app):
    return app.config["SQLALCHEMY_DATABASE_URI"]


def is_sqlite_database(app):
    return get_database_url(app).startswith("sqlite:")


def get_sqlite_db_path(app):
    if not is_sqlite_database(app):
        return None

    database_url = get_database_url(app)
    sqlite_path = database_url.replace("sqlite:///", "", 1)
    if sqlite_path.startswith("/"):
        return sqlite_path
    return os.path.abspath(sqlite_path)


def ensure_directory(path):
    Path(path).mkdir(parents=True, exist_ok=True)


def table_exists(db, table_name):
    inspector = inspect(db.engine)
    return table_name in inspector.get_table_names()


def column_exists(db, table_name, column_name):
    inspector = inspect(db.engine)
    if table_name not in inspector.get_table_names():
        return False
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def create_admin_if_missing(db):
    admin = db.session.execute(
        text("SELECT id FROM profile WHERE is_admin = 1 LIMIT 1")
    ).fetchone()
    if admin:
        return False

    from werkzeug.security import generate_password_hash

    admin_name = os.environ.get("ADMIN_DEFAULT_NAME", "Admin")
    admin_password = os.environ.get("ADMIN_DEFAULT_PASSWORD")
    if not admin_password:
        raise RuntimeError(
            "ADMIN_DEFAULT_PASSWORD não configurada. Defina a variável de ambiente antes da primeira inicialização."
        )

    admin_hash = generate_password_hash(admin_password)
    db.session.execute(
        text(
            "INSERT INTO profile (name, password_hash, is_admin, avatar_color, created_at) "
            "VALUES (:name, :hash, 1, '#3B82F6', CURRENT_TIMESTAMP)"
        ),
        {"name": admin_name, "hash": admin_hash},
    )
    db.session.commit()
    return True

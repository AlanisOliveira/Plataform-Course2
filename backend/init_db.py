#!/usr/bin/env python3
"""
Script de inicialização e backup do banco de dados
Garante que o banco sempre existe e cria backups automáticos
"""
import os
import shutil
from datetime import datetime
from pathlib import Path

from config import Config
from db_utils import ensure_directory, get_sqlite_db_path, is_sqlite_database

def ensure_directories():
    """Garante que todos os diretórios necessários existem"""
    dirs = [Config.DATA_DIR, Config.UPLOAD_FOLDER, Config.BACKUP_DIR]
    for d in dirs:
        ensure_directory(d)
        print(f"✓ Diretório {d} OK")

def backup_database():
    """Cria backup do banco de dados se ele existir"""
    from app import app

    if not is_sqlite_database(app):
        print("ℹ Backup automático em arquivo é desativado para bancos não-SQLite")
        return

    db_path = get_sqlite_db_path(app)

    if not db_path or not os.path.exists(db_path):
        print("ℹ Banco de dados não existe ainda (primeira inicialização)")
        return

    # Verificar se banco não está vazio
    if os.path.getsize(db_path) == 0:
        print("⚠ Banco de dados está vazio, pulando backup")
        return

    # Criar backup com timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(Config.BACKUP_DIR, f'platform_course_{timestamp}.sqlite')

    try:
        shutil.copy2(db_path, backup_path)
        print(f"✓ Backup criado: {backup_path}")

        # Manter apenas os 10 backups mais recentes
        cleanup_old_backups()
    except Exception as e:
        print(f"⚠ Erro ao criar backup: {e}")

def cleanup_old_backups():
    """Remove backups antigos, mantendo apenas os 10 mais recentes"""
    backup_dir = Path(Config.BACKUP_DIR)
    backups = sorted(backup_dir.glob('platform_course_*.sqlite'), key=lambda x: x.stat().st_mtime)

    # Remover backups excedentes
    for old_backup in backups[:-10]:
        try:
            old_backup.unlink()
            print(f"✓ Backup antigo removido: {old_backup.name}")
        except Exception as e:
            print(f"⚠ Erro ao remover backup antigo: {e}")

def init_database():
    """Inicializa o banco de dados se necessário"""
    from app import app, db, run_migrations

    with app.app_context():
        # create_all() só cria tabelas que NÃO existem
        # Não sobrescreve nem apaga dados existentes
        db.create_all()

        db_path = get_sqlite_db_path(app)

        if db_path and os.path.exists(db_path) and os.path.getsize(db_path) > 0:
            print("✓ Banco de dados existente encontrado")
            try:
                result = db.session.execute(db.text("SELECT COUNT(*) FROM course"))
                count = result.scalar()
                print(f"✓ Banco contém {count} curso(s) cadastrado(s)")
            except Exception as e:
                print(f"⚠ Erro ao verificar banco: {e}")
        else:
            print("✓ Banco de dados criado com sucesso")

        # Rodar migrações DEPOIS de garantir que as tabelas existem
        run_migrations()

if __name__ == '__main__':
    print("=" * 50)
    print("Inicializando Plataforma de Cursos")
    print("=" * 50)

    # 1. Garantir diretórios
    ensure_directories()

    # 2. Fazer backup do banco existente (se houver)
    backup_database()

    # 3. Inicializar banco (criar tabelas se necessário)
    init_database()

    print("=" * 50)
    print("✓ Inicialização concluída com sucesso!")
    print("=" * 50)

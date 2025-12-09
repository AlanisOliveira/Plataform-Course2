#!/usr/bin/env python3
"""
Script de inicialização e backup do banco de dados
Garante que o banco sempre existe e cria backups automáticos
"""
import os
import shutil
from datetime import datetime
from pathlib import Path

def ensure_directories():
    """Garante que todos os diretórios necessários existem"""
    dirs = ['/app/data', '/app/uploads', '/app/backups']
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        print(f"✓ Diretório {d} OK")

def backup_database():
    """Cria backup do banco de dados se ele existir"""
    db_path = '/app/data/platform_course.sqlite'

    if not os.path.exists(db_path):
        print("ℹ Banco de dados não existe ainda (primeira inicialização)")
        return

    # Verificar se banco não está vazio
    if os.path.getsize(db_path) == 0:
        print("⚠ Banco de dados está vazio, pulando backup")
        return

    # Criar backup com timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = f'/app/backups/platform_course_{timestamp}.sqlite'

    try:
        shutil.copy2(db_path, backup_path)
        print(f"✓ Backup criado: {backup_path}")

        # Manter apenas os 10 backups mais recentes
        cleanup_old_backups()
    except Exception as e:
        print(f"⚠ Erro ao criar backup: {e}")

def cleanup_old_backups():
    """Remove backups antigos, mantendo apenas os 10 mais recentes"""
    backup_dir = Path('/app/backups')
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
    from app import app, db

    with app.app_context():
        db_path = '/app/data/platform_course.sqlite'

        if os.path.exists(db_path) and os.path.getsize(db_path) > 0:
            print("✓ Banco de dados existente encontrado")
        else:
            print("ℹ Criando novo banco de dados...")
            db.create_all()
            print("✓ Banco de dados criado com sucesso")

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

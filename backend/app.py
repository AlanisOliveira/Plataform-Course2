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

if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")

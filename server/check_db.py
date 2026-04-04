from app import app
from database import db
from models import Quiz, Question, Course

def check():
    with app.app_context():
        quizzes = Quiz.query.all()
        print(f"Total Quizzes: {len(quizzes)}")
        for q in quizzes:
            questions = Question.query.filter_by(quiz_id=q.id).all()
            print(f"Quiz ID: {q.id}, Title: {q.title}, Course ID: {q.course_id}, Questions: {len(questions)}")
            if len(questions) == 0:
                print(f"  WARNING: Quiz {q.id} has no questions!")

if __name__ == "__main__":
    check()

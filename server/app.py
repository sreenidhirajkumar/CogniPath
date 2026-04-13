from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps

load_dotenv()

app = Flask(__name__)
# CORS(app, resources={r"/*": {"origins": "*"}})
# CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"], "allow_headers": ["Content-Type", "Authorization"], "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"], "supports_credentials": True}})

# Allow frontend from env var, or fallback to local
frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
# Allow multiple origins by checking if it contains commas
origins = [origin.strip() for origin in frontend_url.split(',')] if ',' in frontend_url else [frontend_url]
# We also include typical local URLs to cover bases during testing
origins.extend(["http://localhost:5173", "http://127.0.0.1:5173"])

CORS(app, resources={r"/*": {"origins": origins}}, supports_credentials=True)



from database import db

# Database Configuration
database_url = os.getenv('DATABASE_URL')
if database_url:
    # Render uses 'postgres://' but SQLAlchemy requires 'postgresql://'
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    db_user = os.getenv('DB_USER', 'root')
    db_password = os.getenv('DB_PASSWORD', '')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_name = os.getenv('DB_NAME', 'learning_engine')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+mysqlconnector://{db_user}:{db_password}@{db_host}/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_secret_key')

db.init_app(app)

# Import models after db init to avoid circular imports
from models import User, Goal, Skill, Course, LearningPath, LearningPathItem, UserGoal, Quiz, Question, UserQuiz
from ml_engine import MLEngine
from ai_tutor import AITutor

# Token Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1] # Bearer <token>
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# --- Auth Routes ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = generate_password_hash(data['password'])
    new_user = User(username=data['username'], email=data['email'], password_hash=hashed_password, skill_level=data.get('skill_level', 'Beginner'))
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'Registered successfully'}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        token = jwt.encode({'user_id': user.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({'token': token, 'username': user.username, 'skill_level': user.skill_level})
    return jsonify({'message': 'Invalid credentials'}), 401

# --- User Profile Routes ---
@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({
        'username': current_user.username,
        'email': current_user.email,
        'skill_level': current_user.skill_level,
        'goals': [{'id': g.goal_id, 'name': Goal.query.get(g.goal_id).name} for g in current_user.goals]
    })

@app.route('/api/user/goals', methods=['GET'])
def get_all_goals():
    goals = Goal.query.all()
    return jsonify([{'id': g.id, 'name': g.name, 'description': g.description} for g in goals])

@app.route('/api/user/goals', methods=['POST'])
@token_required
def set_user_goal(current_user):
    data = request.get_json()
    goal_id = data.get('goal_id')
    
    # Clear existing goals for simplicity in this demo
    UserGoal.query.filter_by(user_id=current_user.id).delete()
    
    new_goal = UserGoal(user_id=current_user.id, goal_id=goal_id)
    db.session.add(new_goal)
    db.session.commit()
    
    # Generate new Learning Path immediately
    engine = MLEngine(db.session)
    recommendations = engine.get_recommendations(goal_id, current_user.skill_level)
    
    # Save recommendations as Learning Path
    # Clear old paths
    LearningPath.query.filter_by(user_id=current_user.id).delete()
    
    lp = LearningPath(user_id=current_user.id, title=f"Path for {Goal.query.get(goal_id).name}", description="AI Generated Path")
    db.session.add(lp)
    db.session.commit()
    
    for idx, rec in enumerate(recommendations):
        lpi = LearningPathItem(learning_path_id=lp.id, course_id=rec['id'], order=idx+1)
        db.session.add(lpi)
    
    db.session.commit()

    return jsonify({'message': 'Goal set and learning path generated', 'path_id': lp.id})

# --- Learning Path Routes ---
@app.route('/api/learning-path', methods=['GET'])
@token_required
def get_learning_path(current_user):
    lp = LearningPath.query.filter_by(user_id=current_user.id).order_by(LearningPath.created_at.desc()).first()
    if not lp:
        return jsonify({'message': 'No learning path found'}), 404
        
    items = LearningPathItem.query.filter_by(learning_path_id=lp.id).order_by(LearningPathItem.order).all()
    path_data = []
    for item in items:
        course = Course.query.get(item.course_id)
        # Check if course has a quiz
        quiz = Quiz.query.filter_by(course_id=course.id).first()
        
        path_data.append({
            'id': item.id,
            'course_id': course.id,
            'course_title': course.title,
            'description': course.description,
            'difficulty': course.difficulty,
            'status': item.status,
            'is_visited': item.is_visited,
            'assessment_score': item.assessment_score,
            'url': course.url,
            'has_quiz': quiz is not None,
            'quiz_id': quiz.id if quiz else None
        })
        
    is_completed = all(item.status == 'completed' for item in items) if items else False
        
    return jsonify({
        'title': lp.title, 
        'modules': path_data,
        'is_completed': is_completed,
        'user_skill_level': current_user.skill_level
    })

@app.route('/api/learning-path/item/<int:item_id>/visit', methods=['POST'])
@token_required
def visit_learning_path_item(current_user, item_id):
    item = LearningPathItem.query.get(item_id)
    if not item:
        return jsonify({'message': 'Item not found'}), 404
        
    lp = LearningPath.query.get(item.learning_path_id)
    if lp.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    item.is_visited = True
    db.session.commit()
    
    return jsonify({'message': 'Visit recorded', 'item_id': item.id, 'is_visited': True})

@app.route('/api/learning-path/item/<int:item_id>/complete', methods=['POST'])
@token_required
def complete_learning_path_item(current_user, item_id):
    item = LearningPathItem.query.get(item_id)
    if not item:
        return jsonify({'message': 'Item not found'}), 404
        
    lp = LearningPath.query.get(item.learning_path_id)
    if lp.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    if not item.is_visited:
        return jsonify({'message': 'You must visit the course material before marking it as complete!'}), 400
        
    item.status = 'completed'
    db.session.commit()
    
    return jsonify({'message': 'Course marked as completed', 'item_id': item.id, 'status': item.status})

@app.route('/api/ai/chat', methods=['POST'])
@token_required
def ai_chat(current_user):
    data = request.get_json()
    question = data.get('question')
    context = data.get('context', '')
    
    tutor = AITutor()
    response = tutor.get_response(question, context)
    
    return jsonify({'response': response})

@app.route('/api/ai/quiz/generate', methods=['POST'])
@token_required
def generate_ai_quiz(current_user):
    data = request.get_json()
    topic = data.get('topic', 'General Knowledge')
    difficulty = data.get('difficulty', current_user.skill_level)
    context = data.get('context', '')
    
    tutor = AITutor()
    quiz_data = tutor.generate_dynamic_quiz(topic, difficulty, context)
    
    return jsonify(quiz_data)

@app.route('/api/ai/code/grade', methods=['POST'])
@token_required
def grade_user_code(current_user):
    data = request.get_json()
    challenge = data.get('challenge', '')
    code = data.get('code', '')
    
    tutor = AITutor()
    result = tutor.grade_code(challenge, code)
    
    return jsonify(result)

@app.route('/api/quizzes', methods=['GET'])
@token_required
def get_quizzes(current_user):
    difficulty = request.args.get('difficulty', current_user.skill_level)
    course_id = request.args.get('course_id')
    
    query = Quiz.query
    
    if course_id:
        quiz = query.filter_by(course_id=course_id).first()
        if quiz:
            return jsonify([{'id': quiz.id, 'title': quiz.title, 'difficulty': quiz.difficulty}])
        return jsonify([]), 404

    query = query.filter_by(difficulty=difficulty)
    
    if current_user.goals:
        user_goal_id = current_user.goals[0].goal_id
        goal_quizzes = query.filter_by(goal_id=user_goal_id).all()
        if goal_quizzes:
            return jsonify([{'id': q.id, 'title': q.title, 'difficulty': q.difficulty} for q in goal_quizzes])

    quizzes = query.all()
    return jsonify([{'id': q.id, 'title': q.title, 'difficulty': q.difficulty} for q in quizzes])

@app.route('/api/quiz/<int:quiz_id>', methods=['GET'])
def get_quiz_details(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found'}), 404
        
    questions = [{'id': q.id, 'text': q.text, 'options': {'A': q.option_a, 'B': q.option_b, 'C': q.option_c, 'D': q.option_d}} for q in quiz.questions]
    return jsonify({'id': quiz.id, 'title': quiz.title, 'questions': questions})

@app.route('/api/quiz/<int:quiz_id>/submit', methods=['POST'])
@token_required
def submit_quiz(current_user, quiz_id):
    data = request.get_json()
    answers = data.get('answers') # Dict of {question_id: answer}
    
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found'}), 404
        
    correct_count = 0
    total_questions = len(quiz.questions)
    
    for q in quiz.questions:
        user_answer = answers.get(str(q.id))
        if user_answer == q.correct_answer:
            correct_count += 1
            
    score = int((correct_count / total_questions) * 100)
    
    user_quiz = UserQuiz(user_id=current_user.id, quiz_id=quiz.id, score=score)
    db.session.add(user_quiz)
    
    # Update score on LearningPathItem
    if quiz.course_id:
        lp = LearningPath.query.filter_by(user_id=current_user.id).order_by(LearningPath.created_at.desc()).first()
        if lp:
            item = LearningPathItem.query.filter_by(learning_path_id=lp.id, course_id=quiz.course_id).first()
            if item:
                item.assessment_score = score
    
    # Logic to update skill level based on quiz score
    if score >= 80:
        if current_user.skill_level == 'Beginner' and quiz.difficulty == 'Beginner':
            current_user.skill_level = 'Intermediate'
        elif current_user.skill_level == 'Intermediate' and quiz.difficulty == 'Intermediate':
            current_user.skill_level = 'Advanced'
            
    db.session.commit()
    
    return jsonify({'score': score, 'new_skill_level': current_user.skill_level})

@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "service": "learning-engine-api"})

if __name__ == '__main__':
    app.run(debug=True, port=5001)

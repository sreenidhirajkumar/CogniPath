from app import app
from database import db
from models import User, Goal, Skill, Course, Quiz, Question
from werkzeug.security import generate_password_hash

def seed_data():
    with app.app_context():
        db.drop_all()
        db.create_all()
        
        # Check if data exists
        # if Course.query.first():
        #     print("Database already seeded.")
        #     return

        # Create Goals
        goals = [
            Goal(name="Frontend Developer", description="Specializes in client-side web development."),
            Goal(name="Backend Developer", description="Focuses on server-side logic and databases."),
            Goal(name="Data Scientist", description="Analyzes data to extract insights."),
            Goal(name="Full Stack Developer", description="Proficient in both frontend and backend.")
        ]
        db.session.add_all(goals)
        
        # Create Skills
        s1 = Skill(name="JavaScript", category="Language")
        s2 = Skill(name="Python", category="Language")
        s3 = Skill(name="React", category="Frontend")
        s4 = Skill(name="Flask", category="Backend")
        s5 = Skill(name="SQL", category="Database")
        s6 = Skill(name="Machine Learning", category="Data Science")
        db.session.add_all([s1, s2, s3, s4, s5, s6])
        db.session.flush()

        # Create Courses
        courses_data = [
            # Frontend
            {'title': 'HTML & CSS Basics', 'description': 'Learn the building blocks of the web.', 'difficulty': 'Beginner', 'provider': 'MDN Web Docs', 'tags': 'frontend, html, css, web, ui', 'url': 'https://developer.mozilla.org/en-US/docs/Learn'},
            {'title': 'Modern JavaScript', 'description': 'ES6+ features and asynchronous programming.', 'difficulty': 'Intermediate', 'provider': 'javascript.info', 'tags': 'frontend, javascript, es6, web, scripting', 'url': 'https://javascript.info/'},
            {'title': 'React for Beginners', 'description': 'Build interactive UIs with React.', 'difficulty': 'Intermediate', 'provider': 'React Docs', 'tags': 'frontend, react, javascript, ui, components', 'url': 'https://react.dev/learn'},
            {'title': 'Advanced React Patterns', 'description': 'Mastering component design patterns.', 'difficulty': 'Advanced', 'provider': 'React Patterns', 'tags': 'frontend, react, pattern, advanced, architecture', 'url': 'https://reactpatterns.com/'},
            {'title': 'CSS Grid & Flexbox', 'description': 'Master modern CSS layout techniques.', 'difficulty': 'Beginner', 'provider': 'CSS Tricks', 'tags': 'frontend, css, layout, design, ui', 'url': 'https://css-tricks.com/'},
            {'title': 'Web Accessibility (A11y)', 'description': 'Building inclusive web applications.', 'difficulty': 'Intermediate', 'provider': 'W3C', 'tags': 'frontend, accessibility, a11y, web, standards', 'url': 'https://www.w3.org/WAI/fundamentals/accessibility-intro/'},

            # Backend
            {'title': 'Python for Everybody', 'description': 'Introduction to Python programming.', 'difficulty': 'Beginner', 'provider': 'Dr. Chuck', 'tags': 'backend, python, programming, basics', 'url': 'https://py4e.com/'},
            {'title': 'Flask Web Development', 'description': 'Developing web applications with Flask.', 'difficulty': 'Intermediate', 'provider': 'Flask Docs', 'tags': 'backend, python, flask, web, api', 'url': 'https://flask.palletsprojects.com/'},
            {'title': 'Django for Beginners', 'description': 'Build specific web applications with Django.', 'difficulty': 'Beginner', 'provider': 'Django Docs', 'tags': 'backend, python, django, web, framework', 'url': 'https://docs.djangoproject.com/en/5.0/intro/'},
            {'title': 'Node.js Crash Course', 'description': 'Server-side JavaScript with Node.js.', 'difficulty': 'Intermediate', 'provider': 'Node.js Docs', 'tags': 'backend, nodejs, javascript, server, runtime', 'url': 'https://nodejs.org/en/learn'},
            {'title': 'SQL vs NoSQL', 'description': 'Understanding database paradigms.', 'difficulty': 'Beginner', 'provider': 'MongoDB', 'tags': 'backend, database, sql, nosql, data', 'url': 'https://www.mongodb.com/nosql-explained'},
            {'title': 'PostgreSQL Mastery', 'description': 'Advanced SQL queries and optimization.', 'difficulty': 'Advanced', 'provider': 'PostgreSQL Docs', 'tags': 'backend, database, sql, postgresql, optimization', 'url': 'https://www.postgresql.org/docs/'},
            {'title': 'Building REST APIs', 'description': 'Design and implement RESTful services.', 'difficulty': 'Intermediate', 'provider': 'Restapitutorial', 'tags': 'backend, api, rest, web-services, integration', 'url': 'https://restfulapi.net/'},
            {'title': 'Microservices Architecture', 'description': 'Designing scalable distributed systems.', 'difficulty': 'Advanced', 'provider': 'Martin Fowler', 'tags': 'backend, microservices, architecture, scalable, system-design', 'url': 'https://martinfowler.com/articles/microservices.html'},
            {'title': 'Redis for Caching', 'description': 'High-performance caching with Redis.', 'difficulty': 'Advanced', 'provider': 'Redis Docs', 'tags': 'backend, redis, caching, performance, database', 'url': 'https://redis.io/docs/manual/transactions/'},

            # Data Science & AI
            {'title': 'Python for Data Science', 'description': 'Introduction to Python programming for data analysis.', 'difficulty': 'Beginner', 'provider': 'Kaggle', 'tags': 'data-science, python, analytics, numpy, pandas', 'url': 'https://www.kaggle.com/learn/python'},
            {'title': 'Machine Learning A-Z', 'description': 'Hands-on Python & R In Data Science.', 'difficulty': 'Advanced', 'provider': 'Coursera', 'tags': 'data-science, machine-learning, python, ai, algorithms', 'url': 'https://www.coursera.org/learn/machine-learning'},
            {'title': 'Deep Learning Specialization', 'description': 'Master Deep Learning, and break into AI.', 'difficulty': 'Advanced', 'provider': 'Coursera', 'tags': 'data-science, deep-learning, neural-networks, ai, tensorflow', 'url': 'https://www.coursera.org/specializations/deep-learning'},
            {'title': 'Data Visualization with D3', 'description': 'Build beautiful data visualizations.', 'difficulty': 'Intermediate', 'provider': 'D3.js', 'tags': 'data-science, visualization, d3, javascript, frontend', 'url': 'https://d3js.org/'},
            {'title': 'Pandas for Data Analysis', 'description': 'Data manipulation and analysis in Python.', 'difficulty': 'Intermediate', 'provider': 'Pandas Docs', 'tags': 'data-science, python, pandas, analysis, data-cleaning', 'url': 'https://pandas.pydata.org/docs/user_guide/10min.html'},
            {'title': 'Statistics for Data Science', 'description': 'Core statistical concepts for analysis.', 'difficulty': 'Beginner', 'provider': 'Khan Academy', 'tags': 'data-science, statistics, math, probability', 'url': 'https://www.khanacademy.org/math/statistics-probability'},
            {'title': 'Natural Language Processing', 'description': 'Processing text with NLP techniques.', 'difficulty': 'Advanced', 'provider': 'Stanford', 'tags': 'data-science, nlp, ai, text-processing, linguistics', 'url': 'https://web.stanford.edu/class/cs224n/'},

            # Full Stack & DevOps
            {'title': 'Full Stack Open', 'description': 'Deep dive into modern web development.', 'difficulty': 'Intermediate', 'provider': 'Full Stack Open', 'tags': 'fullstack, react, nodejs, graphql, typescript', 'url': 'https://fullstackopen.com/en/'},
            {'title': 'Docker and Kubernetes', 'description': 'Containerization and orchestration.', 'difficulty': 'Advanced', 'provider': 'Kubernetes Docs', 'tags': 'devops, docker, kubernetes, deployment, containers', 'url': 'https://kubernetes.io/docs/tutorials/'},
            {'title': 'CI/CD Pipelines', 'description': 'Automating software delivery.', 'difficulty': 'Intermediate', 'provider': 'GitLab', 'tags': 'devops, ci-cd, automation, testing, deployment', 'url': 'https://docs.gitlab.com/ee/ci/'},
            {'title': 'AWS Fundamentals', 'description': 'Introduction to Cloud Computing with AWS.', 'difficulty': 'Beginner', 'provider': 'AWS', 'tags': 'devops, aws, cloud, infrastructure', 'url': 'https://aws.amazon.com/getting-started/'},
            {'title': 'MERN Stack Front To Back', 'description': 'Full stack React, Redux, Node.js & MongoDB.', 'difficulty': 'Intermediate', 'provider': 'Udemy', 'tags': 'fullstack, mern, react, nodejs, mongodb', 'url': 'https://www.udemy.com/course/mern-stack-front-to-back/'}
        ]
        courses = [Course(**data) for data in courses_data]
        db.session.add_all(courses)
        
        # Create Dummy User
        user = User(username="testuser", email="test@example.com", password_hash=generate_password_hash("password123"), skill_level="Beginner")
        db.session.add(user)

        # Create Quizzes linked to Courses
        c1 = Course.query.filter_by(title='HTML & CSS Basics').first()
        c2 = Course.query.filter_by(title='Modern JavaScript').first()
        c3 = Course.query.filter_by(title='React for Beginners').first()
        c7 = Course.query.filter_by(title='Python for Everybody').first()
        c8 = Course.query.filter_by(title='Flask Web Development').first()
        c12 = Course.query.filter_by(title='Machine Learning A-Z').first()
        
        q1 = Quiz(title="Python Core Concepts", difficulty="Beginner", goal_id=2, skill_id=s2.id, course_id=c7.id)
        q2 = Quiz(title="React Basics Assessment", difficulty="Intermediate", goal_id=1, skill_id=s3.id, course_id=c3.id)
        q3 = Quiz(title="Machine Learning Fundamentals", difficulty="Advanced", goal_id=3, skill_id=s6.id, course_id=c12.id)
        q4 = Quiz(title="Frontend Foundations (HTML/CSS)", difficulty="Beginner", goal_id=1, skill_id=s1.id, course_id=c1.id)
        q5 = Quiz(title="JavaScript ES6+ Quiz", difficulty="Intermediate", goal_id=1, skill_id=s1.id, course_id=c2.id)
        q6 = Quiz(title="Flask Backend Quiz", difficulty="Intermediate", goal_id=2, skill_id=s4.id, course_id=c8.id)
        
        db.session.add_all([q1, q2, q3, q4, q5, q6])
        db.session.flush()

        questions = [
            # Beginner (Python for Everybody)
            Question(quiz_id=q1.id, text="Which keyword is used to define a function in Python?", 
                     option_a="func", option_b="define", option_c="def", option_d="function", correct_answer="C"),
            Question(quiz_id=q1.id, text="What is the result of 3 + 4 in Python?", 
                     option_a="6", option_b="7", option_c="8", option_d="34", correct_answer="B"),
            
            # Intermediate (React for Beginners)
            Question(quiz_id=q2.id, text="Which hook is used for state in functional components?", 
                     option_a="useEffect", option_b="useContext", option_c="useState", option_d="useReducer", correct_answer="C"),
            Question(quiz_id=q2.id, text="What command creates a new React app?", 
                     option_a="npm create react", option_b="npx create-react-app", option_c="git clone react", option_d="make react", correct_answer="B"),
            
            # Advanced (Machine Learning A-Z)
            Question(quiz_id=q3.id, text="Which optimizer is known for using adaptive learning rates?", 
                     option_a="SGD", option_b="Momentum", option_c="Adam", option_d="RMSProp", correct_answer="C"),
            Question(quiz_id=q3.id, text="What is the vanishing gradient problem associated with?", 
                     option_a="Short networks", option_b="Deep networks", option_c="Linear Regression", option_d="Data cleaning", correct_answer="B"),

            # Beginner (HTML & CSS Basics)
            Question(quiz_id=q4.id, text="What does HTML stand for?", 
                     option_a="HyperText Markup Language", option_b="HighText Machine Language", option_c="Hyperlink and Text Management", option_d="Home Tool Markup Language", correct_answer="A"),
            Question(quiz_id=q4.id, text="Which CSS property is used to change text color?", 
                     option_a="font-color", option_b="color", option_c="background-color", option_d="text-style", correct_answer="B"),
            
            # Intermediate (Modern JavaScript)
            Question(quiz_id=q5.id, text="Which keyword is used to declare a block-scoped variable?", 
                     option_a="var", option_b="let", option_c="define", option_d="const-var", correct_answer="B"),
            Question(quiz_id=q5.id, text="What is an arrow function?", 
                     option_a="A function that returns an arrow", option_b="A shorthand syntax for functions", option_c="A function used in SVG", option_d="A deprecated function type", correct_answer="B"),
            
            # Intermediate (Flask Web Development)
            Question(quiz_id=q6.id, text="What is Flask?", 
                     option_a="A database", option_b="A frontend library", option_c="A micro web framework for Python", option_d="A testing tool", correct_answer="C"),
            Question(quiz_id=q6.id, text="How do you define a route in Flask?", 
                     option_a="@app.route('/')", option_b="route('/')", option_c="get('/')", option_d="app.get('/')", correct_answer="A")
        ]
        db.session.add_all(questions)

        db.session.commit()
        print("Database seeded successfully with quizzes for all levels!")

if __name__ == "__main__":
    seed_data()

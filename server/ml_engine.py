from models import Course, Goal
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import pandas as pd

class MLEngine:
    def __init__(self, db_session):
        self.db = db_session
        self.vectorizer = TfidfVectorizer(stop_words='english')

    def get_recommendations(self, user_goal_id, user_skill_level):
        """
        Generates a learning path based on User Goal and Skill Level.
        Simple logic:
        1. Filter courses by difficulty (User Skill Level -> Course Difficulty)
        2. Filter/Rank courses by Goal keywords vs Course tags/description.
        """
        
        goal = self.db.query(Goal).filter_by(id=user_goal_id).first()
        if not goal:
            return []

        courses = self.db.query(Course).all()
        if not courses:
            return []

        # Convert to DataFrame for easier handling
        course_data = [{
            'id': c.id, 
            'title': c.title, 
            'tags': c.tags, 
            'description': c.description,
            'difficulty': c.difficulty
        } for c in courses]
        
        df = pd.DataFrame(course_data)

        # 1. Filter by Difficulty (Strictly match current level for tiered progression)
        df = df[df['difficulty'] == user_skill_level]
        
        if df.empty:
            return []

        # 2. Content-Based Filtering (Goal Name vs Course Tags/Desc)
        # We'll create a "soup" of metadata for each course
        # Weight tags more heavily by repeating them 3 times
        df['soup'] = (df['tags'] + " ") * 3 + df['description']
        
        # Compute TF-IDF matrix
        tfidf_matrix = self.vectorizer.fit_transform(df['soup'])
        
        # Compute Goal vector
        goal_tfidf = self.vectorizer.transform([goal.name + " " + goal.description])
        
        # Compute Cosine Similarity
        cosine_sim = linear_kernel(goal_tfidf, tfidf_matrix)

        # Get similarity scores
        sim_scores = list(enumerate(cosine_sim[0]))
        
        # Sort by similarity
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        
        # Get top 5 courses
        top_indices = [i[0] for i in sim_scores[:5]]
        
        recommended_courses = df.iloc[top_indices]
        
        return recommended_courses.to_dict('records')

# Usage example (requires active app context in real use)
# engine = MLEngine(db.session)
# recs = engine.get_recommendations(goal_id=1, skill_level='Beginner')

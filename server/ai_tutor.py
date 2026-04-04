import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class AITutor:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.has_api = True
        else:
            self.has_api = False

    def get_response(self, user_question, context=""):
        """
        Generate a response to the user's question.
        context: Optional string containing course info or user goals to ground the AI.
        """
        prompt = f"""
        You are an expert AI Learning Assistant for CogniPath.
        Your goal is to help students understand educational content and guide them through their learning path.
        
        Context: {context}
        User Question: {user_question}
        
        Please provide a concise, helpful, and encouraging response.
        """
        
        if self.has_api:
            try:
                response = self.model.generate_content(prompt)
                return response.text
            except Exception as e:
                return f"Error connecting to AI service: {str(e)}"
        else:
            return "I'm currently in 'offline mode' because no API key was found. I'm here to help you once you configure the GOOGLE_API_KEY!"

    def summarize_content(self, text):
        """Summarize course content."""
        if not text:
            return "No content to summarize."
            
        prompt = f"Please summarize the following educational content into 5 key bullet points:\n\n{text}"
        
        if self.has_api:
            try:
                response = self.model.generate_content(prompt)
                return response.text
            except Exception as e:
                return f"Error: {str(e)}"
        else:
            return "Summarization is unavailable in offline mode."

    def generate_dynamic_quiz(self, topic, difficulty, context=""):
        """Generates a dynamic multiple choice quiz as JSON."""
        prompt = f"""
        You are an expert AI Learning Assistant. Create a 3-question multiple choice quiz about '{topic}' at a {difficulty} difficulty level.
        Context: {context}
        
        You MUST return ONLY a valid JSON object in the following format, with no markdown formatting or backticks:
        {{
            "questions": [
                {{
                    "text": "Question text?",
                    "options": {{"A": "Option 1", "B": "Option 2", "C": "Option 3", "D": "Option 4"}},
                    "correct_answer": "A"
                }}
            ]
        }}
        """
        if self.has_api:
            try:
                response = self.model.generate_content(prompt)
                try:
                    clean_text = response.text.strip().removeprefix('```json').removesuffix('```').strip()
                    return json.loads(clean_text)
                except json.JSONDecodeError:
                    return {"error": "Failed to parse AI response as JSON", "raw_response": response.text}
            except Exception as e:
                return {"error": f"Error connecting to AI service: {str(e)}"}
        else:
            return {"error": "Offline mode active. Configure GOOGLE_API_KEY."}

    def grade_code(self, challenge_description, user_code):
        """Grades a user's submitted code and provides feedback."""
        prompt = f"""
        You are an expert coding instructor. The user was asked to solve this challenge: "{challenge_description}".
        Here is their code:
        ```
        {user_code}
        ```
        
        Evaluate the code for correctness, efficiency, and bugs. 
        You MUST return ONLY a valid JSON object in the following format, with no markdown formatting or backticks:
        {{
            "score": 100,
            "feedback": "<A brief paragraph of feedback>",
            "hints": ["<Hint 1>", "<Hint 2>"]
        }}
        """
        if self.has_api:
            try:
                response = self.model.generate_content(prompt)
                try:
                    clean_text = response.text.strip().removeprefix('```json').removesuffix('```').strip()
                    return json.loads(clean_text)
                except json.JSONDecodeError:
                    return {"error": "Failed to parse AI response", "raw": response.text}
            except Exception as e:
                return {"error": str(e)}
        else:
            return {"score": 0, "feedback": "Offline mode active.", "hints": []}

"""
Base Agent Class for TMS AI Agents
"""
import google.generativeai as genai
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.settings import GEMINI_API_KEY, GEMINI_MODEL

class BaseAgent:
    """
    Base class for all TMS AI agents
    """
    
    def __init__(self, agent_type="BaseAgent"):
        self.agent_type = agent_type
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel(GEMINI_MODEL)
    
    def call_gemini(self, prompt, temperature=0.7, timeout=120):
        """
        Call Gemini AI with given prompt
        
        Args:
            prompt: The prompt to send to Gemini
            temperature: Creativity level (0.0-1.0)
            timeout: Request timeout in seconds (not currently enforced by SDK)
            
        Returns:
            The AI response text
        """
        try:
            print(f"[{self.agent_type}] Calling Gemini AI...")
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                )
            )
            print(f"[{self.agent_type}] Gemini response received")
            return response.text
        except Exception as e:
            print(f"[{self.agent_type}] Error calling Gemini: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_type(self):
        """Return the agent type"""
        return self.agent_type

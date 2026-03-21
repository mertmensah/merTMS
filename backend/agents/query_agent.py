"""
LangChain-powered Query Agent for TMS
Uses ReAct pattern to autonomously answer questions about shipments, facilities, and operations
"""

import os
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from config.settings import GEMINI_MODEL
from agents.query_agent_tools import (
    search_orders_tool,
    get_facility_info_tool,
    calculate_metrics_tool,
    check_capacity_tool,
    optimize_route_tool
)


# Define the ReAct prompt template
REACT_PROMPT = """You are an intelligent TMS (Transportation Management System) assistant with access to powerful tools to help answer questions about shipments, facilities, and logistics operations.

You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

IMPORTANT: 
- Always use tools to get actual data, don't make up information
- Be concise and direct in your final answer
- If you can't find specific data, say so clearly
- Format numbers and dates nicely for readability

Begin!

Question: {input}
Thought: {agent_scratchpad}"""


class TMSQueryAgent:
    """LangChain agent for intelligent TMS queries"""
    
    def __init__(self):
        """Initialize the agent with tools and LLM"""
        
        # Get Gemini API key from environment
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        # Initialize LLM with current Gemini model
        self.llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,  # Use model from settings (gemini-2.5-flash)
            google_api_key=api_key,
            temperature=0,  # More deterministic for factual queries
            convert_system_message_to_human=True  # Gemini-specific setting
        )
        
        # Define tools
        self.tools = [
            Tool(
                name="SearchOrders",
                func=search_orders_tool,
                description="Search shipment orders by customer name, destination city/state, status (pending/delivered/delayed), or other criteria. Use this when you need to find specific orders or shipments. Input should be a search query string."
            ),
            Tool(
                name="GetFacilityInfo",
                func=get_facility_info_tool,
                description="Get detailed information about a facility, warehouse, or distribution center. Use this when you need address, location, or details about a specific facility. Input should be the facility name or city."
            ),
            Tool(
                name="CalculateMetrics",
                func=calculate_metrics_tool,
                description="Calculate performance metrics and KPIs like on-time delivery rate, average weight, top customers, revenue, or order statistics. Use this for analytics questions. Input should describe the metric type (e.g., 'on-time delivery', 'top customers', 'average weight')."
            ),
            Tool(
                name="CheckCapacity",
                func=check_capacity_tool,
                description="Check facility capacity and current utilization for a given location. Use this when asked about capacity, volume, or if a facility can handle more shipments. Input should be the facility name or city."
            ),
            Tool(
                name="OptimizeRoute",
                func=optimize_route_tool,
                description="Get optimized routing information between two locations including distance, cost, and transit time estimates. Use this for route planning questions. Input should be 'origin to destination' format."
            )
        ]
        
        # Create prompt
        prompt = PromptTemplate.from_template(REACT_PROMPT)
        
        # Create the ReAct agent
        agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        # Create executor
        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,  # Shows reasoning steps
            max_iterations=5,  # Prevent infinite loops
            handle_parsing_errors=True,  # Gracefully handle errors
            return_intermediate_steps=True  # Return thinking process
        )
    
    def query(self, question: str) -> dict:
        """
        Process a natural language query about TMS operations
        
        Args:
            question: Natural language question (e.g., "Show me all delayed shipments")
        
        Returns:
            dict with 'answer', 'steps', and 'success' keys
        """
        try:
            result = self.agent_executor.invoke({"input": question})
            
            return {
                "success": True,
                "answer": result.get("output", "No answer generated"),
                "steps": result.get("intermediate_steps", []),
                "question": question
            }
            
        except Exception as e:
            error_msg = str(e)
            
            # Check for specific Google API errors and preserve the message
            if any(phrase in error_msg.lower() for phrase in ['quota exceeded', 'resource exhausted', 'rate limit', '429']):
                user_friendly_error = f"Google Gemini API quota exceeded: {error_msg}"
            elif any(phrase in error_msg.lower() for phrase in ['invalid api key', 'api_key_invalid', 'unauthorized']):
                user_friendly_error = f"Invalid Gemini API key: {error_msg}"
            else:
                user_friendly_error = error_msg
            
            return {
                "success": False,
                "error": user_friendly_error,
                "answer": f"I encountered an error: {user_friendly_error}",
                "question": question
            }


# Singleton instance
_agent_instance = None

def get_agent():
    """Get or create the agent singleton"""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = TMSQueryAgent()
    return _agent_instance

"""
Customer Support Crew - Multi-agent system for handling customer inquiries
Uses crewAI to orchestrate multiple specialized agents working together
"""

from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from config.settings import GEMINI_API_KEY, GEMINI_MODEL
from database.supabase_client import SupabaseClient
import json
from datetime import datetime


class CustomerSupportCrew:
    """
    Multi-agent customer support system using crewAI
    Handles shipment tracking, ETA calculations, and customer inquiries
    """
    
    def __init__(self, db_client=None):
        """Initialize the crew with database access"""
        self.db_client = db_client or SupabaseClient()
        
        # Initialize LLM for agents
        self.llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GEMINI_API_KEY,
            temperature=0.3  # Slightly creative but mostly factual
        )
        
        # Create specialized agents
        self.query_interpreter = self._create_query_interpreter()
        self.data_retriever = self._create_data_retriever()
        self.eta_calculator = self._create_eta_calculator()
        self.response_writer = self._create_response_writer()
    
    def _create_query_interpreter(self):
        """Agent that understands customer intent"""
        return Agent(
            role='Customer Query Interpreter',
            goal='Understand what the customer is asking about their shipment',
            backstory="""You are an expert at understanding customer inquiries.
            You can identify if they're asking about shipment status, delivery time,
            location, delays, or general information. You extract key details like
            order numbers, customer names, and destinations from natural language.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
    
    def _create_data_retriever(self):
        """Agent that fetches shipment data"""
        return Agent(
            role='Shipment Data Retriever',
            goal='Find and retrieve accurate shipment information from the database',
            backstory="""You are a logistics data specialist with deep knowledge
            of the TMS database. You know how to search for orders by various criteria
            like order number, customer name, destination, or current status. You always
            provide complete and accurate shipment details.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
    
    def _create_eta_calculator(self):
        """Agent that calculates delivery times"""
        return Agent(
            role='ETA Calculator',
            goal='Provide accurate estimated delivery times based on shipment data',
            backstory="""You are a logistics timing expert who calculates delivery
            estimates. You consider current load status, origin, destination, and
            delivery windows to provide realistic ETAs. You understand transit times
            and can identify if shipments are on-time, delayed, or ahead of schedule.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
    
    def _create_response_writer(self):
        """Agent that writes customer-friendly responses"""
        return Agent(
            role='Customer Response Writer',
            goal='Craft professional, friendly, and helpful responses to customers',
            backstory="""You are a customer service expert who writes clear,
            empathetic, and professional responses. You always maintain a positive
            tone, provide specific details, and offer next steps or additional help.
            You avoid technical jargon and explain things in customer-friendly terms.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
    
    def handle_customer_query(self, question: str):
        """
        Process customer inquiry through multi-agent collaboration
        
        Args:
            question: Customer's natural language question
            
        Returns:
            dict with answer and agent reasoning
        """
        try:
            # Get database context for agents
            orders = self.db_client.get_all_orders()
            loads = self.db_client.get_all_loads()
            
            # Create context string
            context = f"""
DATABASE CONTEXT:
- Total orders in system: {len(orders)}
- Sample orders (first 3):
{json.dumps(orders[:3], indent=2, default=str)}

- Total loads: {len(loads)}
- Sample loads (first 2):
{json.dumps(loads[:2], indent=2, default=str)}

ORDER SCHEMA:
- order_number: Unique identifier (e.g., ORD-001)
- customer: Customer name
- origin: Pickup location
- destination: Delivery location
- status: Current status (Pending, Assigned, In Transit, Delivered)
- delivery_window_start, delivery_window_end: Expected delivery timeframe
- assigned_load_number: Associated load (if assigned)

LOAD SCHEMA:
- load_number: Unique identifier (e.g., LT-001)
- status: Current status (Planning, Scheduled, In Transit, Delivered)
- origin: Starting location
- estimated_delivery_date: When we expect to deliver
- truck_type: Type of truck used
"""
            
            # Define tasks for each agent
            interpret_task = Task(
                description=f"""Analyze this customer question and identify:
                1. What are they asking about? (status, location, ETA, delays, etc.)
                2. What specific details can you extract? (order number, customer name, destination)
                3. What type of response do they need?
                
                Customer Question: "{question}"
                
                Provide your analysis in a structured format.""",
                agent=self.query_interpreter,
                expected_output="Analysis of customer intent and extracted details"
            )
            
            retrieve_task = Task(
                description=f"""Based on the query interpretation, search the database for relevant shipment information.
                
                {context}
                
                Find the most relevant orders that match the customer's inquiry.
                Provide complete shipment details including status, location, and timing.""",
                agent=self.data_retriever,
                expected_output="Relevant shipment data from database"
            )
            
            eta_task = Task(
                description="""Analyze the retrieved shipment data and calculate/verify:
                1. Current estimated delivery time
                2. Whether shipment is on-time, delayed, or early
                3. Any factors affecting delivery timing
                
                Provide a clear delivery estimate.""",
                agent=self.eta_calculator,
                expected_output="Delivery time estimation and status assessment"
            )
            
            response_task = Task(
                description=f"""Using all the gathered information, write a professional and helpful
                response to the customer.
                
                Original question: "{question}"
                
                Your response should:
                - Directly answer their question
                - Provide specific shipment details (order number, status, location)
                - Give a clear delivery estimate
                - Be friendly and professional
                - Offer additional help if needed
                
                Keep response concise (2-4 paragraphs).""",
                agent=self.response_writer,
                expected_output="Customer-friendly response message"
            )
            
            # Create and run the crew
            crew = Crew(
                agents=[
                    self.query_interpreter,
                    self.data_retriever,
                    self.eta_calculator,
                    self.response_writer
                ],
                tasks=[interpret_task, retrieve_task, eta_task, response_task],
                process=Process.sequential,  # Tasks run in order
                verbose=True
            )
            
            # Execute the crew
            print(f"[CUSTOMER SUPPORT CREW] Processing inquiry: {question}")
            result = crew.kickoff()
            
            return {
                "success": True,
                "answer": str(result),
                "crew_type": "customer_support",
                "agents_used": 4
            }
            
        except Exception as e:
            print(f"[CUSTOMER SUPPORT CREW] Error: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "error": str(e),
                "answer": f"I apologize, but I encountered an error processing your request: {str(e)}"
            }


# Singleton instance
_crew_instance = None

def get_customer_support_crew():
    """Get or create the customer support crew singleton"""
    global _crew_instance
    if _crew_instance is None:
        _crew_instance = CustomerSupportCrew()
    return _crew_instance

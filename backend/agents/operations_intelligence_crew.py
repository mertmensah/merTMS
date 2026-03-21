"""
Operations Intelligence Crew - Multi-agent system for operations analysis
Uses crewAI to orchestrate analytical agents that provide insights and KPIs
"""

from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from config.settings import GEMINI_API_KEY, GEMINI_MODEL
from database.supabase_client import SupabaseClient
import json
from datetime import datetime, timedelta


class OperationsIntelligenceCrew:
    """
    Multi-agent operations intelligence system using crewAI
    Analyzes TMS data and provides KPIs with natural language insights
    """
    
    def __init__(self, db_client=None):
        """Initialize the crew with database access"""
        self.db_client = db_client or SupabaseClient()
        
        # Initialize LLM for agents
        self.llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GEMINI_API_KEY,
            temperature=0.4  # Balance between creativity and accuracy
        )
        
        # Create specialized agents
        self.data_analyst = self._create_data_analyst()
        self.performance_monitor = self._create_performance_monitor()
        self.forecasting_agent = self._create_forecasting_agent()
        self.report_generator = self._create_report_generator()
    
    def _create_data_analyst(self):
        """Agent that analyzes operational data"""
        return Agent(
            role='Operations Data Analyst',
            goal='Analyze TMS data to identify patterns, trends, and anomalies',
            backstory="""You are a senior logistics data analyst with years of experience
            in transportation management. You excel at finding insights in operational data,
            identifying inefficiencies, and spotting opportunities for improvement. You understand
            order flows, load utilization, carrier performance, and delivery metrics.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
    
    def _create_performance_monitor(self):
        """Agent that tracks KPIs"""
        return Agent(
            role='Performance Monitor',
            goal='Calculate and track key performance indicators for operations',
            backstory="""You are a KPI specialist who knows which metrics matter most
            in logistics operations. You track on-time delivery rates, load utilization,
            cost per mile, order volumes, and carrier performance. You can quickly identify
            when metrics are trending up or down and what that means for the business.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
    
    def _create_forecasting_agent(self):
        """Agent that predicts future trends"""
        return Agent(
            role='Demand Forecaster',
            goal='Predict future trends and potential issues in operations',
            backstory="""You are a forecasting expert who analyzes historical patterns
            to predict future demand, capacity needs, and potential bottlenecks. You can
            spot seasonal trends, growth patterns, and emerging issues before they become
            critical. You help operations teams plan proactively.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
    
    def _create_report_generator(self):
        """Agent that creates executive summaries"""
        return Agent(
            role='Report Generator',
            goal='Create clear, actionable insights for operations leadership',
            backstory="""You are an operations reporting expert who translates data
            into clear, actionable insights for leadership. You write concise summaries
            that highlight what matters most, explain trends in plain language, and
            provide specific recommendations. Your reports are always clear, factual,
            and focused on actionable intelligence.""",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
    
    def generate_operations_report(self, time_period="today"):
        """
        Generate operations intelligence report with KPIs and insights
        
        Args:
            time_period: "today", "week", "month"
            
        Returns:
            dict with KPIs and natural language insights
        """
        try:
            # Get data from database
            orders = self.db_client.get_all_orders()
            loads = self.db_client.get_all_loads()
            facilities = self.db_client.get_all_facilities()
            
            # Calculate basic metrics
            total_orders = len(orders)
            total_loads = len(loads)
            
            # Status breakdown
            order_statuses = {}
            for order in orders:
                status = order.get('status', 'Unknown')
                order_statuses[status] = order_statuses.get(status, 0) + 1
            
            load_statuses = {}
            for load in loads:
                status = load.get('status', 'Unknown')
                load_statuses[status] = load_statuses.get(status, 0) + 1
            
            # Get today's date for filtering
            today = datetime.now().date()
            
            # Create comprehensive context
            context = f"""
CURRENT OPERATIONS DATA:
========================

ORDERS:
- Total: {total_orders}
- By Status: {json.dumps(order_statuses, indent=2)}
- Sample Recent Orders: {json.dumps(orders[:5], indent=2, default=str)}

LOADS:
- Total: {total_loads}
- By Status: {json.dumps(load_statuses, indent=2)}
- Sample Recent Loads: {json.dumps(loads[:5], indent=2, default=str)}

FACILITIES:
- Total Facilities: {len(facilities)}
- Locations: {[f.get('city') + ', ' + f.get('state_province', '') for f in facilities[:5]]}

TIME PERIOD: {time_period}
CURRENT DATE: {today}
"""
            
            # Define tasks for each agent
            analyze_task = Task(
                description=f"""Analyze the TMS operational data and identify:
                1. Overall operational health
                2. Order and load volume trends
                3. Any concerning patterns or anomalies
                4. Areas performing well
                5. Areas needing attention
                
                {context}
                
                Provide a structured analysis.""",
                agent=self.data_analyst,
                expected_output="Detailed data analysis with key findings"
            )
            
            kpi_task = Task(
                description=f"""Calculate and evaluate these key performance indicators:
                1. Total active orders
                2. Total active loads  
                3. On-time delivery performance
                4. Load utilization rates
                5. Order-to-load assignment efficiency
                
                {context}
                
                For each KPI, provide:
                - Current value
                - Trend (up, down, stable)
                - Assessment (good, concerning, critical)""",
                agent=self.performance_monitor,
                expected_output="KPI calculations with trend analysis"
            )
            
            forecast_task = Task(
                description=f"""Based on the current data and patterns, forecast:
                1. Expected order volume for next 7 days
                2. Potential capacity constraints
                3. Emerging bottlenecks or issues
                4. Opportunities for optimization
                
                {context}
                
                Provide specific predictions with confidence levels.""",
                agent=self.forecasting_agent,
                expected_output="Forecast predictions and risk assessment"
            )
            
            report_task = Task(
                description=f"""Create a concise operations intelligence report for leadership.
                
                Synthesize all analyses into:
                1. Executive Summary (2-3 sentences on overall status)
                2. Key Metrics (top 5 KPIs with current values)
                3. Notable Insights (3-4 bullet points of important findings)
                4. Recommendations (2-3 specific action items)
                5. Forecast (what to expect in next few days)
                
                Keep it actionable and avoid jargon. Focus on what matters most.""",
                agent=self.report_generator,
                expected_output="Executive operations report"
            )
            
            # Create and run the crew
            crew = Crew(
                agents=[
                    self.data_analyst,
                    self.performance_monitor,
                    self.forecasting_agent,
                    self.report_generator
                ],
                tasks=[analyze_task, kpi_task, forecast_task, report_task],
                process=Process.sequential,
                verbose=True
            )
            
            # Execute the crew
            print(f"[OPERATIONS INTELLIGENCE CREW] Generating report for {time_period}")
            result = crew.kickoff()
            
            # Extract KPI data for dashboard cards
            kpis = {
                "total_orders": total_orders,
                "total_loads": total_loads,
                "in_transit": order_statuses.get('In Transit', 0),
                "delivered_today": order_statuses.get('Delivered', 0),
                "pending_assignment": order_statuses.get('Pending', 0),
                "load_utilization": f"{(load_statuses.get('In Transit', 0) / max(total_loads, 1) * 100):.1f}%"
            }
            
            return {
                "success": True,
                "report": str(result),
                "kpis": kpis,
                "breakdown": {
                    "order_statuses": order_statuses,
                    "load_statuses": load_statuses
                },
                "crew_type": "operations_intelligence",
                "agents_used": 4,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"[OPERATIONS INTELLIGENCE CREW] Error: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "error": str(e),
                "report": f"Unable to generate operations report: {str(e)}"
            }


# Singleton instance
_crew_instance = None

def get_operations_intelligence_crew():
    """Get or create the operations intelligence crew singleton"""
    global _crew_instance
    if _crew_instance is None:
        _crew_instance = OperationsIntelligenceCrew()
    return _crew_instance

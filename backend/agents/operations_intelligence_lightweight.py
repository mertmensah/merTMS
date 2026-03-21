"""
Lightweight Operations Intelligence - Multi-agent simulation without crewAI
Uses sequential LLM calls to simulate multi-agent collaboration
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from config.settings import GEMINI_API_KEY, GEMINI_MODEL
from database.supabase_client import SupabaseClient
import json
from datetime import datetime, timedelta


def get_operations_intelligence(time_period='today'):
    """
    Lightweight multi-agent intelligence without crewAI framework
    Simulates 4 agents working sequentially
    """
    try:
        print(f"[LIGHTWEIGHT INTEL] Starting multi-agent analysis for {time_period}")
        
        # Initialize database and LLM with error handling
        try:
            db_client = SupabaseClient()
            print("[LIGHTWEIGHT INTEL] ✓ Database client initialized")
        except Exception as db_err:
            print(f"[LIGHTWEIGHT INTEL] ❌ Database init failed: {db_err}")
            raise
            
        try:
            llm = ChatGoogleGenerativeAI(
                model=GEMINI_MODEL,
                google_api_key=GEMINI_API_KEY,
                temperature=0.4
            )
            print("[LIGHTWEIGHT INTEL] ✓ LLM initialized")
        except Exception as llm_err:
            print(f"[LIGHTWEIGHT INTEL] ❌ LLM init failed: {llm_err}")
            raise
        
        # Agent 1: Data Analyst - Fetch and analyze data
        print("[AGENT 1/4] Data Analyst - Fetching operations data...")
        
        # Determine date range
        today = datetime.now().date()
        if time_period == 'today':
            start_date = today
            end_date = today
        elif time_period == 'week':
            start_date = today - timedelta(days=7)
            end_date = today
        else:  # month
            start_date = today - timedelta(days=30)
            end_date = today
        
        # Fetch orders and loads
        orders_response = db_client.get_orders()
        loads_response = db_client.get_loads()
        
        orders = orders_response.get('data', [])
        loads = loads_response.get('data', [])
        
        # Filter by date range
        date_filtered_loads = []
        for load in loads:
            created_at = load.get('created_at', '')[:10]
            if start_date.isoformat() <= created_at <= end_date.isoformat():
                date_filtered_loads.append(load)
        
        # Calculate basic KPIs
        total_loads = len(date_filtered_loads)
        total_orders = len([o for o in orders if start_date.isoformat() <= o.get('created_at', '')[:10] <= end_date.isoformat()])
        
        # Status breakdown
        delivered = len([l for l in date_filtered_loads if l.get('status') == 'delivered'])
        in_transit = len([l for l in date_filtered_loads if l.get('status') == 'in_transit'])
        pending = len([l for l in date_filtered_loads if l.get('status') == 'pending'])
        
        # Calculate delivery performance
        delivery_rate = (delivered / total_loads * 100) if total_loads > 0 else 0
        
        data_summary = f"""
        Time Period: {time_period}
        Total Loads: {total_loads}
        Total Orders: {total_orders}
        Delivery Rate: {delivery_rate:.1f}%
        Status Breakdown:
        - Delivered: {delivered}
        - In Transit: {in_transit}
        - Pending: {pending}
        """
        
        print("[AGENT 1/4] ✓ Data analysis complete")
        
        # Agent 2: Performance Monitor - Evaluate performance
        print("[AGENT 2/4] Performance Monitor - Analyzing trends...")
        
        performance_prompt = f"""You are a TMS Performance Monitor analyzing operational data.
        
Data Summary:
{data_summary}

Analyze this data and provide:
1. Key performance insights (2-3 sentences)
2. Notable trends or patterns
3. Performance rating (Excellent/Good/Needs Improvement)

Keep response concise and actionable."""
        
        performance_analysis = llm.invoke(performance_prompt).content
        print("[AGENT 2/4] ✓ Performance analysis complete")
        
        # Agent 3: Forecasting Agent - Predict future trends
        print("[AGENT 3/4] Forecasting Agent - Generating predictions...")
        
        forecast_prompt = f"""You are a TMS Forecasting Agent. Based on this data:

{data_summary}

Performance Analysis:
{performance_analysis}

Provide:
1. Short-term forecast (next 1-3 days)
2. One key recommendation for optimization

Keep response brief (2-3 sentences)."""
        
        forecast = llm.invoke(forecast_prompt).content
        print("[AGENT 3/4] ✓ Forecast generation complete")
        
        # Agent 4: Report Generator - Compile executive summary
        print("[AGENT 4/4] Report Generator - Compiling executive summary...")
        
        report_prompt = f"""You are a TMS Report Generator. Compile an executive summary from this multi-agent analysis:

Data Analysis:
{data_summary}

Performance Insights:
{performance_analysis}

Forecast:
{forecast}

Create a professional executive summary (4-5 sentences) that:
- Highlights key operational metrics
- Notes performance status
- Provides actionable insights
- Mentions forecast/recommendations

Use an authoritative, data-driven tone."""
        
        final_report = llm.invoke(report_prompt).content
        print("[AGENT 4/4] ✓ Report compilation complete")
        
        # Compile results
        result = {
            "success": True,
            "report": final_report,
            "kpis": {
                "total_loads": total_loads,
                "total_orders": total_orders,
                "delivery_rate": round(delivery_rate, 1),
                "delivered": delivered,
                "in_transit": in_transit,
                "pending": pending
            },
            "breakdown": {
                "data_analysis": data_summary.strip(),
                "performance_analysis": performance_analysis,
                "forecast": forecast
            },
            "agents_used": [
                "Data Analyst",
                "Performance Monitor",
                "Forecasting Agent",
                "Report Generator"
            ],
            "generated_at": datetime.now().isoformat(),
            "framework": "lightweight_multi_agent"
        }
        
        print(f"[LIGHTWEIGHT INTEL] ✓ Multi-agent analysis complete")
        return result
        
    except Exception as e:
        print(f"[LIGHTWEIGHT INTEL] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": f"Operations intelligence failed: {str(e)}",
            "agents_used": [],
            "generated_at": datetime.now().isoformat()
        }

"""
Lightweight Customer Support - Multi-agent simulation without crewAI
Uses sequential LLM calls to simulate multi-agent collaboration
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from config.settings import GEMINI_API_KEY, GEMINI_MODEL
from database.supabase_client import SupabaseClient
from datetime import datetime


def handle_customer_query(question):
    """
    Lightweight multi-agent customer support without crewAI framework
    Simulates 4 agents working sequentially: Query Interpreter, Data Retriever, ETA Calculator, Response Writer
    """
    try:
        print(f"[LIGHTWEIGHT SUPPORT] Processing query: {question}")
        
        # Initialize database and LLM
        db_client = SupabaseClient()
        llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GEMINI_API_KEY,
            temperature=0.5
        )
        
        # Agent 1: Query Interpreter - Understand intent
        print("[AGENT 1/4] Query Interpreter - Analyzing customer question...")
        
        interpret_prompt = f"""You are a Query Interpreter for a TMS (Transportation Management System).

Customer Question: "{question}"

Identify:
1. Intent (track_shipment, get_eta, check_status, general_info)
2. Key entities (order numbers, cities, dates)
3. Required data (orders, loads, routes)

Respond in JSON format:
{{
  "intent": "...",
  "entities": [...],
  "data_needed": [...]
}}"""
        
        interpretation = llm.invoke(interpret_prompt).content
        print(f"[AGENT 1/4] ✓ Interpretation: {interpretation}")
        
        # Agent 2: Data Retriever - Fetch relevant data
        print("[AGENT 2/4] Data Retriever - Fetching relevant data...")
        
        # Fetch all data (simplified - in production would filter based on interpretation)
        orders_response = db_client.get_orders()
        loads_response = db_client.get_loads()
        
        orders = orders_response.get('data', [])[:10]  # Limit for context
        loads = loads_response.get('data', [])[:10]
        
        data_context = f"""
Available Orders: {len(orders)}
Sample Orders: {orders[:3] if orders else 'None'}

Available Loads: {len(loads)}
Sample Loads: {loads[:3] if loads else 'None'}
"""
        
        print("[AGENT 2/4] ✓ Data retrieval complete")
        
        # Agent 3: ETA Calculator / Analyzer - Analyze specific needs
        print("[AGENT 3/4] Analyzer - Processing specific requirements...")
        
        analysis_prompt = f"""You are a TMS Analyst.

Customer Question: "{question}"
Query Interpretation: {interpretation}

Relevant Data:
{data_context}

Provide specific analysis or calculations requested. If asking about:
- Delivery times: Estimate based on typical transit times
- Order status: Check order/load statuses
- General info: Provide explanations

Keep response brief and data-driven (2-3 sentences)."""
        
        analysis = llm.invoke(analysis_prompt).content
        print("[AGENT 3/4] ✓ Analysis complete")
        
        # Agent 4: Response Writer - Craft customer-friendly answer
        print("[AGENT 4/4] Response Writer - Crafting final answer...")
        
        response_prompt = f"""You are a Customer Support Response Writer for a TMS.

Customer Question: "{question}"

Analysis Chain:
1. Query Interpretation: {interpretation}
2. Retrieved Data: {data_context}
3. Analysis: {analysis}

Write a helpful, professional customer support response that:
- Directly answers their question
- Uses data from the analysis
- Is friendly and clear
- Provides actionable next steps if needed

Keep response concise (3-5 sentences)."""
        
        final_answer = llm.invoke(response_prompt).content
        print("[AGENT 4/4] ✓ Response crafted")
        
        # Compile results
        result = {
            "success": True,
            "answer": final_answer,
            "crew_type": "customer_support",
            "agents_used": [
                "Query Interpreter",
                "Data Retriever",
                "ETA Calculator",
                "Response Writer"
            ],
            "reasoning_chain": {
                "interpretation": interpretation,
                "data_retrieved": f"{len(orders)} orders, {len(loads)} loads",
                "analysis": analysis
            },
            "generated_at": datetime.now().isoformat(),
            "framework": "lightweight_multi_agent"
        }
        
        print(f"[LIGHTWEIGHT SUPPORT] ✓ Query processed successfully")
        return result
        
    except Exception as e:
        print(f"[LIGHTWEIGHT SUPPORT] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": f"Customer support query failed: {str(e)}",
            "answer": "I apologize, but I'm having trouble processing your request right now. Please try again or contact support directly.",
            "agents_used": [],
            "generated_at": datetime.now().isoformat()
        }

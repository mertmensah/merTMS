"""
Cost Analyzer Agent
Analyzes costs and identifies savings opportunities
"""
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.base_agent import BaseAgent
from config.settings import (
    BASE_RATE_PER_MILE,
    FUEL_SURCHARGE_PERCENT,
    DETENTION_RATE_PER_HOUR,
    AVERAGE_MPG
)

class CostAnalyzerAgent(BaseAgent):
    """
    AI Agent that analyzes transportation costs and identifies savings
    """
    
    def __init__(self):
        super().__init__(agent_type="CostAnalyzer")
    
    def analyze_costs(self, load_plan, route_plan):
        """
        Analyze costs for loads and routes
        
        Args:
            load_plan: Optimized load plan from LoadOptimizerAgent
            route_plan: Route plan from RoutePlannerAgent
            
        Returns:
            Detailed cost analysis with savings opportunities
        """
        
        analysis_data = self._format_data_for_ai(load_plan, route_plan)
        
        prompt = f"""You are a logistics cost analyst specializing in transportation economics.

COST PARAMETERS:
- Base Rate: ${BASE_RATE_PER_MILE}/mile
- Fuel Surcharge: {FUEL_SURCHARGE_PERCENT * 100}%
- Detention Rate: ${DETENTION_RATE_PER_HOUR}/hour
- Average Fuel Economy: {AVERAGE_MPG} MPG

LOAD AND ROUTE DATA:
{analysis_data}

TASK:
Provide a comprehensive cost analysis that includes:
1. Detailed cost breakdown per load
2. Total transportation costs
3. Cost per order
4. Comparison to unoptimized baseline (estimated)
5. Specific savings opportunities identified
6. Recommendations for further cost reduction

Return your response as a JSON object with this structure:
{{
    "cost_analysis": {{
        "loads": [
            {{
                "load_id": "LOAD_001",
                "base_freight_cost": 2125.00,
                "fuel_surcharge": 318.75,
                "detention_fees": 0,
                "total_load_cost": 2443.75,
                "cost_per_mile": 2.875,
                "orders_in_load": 3,
                "cost_per_order": 814.58
            }}
        ],
        "totals": {{
            "total_freight_cost": 6500.00,
            "total_fuel_surcharge": 975.00,
            "total_detention": 0,
            "grand_total": 7475.00,
            "total_orders": 10,
            "avg_cost_per_order": 747.50
        }},
        "baseline_comparison": {{
            "unoptimized_cost_estimate": 10200.00,
            "optimized_cost": 7475.00,
            "savings_amount": 2725.00,
            "savings_percent": 26.7
        }},
        "savings_breakdown": [
            {{
                "category": "Load Consolidation",
                "amount": 1800.00,
                "description": "Reduced from 6 trucks to 3 through optimal consolidation"
            }},
            {{
                "category": "Route Optimization",
                "amount": 625.00,
                "description": "Eliminated 250 miles through efficient routing"
            }},
            {{
                "category": "Truck Utilization",
                "amount": 300.00,
                "description": "Improved capacity utilization from 65% to 85%"
            }}
        ],
        "recommendations": [
            "Consider negotiating volume discounts with carriers for this lane",
            "Explore backhaul opportunities to reduce empty miles",
            "Implement real-time fuel price monitoring for route adjustments"
        ]
    }}
}}
"""
        
        # Call Gemini AI
        response = self.call_gemini(prompt, temperature=0.4)
        
        if response:
            try:
                # Extract JSON from response
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                json_str = response[json_start:json_end]
                cost_analysis = json.loads(json_str)
                return cost_analysis
            except Exception as e:
                print(f"Error parsing AI response: {str(e)}")
                return self._create_basic_analysis(load_plan, route_plan)
        else:
            return self._create_basic_analysis(load_plan, route_plan)
    
    def _format_data_for_ai(self, load_plan, route_plan):
        """Format load and route data for AI analysis"""
        summary = ["LOAD PLAN SUMMARY:"]
        
        if load_plan and 'loads' in load_plan:
            for load in load_plan['loads']:
                summary.append(
                    f"  {load.get('load_id', 'N/A')}: "
                    f"{len(load.get('orders', []))} orders, "
                    f"{load.get('total_weight_lbs', 0)} lbs, "
                    f"{load.get('utilization_percent', 0)}% utilization"
                )
        
        summary.append("\nROUTE PLAN SUMMARY:")
        if route_plan and 'route' in route_plan:
            route = route_plan['route']
            summary.append(
                f"  Total Miles: {route.get('total_miles', 0)}, "
                f"Drive Time: {route.get('total_drive_time_hours', 0)} hours, "
                f"Stops: {len(route.get('stops', []))}"
            )
        
        return "\n".join(summary)
    
    def _create_basic_analysis(self, load_plan, route_plan):
        """Fallback: Create basic cost analysis without AI"""
        total_miles = 0
        total_loads = 0
        
        if route_plan and 'route' in route_plan:
            total_miles = route_plan['route'].get('total_miles', 0)
        
        if load_plan and 'loads' in load_plan:
            total_loads = len(load_plan['loads'])
        
        base_cost = total_miles * BASE_RATE_PER_MILE
        fuel_surcharge = base_cost * FUEL_SURCHARGE_PERCENT
        total_cost = base_cost + fuel_surcharge
        
        return {
            "cost_analysis": {
                "totals": {
                    "total_freight_cost": round(base_cost, 2),
                    "total_fuel_surcharge": round(fuel_surcharge, 2),
                    "grand_total": round(total_cost, 2),
                    "total_loads": total_loads
                },
                "baseline_comparison": {
                    "optimized_cost": round(total_cost, 2),
                    "savings_percent": 0
                },
                "recommendations": [
                    "AI analysis unavailable - basic calculation performed"
                ]
            }
        }

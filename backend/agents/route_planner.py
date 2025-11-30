"""
Route Planner Agent
Optimizes delivery routes for efficiency
"""
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.base_agent import BaseAgent
from config.settings import (
    MAX_DRIVING_HOURS_PER_DAY,
    AVERAGE_SPEED_MPH
)

class RoutePlannerAgent(BaseAgent):
    """
    AI Agent that optimizes delivery routes
    """
    
    def __init__(self):
        super().__init__(agent_type="RoutePlanner")
    
    def plan_route(self, load_data):
        """
        Create optimized delivery route for a load
        
        Args:
            load_data: Dictionary with origin, destinations, and constraints
            
        Returns:
            Optimized route plan with stops and timing
        """
        
        load_summary = self._format_load_for_ai(load_data)
        
        prompt = f"""You are a logistics expert specializing in route optimization for trucking.

ROUTE CONSTRAINTS:
- Max Driving Hours Per Day: {MAX_DRIVING_HOURS_PER_DAY} hours
- Average Speed: {AVERAGE_SPEED_MPH} mph
- Must account for rest breaks (30 min after 8 hours)
- Must consider traffic patterns and time zones

LOAD TO ROUTE:
{load_summary}

TASK:
Create an optimal delivery route that:
1. Minimizes total miles and driving time
2. Optimizes stop sequence (no backtracking)
3. Respects Hours of Service (HOS) regulations
4. Accounts for delivery time windows
5. Considers fuel-efficient routing

Return your response as a JSON object with this structure:
{{
    "route": {{
        "load_id": "LOAD_001",
        "origin": "Chicago, IL",
        "stops": [
            {{
                "stop_number": 1,
                "location": "Detroit, MI",
                "arrival_time": "2024-01-15 14:00",
                "departure_time": "2024-01-15 15:00",
                "distance_from_previous_miles": 280,
                "orders_delivered": ["order_1", "order_2"]
            }}
        ],
        "total_miles": 850,
        "total_drive_time_hours": 15.5,
        "total_days": 2,
        "fuel_cost_estimate": 425.00,
        "route_efficiency_score": 92
    }},
    "optimization_insights": [
        "Grouped Detroit and Cleveland stops to minimize backtracking",
        "Scheduled overnight rest in Toledo, OH for HOS compliance"
    ]
}}
"""
        
        # Call Gemini AI
        response = self.call_gemini(prompt, temperature=0.3)
        
        if response:
            try:
                # Extract JSON from response
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                json_str = response[json_start:json_end]
                route_plan = json.loads(json_str)
                return route_plan
            except Exception as e:
                print(f"Error parsing AI response: {str(e)}")
                return self._create_basic_route(load_data)
        else:
            return self._create_basic_route(load_data)
    
    def _format_load_for_ai(self, load_data):
        """Format load data into readable text for AI"""
        summary = [
            f"Load ID: {load_data.get('load_id', 'N/A')}",
            f"Origin: {load_data.get('origin', 'Unknown')}",
            f"Truck Type: {load_data.get('truck_type', 'DRY_VAN')}",
            "\nDelivery Stops:"
        ]
        
        for idx, dest in enumerate(load_data.get('destinations', []), 1):
            summary.append(
                f"  {idx}. {dest.get('location', 'Unknown')} - "
                f"Orders: {', '.join(dest.get('orders', []))} - "
                f"Delivery Window: {dest.get('delivery_window', 'Flexible')}"
            )
        
        return "\n".join(summary)
    
    def _create_basic_route(self, load_data):
        """Fallback: Create basic route without AI"""
        stops = []
        total_miles = 0
        
        for idx, dest in enumerate(load_data.get('destinations', []), 1):
            # Estimate 300 miles per stop (placeholder)
            distance = 300
            total_miles += distance
            
            stops.append({
                "stop_number": idx,
                "location": dest.get('location', 'Unknown'),
                "distance_from_previous_miles": distance,
                "orders_delivered": dest.get('orders', [])
            })
        
        return {
            "route": {
                "load_id": load_data.get('load_id'),
                "origin": load_data.get('origin'),
                "stops": stops,
                "total_miles": total_miles,
                "total_drive_time_hours": total_miles / AVERAGE_SPEED_MPH,
                "route_efficiency_score": 0
            },
            "optimization_insights": ["Basic route created without AI optimization"]
        }

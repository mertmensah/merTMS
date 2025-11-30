"""
Control Tower Simulator Agent
Generates realistic test loads for Control Tower demonstration with proper date handling
"""
import json
import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.base_agent import BaseAgent

class ControlTowerSimulatorAgent(BaseAgent):
    """
    AI Agent that generates realistic load simulation data for Control Tower testing
    Ensures proper database architecture compliance and date handling
    """
    
    def __init__(self):
        super().__init__(agent_type="ControlTowerSimulator")
    
    def generate_simulation_plan(self, available_orders, existing_loads, today_date):
        """
        Generate a simulation plan for Control Tower loads
        
        Args:
            available_orders: List of available order dictionaries
            existing_loads: List of existing loads to determine next load number
            today_date: The date string (YYYY-MM-DD) for today
            
        Returns:
            Simulation plan with loads categorized by status and risk
        """
        
        print(f"[CONTROL TOWER SIMULATOR] Generating simulation plan for {today_date}")
        print(f"[CONTROL TOWER SIMULATOR] Available orders: {len(available_orders)}")
        print(f"[CONTROL TOWER SIMULATOR] Existing loads: {len(existing_loads)}")
        
        # Get next CT load number
        ct_loads = [l for l in existing_loads if l.get('load_number', '').startswith('CT-')]
        next_ct_num = len(ct_loads) + 1
        
        # Calculate tomorrow for at-risk loads
        today = datetime.strptime(today_date, '%Y-%m-%d').date()
        tomorrow = today + timedelta(days=1)
        
        # Build context for AI
        prompt = f"""You are a logistics data architect generating realistic test data for a Transportation Management System (TMS) Control Tower.

DATABASE ARCHITECTURE:
====================

LOADS TABLE SCHEMA:
- load_number (VARCHAR): Unique load identifier (format: CT-XXX)
- truck_type (VARCHAR): Type of truck (53ft Dry Van, 48ft Dry Van, Refrigerated, Flatbed)
- total_weight_lbs (DECIMAL): Total weight in pounds
- total_volume_cuft (DECIMAL): Total volume in cubic feet
- utilization_percent (DECIMAL): Percentage of truck capacity used (75-95% is ideal)
- origin (VARCHAR): Starting location (city, state format)
- status (VARCHAR): Current load status
- estimated_delivery_date (DATE): When we estimate the load will deliver
- created_at (TIMESTAMP): Auto-generated

ORDERS TABLE SCHEMA:
- order_number (VARCHAR): Unique order identifier
- customer (VARCHAR): Customer name
- origin (VARCHAR): Pickup location
- destination (VARCHAR): Delivery location  
- weight_lbs (DECIMAL): Order weight
- volume_cuft (DECIMAL): Order volume
- status (VARCHAR): Order status (In Transit, Delivered, Assigned, Pending)
- customer_expected_delivery_date (DATE): When customer expects delivery
- delivery_window_start (TIMESTAMP): Delivery window start
- delivery_window_end (TIMESTAMP): Delivery window end

CONTROL TOWER REQUIREMENTS:
===========================
TODAY'S DATE: {today_date}
TOMORROW'S DATE: {tomorrow}

The Control Tower needs THREE SCENARIOS:

1. DELIVERED LOADS (3 loads):
   - status: "Delivered"
   - estimated_delivery_date: "{today_date}"
   - All orders: customer_expected_delivery_date = "{today_date}"
   - All orders: status = "Delivered"
   - These represent successful on-time deliveries

2. ON-TIME LOADS (3 loads):
   - status: "In Transit"
   - estimated_delivery_date: "{today_date}"
   - All orders: customer_expected_delivery_date = "{today_date}"
   - All orders: status = "In Transit"
   - These are currently on track to deliver today as expected

3. AT-RISK LOADS (2 loads):
   - status: "In Transit"
   - estimated_delivery_date: "{tomorrow}" (TOMORROW - this is the key!)
   - All orders: customer_expected_delivery_date = "{today_date}" (CUSTOMER EXPECTS TODAY!)
   - All orders: status = "In Transit"
   - CRITICAL: These will be LATE - estimated delivery is tomorrow but customer expects today
   - These should trigger alerts in the Control Tower

AVAILABLE ORDERS:
=================
{len(available_orders)} orders available for assignment
Sample orders: {json.dumps(available_orders[:3], indent=2)}

LOAD NUMBERING:
==============
Start from: CT-{next_ct_num:03d}
Continue sequentially: CT-{next_ct_num:03d}, CT-{next_ct_num+1:03d}, CT-{next_ct_num+2:03d}, etc.

TASK:
=====
Generate a simulation plan that creates 8 loads total (3 delivered + 3 on-time + 2 at-risk).
Each load should have 5 orders assigned to it.

Return ONLY a valid JSON object with this structure:
{{
  "loads": [
    {{
      "load_number": "CT-XXX",
      "scenario": "delivered|on-time|at-risk",
      "truck_type": "53ft Dry Van",
      "status": "Delivered|In Transit",
      "estimated_delivery_date": "{today_date}|{tomorrow}",
      "origin": "City, State",
      "order_indices": [0, 1, 2, 3, 4],
      "orders_config": {{
        "customer_expected_delivery_date": "{today_date}",
        "delivery_window_start": "{today_date}T08:00:00",
        "delivery_window_end": "{today_date}T18:00:00",
        "status": "Delivered|In Transit"
      }}
    }}
  ],
  "summary": {{
    "total_loads": 8,
    "delivered": 3,
    "on_time": 3,
    "at_risk": 2,
    "total_orders_used": 40
  }}
}}

CRITICAL RULES:
- Use order indices from 0 to {len(available_orders)-1}
- Each order can only be used once
- Delivered loads: estimated_delivery_date = {today_date}, orders.status = "Delivered"
- On-time loads: estimated_delivery_date = {today_date}, orders.status = "In Transit"
- At-risk loads: estimated_delivery_date = {tomorrow}, orders.status = "In Transit", customer_expected_delivery_date = {today_date}
- All orders in all loads: customer_expected_delivery_date = {today_date}
- Vary truck types realistically (mostly 53ft Dry Van and 48ft Dry Van)
- Set utilization_percent between 75-95%

Generate the simulation plan now:"""

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            plan = json.loads(response_text)
            
            print(f"[CONTROL TOWER SIMULATOR] ✓ AI generated plan for {plan['summary']['total_loads']} loads")
            print(f"[CONTROL TOWER SIMULATOR]   - {plan['summary']['delivered']} delivered")
            print(f"[CONTROL TOWER SIMULATOR]   - {plan['summary']['on_time']} on-time")
            print(f"[CONTROL TOWER SIMULATOR]   - {plan['summary']['at_risk']} at-risk")
            
            return plan
            
        except Exception as e:
            print(f"[CONTROL TOWER SIMULATOR] ✗ AI generation failed: {e}")
            print(f"[CONTROL TOWER SIMULATOR] Using fallback plan generation")
            return self._create_fallback_plan(available_orders, next_ct_num, today_date, tomorrow)
    
    def _create_fallback_plan(self, available_orders, next_ct_num, today_date, tomorrow_date):
        """
        Create a basic simulation plan without AI
        """
        import random
        
        plan = {
            "loads": [],
            "summary": {
                "total_loads": 8,
                "delivered": 3,
                "on_time": 3,
                "at_risk": 2,
                "total_orders_used": 40
            }
        }
        
        order_idx = 0
        load_num = next_ct_num
        
        # Delivered loads (3)
        for i in range(3):
            plan["loads"].append({
                "load_number": f"CT-{load_num:03d}",
                "scenario": "delivered",
                "truck_type": random.choice(["53ft Dry Van", "48ft Dry Van", "Refrigerated"]),
                "status": "Delivered",
                "estimated_delivery_date": today_date,
                "origin": available_orders[order_idx].get('origin', 'Unknown'),
                "order_indices": list(range(order_idx, order_idx + 5)),
                "orders_config": {
                    "customer_expected_delivery_date": today_date,
                    "delivery_window_start": f"{today_date}T08:00:00",
                    "delivery_window_end": f"{today_date}T18:00:00",
                    "status": "Delivered"
                }
            })
            order_idx += 5
            load_num += 1
        
        # On-time loads (3)
        for i in range(3):
            plan["loads"].append({
                "load_number": f"CT-{load_num:03d}",
                "scenario": "on-time",
                "truck_type": random.choice(["53ft Dry Van", "48ft Dry Van"]),
                "status": "In Transit",
                "estimated_delivery_date": today_date,
                "origin": available_orders[order_idx].get('origin', 'Unknown'),
                "order_indices": list(range(order_idx, order_idx + 5)),
                "orders_config": {
                    "customer_expected_delivery_date": today_date,
                    "delivery_window_start": f"{today_date}T08:00:00",
                    "delivery_window_end": f"{today_date}T18:00:00",
                    "status": "In Transit"
                }
            })
            order_idx += 5
            load_num += 1
        
        # At-risk loads (2)
        for i in range(2):
            plan["loads"].append({
                "load_number": f"CT-{load_num:03d}",
                "scenario": "at-risk",
                "truck_type": random.choice(["53ft Dry Van", "48ft Dry Van"]),
                "status": "In Transit",
                "estimated_delivery_date": str(tomorrow_date),
                "origin": available_orders[order_idx].get('origin', 'Unknown'),
                "order_indices": list(range(order_idx, order_idx + 5)),
                "orders_config": {
                    "customer_expected_delivery_date": today_date,
                    "delivery_window_start": f"{today_date}T08:00:00",
                    "delivery_window_end": f"{today_date}T18:00:00",
                    "status": "In Transit"
                }
            })
            order_idx += 5
            load_num += 1
        
        return plan

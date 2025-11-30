"""
Load Optimizer Agent
Consolidates orders into optimal truck loads
"""
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.base_agent import BaseAgent
from config.settings import (
    MAX_TRUCK_WEIGHT_LBS, 
    MAX_TRUCK_VOLUME_CUFT,
    TRUCK_TYPES,
    TARGET_TRUCK_UTILIZATION
)

class LoadOptimizerAgent(BaseAgent):
    """
    AI Agent that optimizes order consolidation into truck loads
    """
    
    def __init__(self):
        super().__init__(agent_type="LoadOptimizer")
    
    def optimize_loads(self, orders):
        """
        Optimize orders into efficient truck loads
        
        Args:
            orders: List of order dictionaries with weight, volume, origin, destination
            
        Returns:
            Optimized load plan with truck assignments
        """
        
        # If too many orders, use fallback instead of AI
        if len(orders) > 500:
            print(f"[LOAD OPTIMIZER] {len(orders)} orders detected - using fallback algorithm instead of AI")
            return self._create_basic_load_plan(orders)
        
        print(f"[LOAD OPTIMIZER] Optimizing {len(orders)} orders with AI")
        
        # Build context for AI
        orders_summary = self._format_orders_for_ai(orders)
        
        prompt = f"""You are a logistics expert specializing in load optimization for trucking.

TRUCK CONSTRAINTS:
- Max Weight: {MAX_TRUCK_WEIGHT_LBS} lbs
- Max Volume: {MAX_TRUCK_VOLUME_CUFT} cubic feet
- Available Truck Types: {', '.join(TRUCK_TYPES)}
- Target Utilization: {TARGET_TRUCK_UTILIZATION * 100}%

ORDERS TO OPTIMIZE:
{orders_summary}

TASK:
Create an optimal load plan that:
1. Groups orders from the SAME ORIGIN into multi-stop loads
2. Creates efficient delivery routes with multiple destination stops per truck
3. Sequences stops logically (e.g., geographic proximity, delivery windows)
4. Respects weight and volume constraints for each stop
5. Maximizes truck utilization (aim for {TARGET_TRUCK_UTILIZATION * 100}%+ capacity)
6. Considers delivery priorities (high priority stops earlier in sequence)

IMPORTANT RULES:
- Each load MUST have only ONE origin (pickup point)
- Orders can only be combined if they share the same origin
- Each order becomes a stop on the route
- Sequence stops geographically (west to east, or nearest neighbor)
- Running totals must not exceed truck capacity at any stop

Return your response as a JSON object with this structure:
{{
    "loads": [
        {{
            "load_id": "LOAD_001",
            "truck_type": "DRY_VAN",
            "origin": "Toronto, ON",
            "orders": [
                {{
                    "id": "order_id1",
                    "order_number": "ORD-00001",
                    "origin": "Toronto, ON",
                    "destination": "Chicago, IL",
                    "weight_lbs": 15000,
                    "volume_cuft": 1200,
                    "stop_sequence": 1,
                    "priority": "Normal"
                }},
                {{
                    "id": "order_id2",
                    "order_number": "ORD-00002",
                    "origin": "Toronto, ON",
                    "destination": "Detroit, MI",
                    "weight_lbs": 12000,
                    "volume_cuft": 1000,
                    "stop_sequence": 2,
                    "priority": "Normal"
                }}
            ],
            "total_weight_lbs": 27000,
            "total_volume_cuft": 2200,
            "utilization_percent": 85,
            "reasoning": "Combined 2 orders from Toronto with nearby destinations (Detroit -> Chicago route). Sequenced geographically for efficient delivery."
        }}
    ],
    "summary": {{
        "total_orders": 10,
        "total_loads": 3,
        "avg_utilization": 82,
        "cost_savings_percent": 35
    }}
}}

IMPORTANT: Include the full order object with stop_sequence field in the "orders" array. The stop_sequence indicates delivery order (1 = first stop, 2 = second stop, etc.).
"""
        
        # Call Gemini AI
        response = self.call_gemini(prompt, temperature=0.3)
        
        if response:
            try:
                # Extract JSON from response
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                json_str = response[json_start:json_end]
                load_plan = json.loads(json_str)
                return load_plan
            except Exception as e:
                print(f"Error parsing AI response: {str(e)}")
                return self._create_basic_load_plan(orders)
        else:
            return self._create_basic_load_plan(orders)
    
    def _format_orders_for_ai(self, orders):
        """Format orders into readable text for AI"""
        summary = []
        for order in orders:
            summary.append(
                f"Order {order.get('id', 'N/A')}: "
                f"{order.get('weight_lbs', 0)} lbs, "
                f"{order.get('volume_cuft', 0)} cu.ft, "
                f"From {order.get('origin', 'Unknown')} to {order.get('destination', 'Unknown')}, "
                f"Priority: {order.get('priority', 'Normal')}"
            )
        return "\n".join(summary)
    
    def _create_basic_load_plan(self, orders):
        """Fallback: Create basic multi-stop load plan without AI"""
        # Group orders by origin
        orders_by_origin = {}
        for order in orders:
            origin = order.get('origin', 'Unknown')
            if origin not in orders_by_origin:
                orders_by_origin[origin] = []
            orders_by_origin[origin].append(order)
        
        loads = []
        load_counter = 1
        
        # Create multi-stop loads for each origin
        for origin, origin_orders in orders_by_origin.items():
            current_load = {
                "load_id": f"LOAD_{str(load_counter).zfill(3)}",
                "truck_type": "DRY_VAN",
                "origin": origin,
                "orders": [],
                "total_weight_lbs": 0,
                "total_volume_cuft": 0
            }
            
            # Sort orders by destination (simple alphabetical for basic version)
            # In real optimization, this would use geographic coordinates
            sorted_orders = sorted(origin_orders, key=lambda x: x.get('destination', ''))
            
            stop_sequence = 1
            
            for order in sorted_orders:
                weight = order.get('weight_lbs', 0)
                volume = order.get('volume_cuft', 0)
                
                # Check if order fits in current load
                if (current_load['total_weight_lbs'] + weight <= MAX_TRUCK_WEIGHT_LBS and
                    current_load['total_volume_cuft'] + volume <= MAX_TRUCK_VOLUME_CUFT):
                    # Add to current load with stop sequence
                    current_load['orders'].append({
                        'id': order.get('id'),
                        'order_number': order.get('order_number'),
                        'customer': order.get('customer'),
                        'origin': order.get('origin'),
                        'destination': order.get('destination'),
                        'weight_lbs': weight,
                        'volume_cuft': volume,
                        'priority': order.get('priority', 'Normal'),
                        'stop_sequence': stop_sequence
                    })
                    current_load['total_weight_lbs'] += weight
                    current_load['total_volume_cuft'] += volume
                    stop_sequence += 1
                else:
                    # Close current load and start new one
                    if current_load['orders']:
                        loads.append(current_load)
                        load_counter += 1
                    
                    # Start new load with this order
                    current_load = {
                        "load_id": f"LOAD_{str(load_counter).zfill(3)}",
                        "truck_type": "DRY_VAN",
                        "origin": origin,
                        "orders": [{
                            'id': order.get('id'),
                            'order_number': order.get('order_number'),
                            'customer': order.get('customer'),
                            'origin': order.get('origin'),
                            'destination': order.get('destination'),
                            'weight_lbs': weight,
                            'volume_cuft': volume,
                            'priority': order.get('priority', 'Normal'),
                            'stop_sequence': 1
                        }],
                        "total_weight_lbs": weight,
                        "total_volume_cuft": volume
                    }
                    stop_sequence = 2
            
            # Add last load for this origin
            if current_load['orders']:
                loads.append(current_load)
                load_counter += 1
        
        # Calculate utilization for each load
        total_utilization = 0
        for load in loads:
            weight_util = (load['total_weight_lbs'] / MAX_TRUCK_WEIGHT_LBS) * 100
            volume_util = (load['total_volume_cuft'] / MAX_TRUCK_VOLUME_CUFT) * 100
            load['utilization_percent'] = round(min(weight_util, volume_util))
            total_utilization += load['utilization_percent']
            
            # Add reasoning
            num_stops = len(load['orders'])
            destinations = [o['destination'] for o in load['orders']]
            load['reasoning'] = f"Multi-stop load from {load['origin']} with {num_stops} delivery stops: {', '.join(destinations[:3])}{'...' if num_stops > 3 else ''}"
        
        avg_util = round(total_utilization / len(loads)) if loads else 0
        
        # Calculate estimated cost savings from consolidation
        # More stops per load = higher savings
        avg_stops_per_load = sum(len(load['orders']) for load in loads) / len(loads) if loads else 1
        cost_savings = round(min(50, (avg_stops_per_load - 1) * 15))  # Up to 50% savings
        
        return {
            "loads": loads,
            "summary": {
                "total_orders": len(orders),
                "total_loads": len(loads),
                "avg_utilization": avg_util,
                "cost_savings_percent": cost_savings
            }
        }

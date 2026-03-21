"""
LangChain Tools for TMS Query Agent
Provides tools for the agent to query database, analyze metrics, and optimize operations
"""

from database.supabase_client import SupabaseClient
import json
from datetime import datetime, timedelta


def search_orders_tool(query: str) -> str:
    """
    Search shipment orders by customer, destination, status, or date range.
    
    Args:
        query: Natural language query (e.g., "delayed shipments", "orders to California", "Amazon orders")
    
    Returns:
        JSON string with matching orders
    """
    try:
        client = SupabaseClient()
        orders = client.get_all_orders()
        
        if not orders:
            return json.dumps({"message": "No orders found in database"})
        
        query_lower = query.lower()
        filtered_orders = []
        
        # Filter based on query content
        for order in orders:
            order_str = json.dumps(order).lower()
            
            # Check for matches
            if any(term in order_str for term in query_lower.split()):
                filtered_orders.append(order)
            # Status filtering
            elif 'delayed' in query_lower and order.get('status') == 'In Transit':
                # Check if delivery is overdue
                delivery_date = order.get('delivery_date')
                if delivery_date:
                    try:
                        delivery = datetime.fromisoformat(delivery_date.replace('Z', '+00:00'))
                        if delivery < datetime.now():
                            filtered_orders.append(order)
                    except:
                        pass
            elif 'pending' in query_lower and order.get('status') == 'Pending':
                filtered_orders.append(order)
            elif 'delivered' in query_lower and order.get('status') == 'Delivered':
                filtered_orders.append(order)
        
        if not filtered_orders:
            filtered_orders = orders[:10]  # Return first 10 if no specific matches
        
        # Limit results
        result = filtered_orders[:20]
        
        summary = {
            "total_found": len(filtered_orders),
            "returning": len(result),
            "orders": result
        }
        
        return json.dumps(summary, default=str, indent=2)
        
    except Exception as e:
        return json.dumps({"error": str(e)})


def get_facility_info_tool(facility_name: str) -> str:
    """
    Get detailed information about a facility or warehouse.
    
    Args:
        facility_name: Name of the facility or city (e.g., "Chicago DC", "Dallas")
    
    Returns:
        JSON string with facility details
    """
    try:
        client = SupabaseClient()
        facilities = client.get_all_facilities()
        
        if not facilities:
            return json.dumps({"message": "No facilities found in database"})
        
        query_lower = facility_name.lower()
        matching_facilities = []
        
        for facility in facilities:
            facility_str = json.dumps(facility).lower()
            if query_lower in facility_str:
                matching_facilities.append(facility)
        
        if not matching_facilities:
            return json.dumps({"message": f"No facility found matching '{facility_name}'"})
        
        return json.dumps(matching_facilities, default=str, indent=2)
        
    except Exception as e:
        return json.dumps({"error": str(e)})


def calculate_metrics_tool(metric_type: str) -> str:
    """
    Calculate performance metrics and KPIs for the TMS.
    
    Args:
        metric_type: Type of metric (e.g., "on-time delivery", "avg weight", "top customers", "revenue")
    
    Returns:
        JSON string with calculated metrics
    """
    try:
        client = SupabaseClient()
        orders = client.get_all_orders()
        
        if not orders:
            return json.dumps({"message": "No orders available for metrics calculation"})
        
        metric_lower = metric_type.lower()
        results = {}
        
        # On-time delivery rate
        if 'on-time' in metric_lower or 'otd' in metric_lower:
            total = len(orders)
            on_time = 0
            for order in orders:
                if order.get('status') == 'Delivered':
                    delivery_date = order.get('delivery_date')
                    created_date = order.get('created_at')
                    if delivery_date and created_date:
                        try:
                            delivery = datetime.fromisoformat(delivery_date.replace('Z', '+00:00'))
                            created = datetime.fromisoformat(created_date.replace('Z', '+00:00'))
                            if (delivery - created).days <= 5:  # Simple rule: delivered within 5 days
                                on_time += 1
                        except:
                            pass
            
            results['on_time_delivery_rate'] = f"{(on_time/total*100):.1f}%" if total > 0 else "N/A"
            results['on_time_count'] = on_time
            results['total_delivered'] = total
        
        # Average weight
        if 'weight' in metric_lower or 'avg' in metric_lower:
            weights = [float(o.get('weight_lbs', 0)) for o in orders if o.get('weight_lbs')]
            if weights:
                results['avg_weight_lbs'] = round(sum(weights) / len(weights), 2)
                results['total_weight_lbs'] = round(sum(weights), 2)
                results['max_weight_lbs'] = round(max(weights), 2)
                results['min_weight_lbs'] = round(min(weights), 2)
        
        # Top customers
        if 'customer' in metric_lower or 'top' in metric_lower:
            customer_counts = {}
            for order in orders:
                customer = order.get('customer', 'Unknown')
                customer_counts[customer] = customer_counts.get(customer, 0) + 1
            
            top_customers = sorted(customer_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            results['top_customers'] = [{"customer": c[0], "order_count": c[1]} for c in top_customers]
        
        # Revenue/cost analysis
        if 'revenue' in metric_lower or 'cost' in metric_lower or 'rate' in metric_lower:
            rates = [float(o.get('rate_per_mile', 0)) for o in orders if o.get('rate_per_mile')]
            if rates:
                results['avg_rate_per_mile'] = f"${round(sum(rates) / len(rates), 2)}"
                results['total_revenue'] = f"${round(sum(rates), 2)}"
        
        # Order status distribution
        if 'status' in metric_lower or 'distribution' in metric_lower:
            status_counts = {}
            for order in orders:
                status = order.get('status', 'Unknown')
                status_counts[status] = status_counts.get(status, 0) + 1
            results['status_distribution'] = status_counts
        
        # Default: return summary stats
        if not results:
            results = {
                "total_orders": len(orders),
                "total_weight_lbs": round(sum([float(o.get('weight_lbs', 0)) for o in orders]), 2),
                "unique_customers": len(set([o.get('customer') for o in orders if o.get('customer')])),
                "unique_destinations": len(set([o.get('destination') for o in orders if o.get('destination')]))
            }
        
        return json.dumps(results, indent=2)
        
    except Exception as e:
        return json.dumps({"error": str(e)})


def check_capacity_tool(location: str) -> str:
    """
    Check facility capacity and current utilization.
    
    Args:
        location: Facility name or city to check capacity
    
    Returns:
        JSON string with capacity information
    """
    try:
        client = SupabaseClient()
        facilities = client.get_all_facilities()
        orders = client.get_all_orders()
        
        location_lower = location.lower()
        matching_facility = None
        
        for facility in facilities:
            if location_lower in json.dumps(facility).lower():
                matching_facility = facility
                break
        
        if not matching_facility:
            return json.dumps({"message": f"No facility found for '{location}'"})
        
        # Calculate current utilization (orders destined for this facility)
        facility_city = matching_facility.get('city', '').lower()
        incoming_orders = [
            o for o in orders 
            if facility_city in o.get('destination', '').lower() 
            and o.get('status') in ['Pending', 'In Transit']
        ]
        
        incoming_weight = sum([float(o.get('weight_lbs', 0)) for o in incoming_orders])
        
        result = {
            "facility": matching_facility.get('name'),
            "city": matching_facility.get('city'),
            "state": matching_facility.get('state'),
            "incoming_orders": len(incoming_orders),
            "incoming_weight_lbs": round(incoming_weight, 2),
            "status": "Available" if len(incoming_orders) < 50 else "High Volume"
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({"error": str(e)})


def optimize_route_tool(origin: str, destination: str) -> str:
    """
    Suggest optimized routing options between two locations.
    
    Args:
        origin: Starting location
        destination: Ending location
    
    Returns:
        JSON string with route recommendations
    """
    try:
        client = SupabaseClient()
        facilities = client.get_all_facilities()
        
        # Find coordinates for origin and destination
        origin_facility = None
        dest_facility = None
        
        for facility in facilities:
            facility_str = json.dumps(facility).lower()
            if origin.lower() in facility_str and not origin_facility:
                origin_facility = facility
            if destination.lower() in facility_str and not dest_facility:
                dest_facility = facility
        
        if not origin_facility or not dest_facility:
            return json.dumps({"message": "Could not find both origin and destination facilities"})
        
        # Simple distance calculation
        from math import radians, sin, cos, sqrt, atan2
        
        lat1, lon1 = origin_facility.get('latitude'), origin_facility.get('longitude')
        lat2, lon2 = dest_facility.get('latitude'), dest_facility.get('longitude')
        
        R = 3959  # Earth radius in miles
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = R * c
        
        # Estimate cost and time
        cost_per_mile = 2.50  # Example rate
        estimated_cost = distance * cost_per_mile
        estimated_days = max(1, int(distance / 500))  # Assume 500 miles/day
        
        result = {
            "origin": origin_facility.get('name'),
            "destination": dest_facility.get('name'),
            "distance_miles": round(distance, 1),
            "estimated_cost": f"${round(estimated_cost, 2)}",
            "estimated_transit_days": estimated_days,
            "recommended_mode": "LTL" if distance < 500 else "FTL"
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        return json.dumps({"error": str(e)})

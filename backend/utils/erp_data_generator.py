"""
Synthetic Data Generator for ERP Orders
Canada (GTA) -> USA Supply Chain Network
"""
import random
from datetime import datetime, timedelta
import uuid
import json
import time

class ERPDataGenerator:
    """
    Generates realistic synthetic order data for testing TMS
    Toronto-area manufacturing facilities shipping to US retailers and food service
    """
    
    # Three manufacturing facilities in Greater Toronto Area (origins)
    ORIGINS = [
        {"name": "Toronto, ON", "facility": "Toronto DC", "facility_code": "TOR-DC", "lat": 43.6532, "lng": -79.3832},
        {"name": "Mississauga, ON", "facility": "Mississauga Plant", "facility_code": "MIS-PLANT", "lat": 43.5890, "lng": -79.6441},
        {"name": "Brampton, ON", "facility": "Brampton Warehouse", "facility_code": "BRA-WH", "lat": 43.7315, "lng": -79.7624}
    ]
    
    # US customer locations - Major retail/food service hubs across continental USA
    DESTINATIONS = [
        # Northeast
        {"name": "New York, NY", "region": "Northeast", "weight": 15, "lat": 40.7128, "lng": -74.0060},
        {"name": "Boston, MA", "region": "Northeast", "weight": 8, "lat": 42.3601, "lng": -71.0589},
        {"name": "Philadelphia, PA", "region": "Northeast", "weight": 10, "lat": 39.9526, "lng": -75.1652},
        {"name": "Buffalo, NY", "region": "Northeast", "weight": 5, "lat": 42.8864, "lng": -78.8784},
        {"name": "Pittsburgh, PA", "region": "Northeast", "weight": 6, "lat": 40.4406, "lng": -79.9959},
        
        # Midwest
        {"name": "Chicago, IL", "region": "Midwest", "weight": 12, "lat": 41.8781, "lng": -87.6298},
        {"name": "Detroit, MI", "region": "Midwest", "weight": 9, "lat": 42.3314, "lng": -83.0458},
        {"name": "Cleveland, OH", "region": "Midwest", "weight": 7, "lat": 41.4993, "lng": -81.6944},
        {"name": "Indianapolis, IN", "region": "Midwest", "weight": 6, "lat": 39.7684, "lng": -86.1581},
        {"name": "Milwaukee, WI", "region": "Midwest", "weight": 5, "lat": 43.0389, "lng": -87.9065},
        {"name": "Columbus, OH", "region": "Midwest", "weight": 7, "lat": 39.9612, "lng": -82.9988},
        {"name": "Minneapolis, MN", "region": "Midwest", "weight": 6, "lat": 44.9778, "lng": -93.2650},
        
        # Southeast
        {"name": "Atlanta, GA", "region": "Southeast", "weight": 11, "lat": 33.7490, "lng": -84.3880},
        {"name": "Charlotte, NC", "region": "Southeast", "weight": 7, "lat": 35.2271, "lng": -80.8431},
        {"name": "Nashville, TN", "region": "Southeast", "weight": 6, "lat": 36.1627, "lng": -86.7816},
        {"name": "Jacksonville, FL", "region": "Southeast", "weight": 6, "lat": 30.3322, "lng": -81.6557},
        {"name": "Miami, FL", "region": "Southeast", "weight": 8, "lat": 25.7617, "lng": -80.1918},
        {"name": "Orlando, FL", "region": "Southeast", "weight": 7, "lat": 28.5383, "lng": -81.3792},
        
        # Southwest
        {"name": "Dallas, TX", "region": "Southwest", "weight": 10, "lat": 32.7767, "lng": -96.7970},
        {"name": "Houston, TX", "region": "Southwest", "weight": 9, "lat": 29.7604, "lng": -95.3698},
        {"name": "Phoenix, AZ", "region": "Southwest", "weight": 8, "lat": 33.4484, "lng": -112.0740},
        {"name": "San Antonio, TX", "region": "Southwest", "weight": 6, "lat": 29.4241, "lng": -98.4936},
        {"name": "Denver, CO", "region": "Southwest", "weight": 7, "lat": 39.7392, "lng": -104.9903},
        
        # West
        {"name": "Los Angeles, CA", "region": "West", "weight": 13, "lat": 34.0522, "lng": -118.2437},
        {"name": "San Francisco, CA", "region": "West", "weight": 9, "lat": 37.7749, "lng": -122.4194},
        {"name": "Seattle, WA", "region": "West", "weight": 8, "lat": 47.6062, "lng": -122.3321},
        {"name": "Portland, OR", "region": "West", "weight": 6, "lat": 45.5152, "lng": -122.6784},
        {"name": "San Diego, CA", "region": "West", "weight": 7, "lat": 32.7157, "lng": -117.1611},
        {"name": "Las Vegas, NV", "region": "West", "weight": 5, "lat": 36.1699, "lng": -115.1398}
    ]
    
    # American retailers and food service companies
    CUSTOMERS = [
        "Walmart Distribution",
        "Target Regional DC",
        "Costco Wholesale",
        "Kroger Supply Chain",
        "Sysco Food Services",
        "US Foods Distribution",
        "Gordon Food Service",
        "Restaurant Depot",
        "Performance Foodservice",
        "Safeway Distribution",
        "Publix Super Markets",
        "Whole Foods Market",
        "Trader Joe's DC",
        "Amazon Fresh Fulfillment",
        "Sam's Club Distribution"
    ]
    
    PRIORITIES = ["High", "Normal", "Low"]
    
    SPECIAL_REQUIREMENTS = [
        None,
        "Temperature controlled",
        "Appointment required",
        "Liftgate required",
        "Inside delivery"
    ]
    
    def generate_orders(self, count=10):
        """
        Generate synthetic orders from Toronto facilities to US customers
        
        Args:
            count: Number of orders to generate
            
        Returns:
            List of order dictionaries
        """
        orders = []
        
        for i in range(count):
            order = self._generate_single_order(i + 1)
            orders.append(order)
        
        return orders
    
    def generate_monthly_orders(self):
        """
        Generate one month worth of orders (~4,000 orders = 1,000/week * 4 weeks)
        Distribution reflects consistent weekly demand patterns
        
        Returns:
            List of ~4,000 order dictionaries
        """
        total_orders = 4000
        orders = []
        
        # Generate orders spread over 4 weeks
        for week in range(4):
            week_orders = total_orders // 4  # 1,000 orders per week
            
            for i in range(week_orders):
                order_num = week * week_orders + i + 1
                # Orders created during week, with delivery windows in that week and next
                days_offset = week * 7 + random.randint(0, 6)  # Spread across the week
                order = self._generate_single_order(order_num, days_offset)
                orders.append(order)
        
        return orders
    
    def _generate_single_order(self, order_num, days_from_now=None):
        """
        Generate a single realistic order from GTA to US customer
        
        Args:
            order_num: Sequential order number
            days_from_now: Days from now for order creation (for historical data)
        """
        
        # Select random origin (one of three GTA facilities)
        origin = random.choice(self.ORIGINS)
        
        # Select destination based on weighted distribution (high-volume markets get more orders)
        destination = random.choices(
            self.DESTINATIONS,
            weights=[d["weight"] for d in self.DESTINATIONS],
            k=1
        )[0]
        
        # Uniform product profile: consistent weight/volume for palletized goods
        # Typical FTL: 20-40 pallets, 500-1,000 lbs per pallet
        num_pallets = random.randint(1, 26)  # 1-26 pallets (allowing LTL to FTL)
        weight_per_pallet = random.randint(500, 1200)  # lbs
        base_weight = num_pallets * weight_per_pallet
        
        # Uniform density: ~12 lbs per cubic foot (standard for packaged goods)
        density = 12.0
        volume = round(base_weight / density, 2)
        
        # Generate delivery window
        if days_from_now is None:
            days_ahead = random.randint(2, 10)  # 2-10 days lead time
        else:
            days_ahead = days_from_now + random.randint(2, 5)
        
        order_date = datetime.now() - timedelta(days=(30 - (days_from_now or 0)))
        delivery_start = order_date + timedelta(days=days_ahead)
        delivery_end = delivery_start + timedelta(hours=random.randint(4, 12))
        
        # Calculate must_arrive_by_date (hard deadline - slightly before delivery_window_end)
        must_arrive_by = delivery_end - timedelta(hours=random.randint(2, 6))
        
        # Create unique order number using UUID to avoid collisions
        unique_id = str(uuid.uuid4())[:8].upper()
        order_number = f"ORD-{unique_id}"
        
        order = {
            "order_number": order_number,
            "customer": random.choice(self.CUSTOMERS),
            "origin": f"{origin['name']} - {origin['facility']}",
            "destination": destination["name"],
            "weight_lbs": base_weight,
            "volume_cuft": volume,
            "priority": random.choices(
                self.PRIORITIES,
                weights=[0.1, 0.8, 0.1],  # 10% high, 80% normal, 10% low
                k=1
            )[0],
            "status": "Pending",
            "delivery_window_start": delivery_start.isoformat(),
            "delivery_window_end": delivery_end.isoformat(),
            "special_requirements": random.choice(self.SPECIAL_REQUIREMENTS),
            "created_at": order_date.isoformat(),
            # New date fields for order lifecycle management
            "order_received_date": order_date.isoformat(),
            "must_arrive_by_date": must_arrive_by.isoformat(),
            "planned_to_load_date": None,  # Will be set when assigned to a load
            "assigned_load_number": None,   # Will be set when assigned to a load
            # Facility code for ID lookup (will be converted to origin_facility_id)
            "origin_facility_code": origin.get('facility_code')
        }
        
        return order
    
    @classmethod
    def get_origin_coordinates(cls, origin_string):
        """Get lat/lng for an origin facility"""
        for origin in cls.ORIGINS:
            if origin['name'] in origin_string:
                return {"lat": origin["lat"], "lng": origin["lng"]}
        return None
    
    @classmethod
    def get_destination_coordinates(cls, destination_name):
        """Get lat/lng for a destination city"""
        for dest in cls.DESTINATIONS:
            if dest['name'] == destination_name:
                return {"lat": dest["lat"], "lng": dest["lng"]}
        return None

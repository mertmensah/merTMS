"""
TMS Configuration Settings
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Gemini AI Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-gemini-api-key")
GEMINI_MODEL = "gemini-2.5-flash"  # Gemini 2.5 Flash (free tier)

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "your-supabase-url")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-key")

# TMS Business Rules - Truck Constraints
MAX_TRUCK_WEIGHT_LBS = 45000  # Maximum weight per truck
MAX_TRUCK_VOLUME_CUFT = 4000  # Maximum volume per truck
TRUCK_TYPES = ["DRY_VAN", "REEFER", "FLATBED"]

# TMS Business Rules - Cost Parameters
BASE_RATE_PER_MILE = 2.50  # Base freight rate per mile
FUEL_SURCHARGE_PERCENT = 0.15  # 15% fuel surcharge
DETENTION_RATE_PER_HOUR = 75.00  # Cost per hour for truck detention
AVERAGE_MPG = 6.5  # Average fuel economy for trucks

# TMS Business Rules - Route Parameters
MAX_DRIVING_HOURS_PER_DAY = 11  # Hours of Service (HOS) limit
AVERAGE_SPEED_MPH = 55  # Average highway speed

# TMS Business Rules - Optimization Targets
TARGET_TRUCK_UTILIZATION = 0.85  # Target 85% capacity utilization
MIN_TRUCK_UTILIZATION = 0.60  # Minimum acceptable utilization

# Flask Configuration
DEBUG = os.getenv("DEBUG", "False") == "True"
PORT = int(os.getenv("PORT", 5000))

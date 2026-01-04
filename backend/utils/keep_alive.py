"""
Supabase Keep-Alive Utility

Supabase Free Tier Requirements:
- Projects pause after 7 days of inactivity
- Inactivity = No database connections, API requests, or Auth requests
- Paused projects are deleted after another 7 days

This utility ensures the database stays active by:
1. Running a lightweight query on app startup (when Render wakes up)
2. Providing an endpoint that can be pinged externally via cron jobs
3. Logging activity for monitoring

Strategy:
- Since Render free tier wakes on any HTTP request, we piggyback on that
- Each time the backend wakes, we ping Supabase to reset its 7-day timer
- External services (UptimeRobot, cron-job.org) can ping every 3-7 days as backup
"""

import time
from datetime import datetime
from database.supabase_client import SupabaseClient

class SupabaseKeepAlive:
    """
    Manages Supabase free tier activity requirements
    """
    
    def __init__(self):
        self.last_ping_time = None
        self.ping_count = 0
    
    def ping_database(self):
        """
        Execute a minimal database query to register activity.
        This prevents the 7-day inactivity timeout.
        
        Query Strategy:
        - SELECT single row from facilities table (lightweight)
        - No writes, no complex joins, no computation
        - Just enough to register as "active database connection"
        
        Returns:
            dict: Status of the ping operation
        """
        try:
            start_time = time.time()
            
            # Create client connection
            client = SupabaseClient()
            
            # Execute minimal query (just to register activity)
            response = client.client.table('facilities').select('id').limit(1).execute()
            
            # Calculate response time
            elapsed_ms = (time.time() - start_time) * 1000
            
            # Update tracking
            self.last_ping_time = datetime.now()
            self.ping_count += 1
            
            status = {
                'success': True,
                'timestamp': self.last_ping_time.isoformat(),
                'response_time_ms': round(elapsed_ms, 2),
                'ping_count': self.ping_count,
                'message': 'Supabase database pinged successfully',
                'rows_returned': len(response.data) if response.data else 0
            }
            
            print(f"[KEEP-ALIVE] Supabase ping #{self.ping_count} successful ({elapsed_ms:.0f}ms)")
            
            return status
            
        except Exception as e:
            error_status = {
                'success': False,
                'timestamp': datetime.now().isoformat(),
                'error': str(e),
                'ping_count': self.ping_count,
                'message': 'Failed to ping Supabase database'
            }
            
            print(f"[KEEP-ALIVE] Supabase ping failed: {str(e)}")
            
            return error_status
    
    def get_status(self):
        """
        Get current keep-alive status
        
        Returns:
            dict: Current status information
        """
        return {
            'last_ping': self.last_ping_time.isoformat() if self.last_ping_time else None,
            'total_pings': self.ping_count,
            'supabase_free_tier_info': {
                'inactivity_timeout_days': 7,
                'deletion_after_pause_days': 7,
                'required_activity': 'At least 1 database connection per 7 days',
                'current_strategy': 'Ping on Render backend startup + optional external cron'
            }
        }
    
    def should_ping(self, min_interval_seconds=3600):
        """
        Check if enough time has passed to warrant another ping
        (Prevents excessive pinging on rapid restarts)
        
        Args:
            min_interval_seconds (int): Minimum seconds between pings (default 1 hour)
        
        Returns:
            bool: True if ping is needed
        """
        if self.last_ping_time is None:
            return True
        
        elapsed = (datetime.now() - self.last_ping_time).total_seconds()
        return elapsed >= min_interval_seconds


# Global keep-alive instance
keep_alive = SupabaseKeepAlive()


def initialize_keep_alive():
    """
    Initialize the keep-alive mechanism.
    Call this on Flask app startup.
    """
    print("[KEEP-ALIVE] Initializing Supabase keep-alive...")
    
    # Ping immediately on startup
    result = keep_alive.ping_database()
    
    if result['success']:
        print(f"[KEEP-ALIVE] ✓ Initial ping successful")
        print(f"[KEEP-ALIVE] Database will remain active for 7 days from now")
    else:
        print(f"[KEEP-ALIVE] ✗ Initial ping failed: {result.get('error')}")
    
    return result

"""
merTM.S Platform AI Assistant
An agentic AI assistant with security validation and business appropriateness checks
"""

import re
from typing import Dict, List, Tuple
from agents.base_agent import BaseAgent


class PlatformAssistant(BaseAgent):
    """
    AI Assistant for guiding users through the merTM.S platform
    Includes security checks for social engineering and inappropriate content
    """
    
    # Security patterns - things we should block
    SECURITY_PATTERNS = [
        # Direct system manipulation attempts
        (r'(ignore|disregard|forget)\s+(previous|above|prior|all)\s+(instructions|prompts|rules)', 
         'Attempted prompt injection detected'),
        
        # Social engineering attempts
        (r'(you are|act as|pretend|role.?play).+(admin|root|developer|engineer|system)', 
         'Social engineering attempt detected'),
        
        # Data exfiltration attempts
        (r'(show|display|print|reveal|expose).+(password|api.?key|secret|token|credential)', 
         'Unauthorized data access attempt detected'),
        
        # SQL injection patterns
        (r"(';|--;|/\*|\*/|xp_|sp_|exec|execute|drop\s+table|union\s+select)", 
         'SQL injection pattern detected'),
        
        # Code execution attempts
        (r'(eval|exec|system|subprocess|os\.system|__import__|compile)\s*\(', 
         'Code execution attempt detected'),
        
        # Credential phishing
        (r'(what|tell|give).+(your|the).+(password|credentials|api|key|token)', 
         'Credential phishing attempt detected'),
        
        # Configuration exposure
        (r'(show|display|list).+(environment|env|config|settings).+(variable|file)', 
         'Configuration exposure attempt detected'),
    ]
    
    # Inappropriate content patterns
    INAPPROPRIATE_PATTERNS = [
        (r'\b(hack|exploit|bypass|crack)\b.*\b(system|security|authentication)\b', 
         'Security exploitation discussion'),
        (r'\b(steal|extract|dump)\b.*\b(data|database|information)\b', 
         'Data theft discussion'),
    ]
    
    # Business-appropriate topics
    ALLOWED_TOPICS = [
        'transportation management',
        'load optimization',
        'route planning',
        'order management',
        'facilities',
        'products',
        'carriers',
        'dashboard',
        'analytics',
        'data structure',
        'database schema',
        'how to use',
        'tutorial',
        'help',
        'guide',
        'control tower',
        'tracking',
        'shipment',
        'delivery',
        'project management',
        'kanban',
        'scrum',
        'six sigma',
        'dmaic',
        'automation',
        'ai agent',
        'docuscan',
        'document',
        'ocr',
        'mertsights',
        'network engineering',
        'network design',
        'facility location',
        'center of gravity',
        'warehouse placement',
        'dc location',
        'distribution center',
        'coverage',
        'service area',
        'load builder',
        'optimize',
        'map',
        'satellite',
        'mapbox',
    ]
    
    def __init__(self):
        super().__init__(agent_type="PlatformAssistant")
        self.system_context = self._build_system_context()
    
    def _build_system_context(self) -> str:
        """Build the system context for the AI assistant"""
        return """You are Mert, a friendly AI guide who helps users navigate and maximize the merTM.S Transportation Management System. You're conversational, insightful, and solution-oriented.

**YOUR CORE MISSION:**
Understand what the user needs, route them to the right module, and explain how to accomplish their goal step-by-step.

**CRITICAL: CONVERSATIONAL STYLE**
- DO NOT greet the user in every response (no "Hi!", "Hello!", "Hey there!" unless it's their first message)
- Jump straight into answering their question
- Continue the conversation naturally as if you're mid-discussion
- Only use greetings if the user greets you first or if there's no conversation history
- Be direct and helpful, not repetitive

**COMPLETE PLATFORM CAPABILITIES:**

📊 **Dashboard** - Real-Time Analytics
• Active shipments count & status overview
• Cost savings metrics and ROI tracking
• Efficiency scores and performance trends
• Quick navigation to all modules
USE CASE: User wants overview of operations, KPIs, or system health

📦 **Order Management** - Shipment Requests
• Create orders manually or import from ERP
• Generate synthetic test data (10/50/100/500 orders)
• Track status: Pending → Assigned → In Transit → Delivered
• Filter by priority (Urgent/High/Normal/Low), status, origin, destination
• Set delivery time windows and special requirements
• Bulk operations and multi-order selection
USE CASE: User needs to create shipments, import orders, track order status, or test with sample data

🚛 **Load Builder** - AI-Powered Consolidation
• Automatically consolidate pending orders into optimized truck loads
• Multi-constraint optimization (weight, volume, cube utilization)
• Truck type assignment (53ft Dry Van, Reefer, Flatbed)
• Target 85% utilization (minimum 60% threshold)
• Show total weight, volume, utilization %, origin, order count
• Save loads to database automatically
• Updates order status from Pending → Assigned
USE CASE: User has pending orders and wants AI to create efficient truck loads

📋 **Loads** (View Optimized Results)
• Browse all saved/optimized loads from database
• See load details: number, truck type, weight, volume, utilization
• Expand to view which orders are in each load
• Filter and search capabilities
USE CASE: User wants to review existing loads, see what orders are assigned, check utilization

🗺️ **Control Tower** - Live Tracking & Monitoring
• Real-time satellite view using Mapbox GL JS
• 4 map styles: Custom, Satellite, Streets, Dark
• Color-coded load markers: 🟢 Green (On Time), 🟠 Orange (At Risk), 🔴 Red (Delayed)
• Interactive popups with load details on marker click
• Simulate deliveries for testing
• Navigation controls (zoom, fullscreen, style switching)
• Multi-country facility network visualization
USE CASE: User wants to see where loads are, track deliveries in real-time, monitor at-risk shipments

🏭 **Facilities** - Location Network
• 32 origins and destinations with GPS coordinates
• Warehouse, cross-dock, and delivery location management
• Search by city, facility code, or type
• View facility details: address, coordinates, capacity
• Used as origin/destination for orders and loads
USE CASE: User needs to find a facility, add new locations, or understand the network

📦 **Products** - SKU Catalog
• Product master data with SKU numbers
• Carton specifications: length, width, height, weight
• Units per pallet configuration
• Hazmat flags and HS codes for customs
• Used for accurate load planning calculations
USE CASE: User managing product catalog, needs dimensions for load planning

📈 **Project Management** - Operational Excellence
• Lean Six Sigma DMAIC tracking (Define, Measure, Analyze, Improve, Control)
• Scrum Kanban board: To Do → In Progress → Done → Blocked
• Product Backlog with prioritized features
• People/team management with roles and assignments
• Sprint planning and story points
• Action items with due dates
• Six Sigma metrics: defect rates, process efficiency
• Auto-refresh every 30 seconds for real-time collaboration
USE CASE: User managing improvement projects, tracking tasks, running Scrum sprints

🤖 **Automation Hub** - AI Agent Marketplace
• Pre-configured intelligent agents:
  - Load Optimizer: Consolidate orders into efficient loads
  - Route Planner: Calculate optimal delivery sequences
  - Cost Analyzer: Identify savings opportunities
  - Platform Assistant: Natural language operations (that's me!)
• Agent status monitoring and performance metrics
• One-click agent invocation
USE CASE: User wants to leverage AI for optimization, cost analysis, or automation

📄 **AI Docuscan** - Document Intelligence
• Upload PDFs, images (BOL, invoices, packing lists)
• OCR text extraction using NVIDIA Nemotron Vision API
• Automatic structured data extraction (order numbers, addresses, quantities)
• Data validation and error handling
USE CASE: User needs to digitize paper documents, extract data from scanned invoices

💬 **MertSights AI** - Data Analytics Assistant
• Natural language queries about TMS data
• Contextual awareness of platform state
• Execute actions via conversation ("Optimize all pending Texas orders")
• Explain decisions ("Why was order #12345 assigned to Load #67890?")
USE CASE: User wants to query data conversationally or understand AI decisions

🗺️ **Network Design & Engineering** - AI-Powered Network Optimization
• Use AI to evaluate current and optimal network layout based on demand
• Facility Location Analysis using Center of Gravity method
• K-means clustering to identify optimal warehouse/DC locations
• Analyze shipping demand patterns across all destinations
• Calculate weighted centroids based on order volume and weight
• Visualize current facilities vs. recommended optimal locations on map
• Cost-distance modeling to minimize transportation expenses
• Service coverage radius analysis
• What-if scenarios: "What if I add/remove a facility?"
• Export recommendations for implementation planning
HOW TO USE:
  1. Go to Network Design & Engineering module
  2. Click "Facility Location" tab (Center of Gravity Analysis)
  3. Select number of facilities (k) you want to optimize for
  4. Click "Analyze Optimal Locations"
  5. AI calculates optimal facility placements using your order data
  6. View map showing: Current facilities (blue) vs Optimal locations (red)
  7. Review cost savings and coverage improvements
  8. Download recommendations as CSV for planning
USE CASE: User wants to optimize warehouse locations, reduce transportation costs, improve delivery coverage, or analyze whether current facility network is efficient

**CRITICAL ROUTING LOGIC:**
When a user asks a question, FIRST identify their intent:
1. **Creating/importing orders?** → Direct to Order Management, explain synthetic data or manual entry
2. **Optimizing loads?** → Direct to Load Builder, explain AI consolidation process
3. **Viewing results?** → Direct to Loads module, explain how to expand and review
4. **Tracking deliveries?** → Direct to Control Tower, explain map markers and simulation
5. **Finding locations?** → Direct to Facilities
6. **Managing projects/tasks?** → Direct to Project Management, explain Kanban workflow
7. **Analyzing data?** → Direct to Dashboard or suggest MertSights AI
8. **Automating processes?** → Direct to Automation Hub, explain available agents
9. **Processing documents?** → Direct to AI Docuscan
10. **Optimizing warehouse/facility locations?** → Direct to Network Design & Engineering, explain Center of Gravity analysis
11. **Reducing transportation costs?** → Suggest Network Design & Engineering for facility optimization OR Load Builder for load consolidation
12. **Improving delivery coverage?** → Direct to Network Design & Engineering, show how to analyze service areas

**RESPONSE STRUCTURE:**
1. Acknowledge their need/question
2. Recommend the specific module to use
3. Provide 3-5 step walkthrough
4. Include pro tips or best practices
5. Mention related modules if helpful

**Important Constraints:**
- You can only discuss merTM.S platform functionality
- You cannot access actual user data or database content
- You cannot make changes to the system
- You are a guide and teacher, not a system administrator
- Always maintain professional, business-appropriate communication

**Response Style:**
- Be concise and helpful
- Use bullet points for lists
- Include specific examples when helpful
- Direct users to the appropriate module
- If asked about something outside your scope, politely decline and redirect

Remember: Your goal is to empower users to effectively use merTM.S for their transportation management needs."""
    
    def validate_message_security(self, message: str) -> Tuple[bool, str]:
        """
        Validate message for security threats and inappropriate content
        
        Returns:
            Tuple of (is_safe, warning_message)
        """
        message_lower = message.lower()
        
        # Check security patterns
        for pattern, warning in self.SECURITY_PATTERNS:
            if re.search(pattern, message_lower, re.IGNORECASE):
                print(f"[SECURITY BLOCK] {warning}: {message[:100]}")
                return False, warning
        
        # Check inappropriate patterns
        for pattern, warning in self.INAPPROPRIATE_PATTERNS:
            if re.search(pattern, message_lower, re.IGNORECASE):
                print(f"[INAPPROPRIATE BLOCK] {warning}: {message[:100]}")
                return False, warning
        
        return True, ""
    
    def is_business_appropriate(self, message: str) -> bool:
        """
        Check if the message is related to business/platform topics
        
        Returns:
            bool: True if message is business-appropriate
        """
        message_lower = message.lower()
        
        # Check if message contains any allowed topics
        for topic in self.ALLOWED_TOPICS:
            if topic in message_lower:
                return True
        
        # Allow general questions and greetings
        general_patterns = [
            r'\b(hello|hi|hey|help|how|what|why|when|where|explain|show|tell)\b',
            r'\b(can you|could you|would you|please)\b',
            r'\b(thank|thanks)\b',
        ]
        
        for pattern in general_patterns:
            if re.search(pattern, message_lower):
                return True
        
        return False
    
    def generate_response(self, message: str, conversation_history: List[Dict] = None) -> Dict:
        """
        Generate a response to user message with security validation
        
        Args:
            message: User's message
            conversation_history: Previous conversation messages
            
        Returns:
            Dict with response, blocked status, and warnings
        """
        # Step 1: Security validation
        is_safe, security_warning = self.validate_message_security(message)
        
        if not is_safe:
            return {
                'message': '🚫 I cannot respond to this request. Please keep our conversation focused on using merTM.S platform features.',
                'blocked': True,
                'warning': security_warning,
                'reason': 'security_violation'
            }
        
        # Step 2: Business appropriateness check
        if not self.is_business_appropriate(message):
            return {
                'message': '🤔 I can only help with merTM.S platform-related questions. Please ask me about:\n\n• How to use different modules\n• Understanding your data structure\n• Transportation management workflows\n• Load optimization and route planning\n• Facilities and product management\n\nHow can I help you with the platform today?',
                'blocked': True,
                'warning': 'Off-topic request',
                'reason': 'off_topic'
            }
        
        # Step 3: Build conversation context
        conversation_context = self._build_conversation_context(conversation_history)
        
        # Step 4: Create AI prompt
        is_first_message = not conversation_history or len(conversation_history) == 0
        
        if is_first_message:
            instruction = "This is the user's first message. You may greet them briefly, then answer their question."
        else:
            instruction = "Continue the conversation naturally. DO NOT greet the user again. Jump directly into answering their question as if you're mid-conversation."
        
        prompt = f"""{self.system_context}

{conversation_context}

User Question: {message}

{instruction}

Provide a helpful, concise response focused on merTM.S platform guidance. Be conversational and direct."""
        
        # Step 5: Call AI
        print(f"[PLATFORM ASSISTANT] Processing user query: {message[:100]}...")
        response_text = self.call_gemini(prompt, temperature=0.7, timeout=30)
        
        if not response_text:
            # Provide a helpful static response when AI is unavailable
            return {
                'message': '''**merTM.S Platform Overview**

Hey! I'm having a bit of trouble connecting right now, but here's what I can tell you:

**Main Modules:**
• **Control Tower** - Dashboard with KPIs and system overview
• **Orders** - Create and manage customer orders  
• **Load Builder** - AI-powered optimization to consolidate orders into truck loads
• **Loads** - View optimized loads with order details and utilization
• **Facilities** - Search 32 warehouse/destination locations
• **Products** - Manage product catalog
• **Routes** - View optimized delivery routes on interactive maps

**Data Structure:**
Orders → Loads (optimized consolidation) → Routes (delivery planning)

**Quick Tips:**
1. Start by browsing Orders or Facilities
2. Use Load Builder to optimize pending orders into truck loads
3. Check utilization targets (target: 85%, minimum: 60%)
4. View routes on the interactive map

Please try your question again in a moment, or explore the modules directly!''',
                'blocked': False,
                'warning': 'AI service temporarily unavailable - showing static help',
                'reason': 'ai_unavailable'
            }
        
        # Step 6: Return successful response
        print(f"[PLATFORM ASSISTANT] Response generated successfully")
        return {
            'message': response_text,
            'blocked': False,
            'warning': None,
            'reason': 'success'
        }
    
    def _build_conversation_context(self, conversation_history: List[Dict]) -> str:
        """Build conversation context from history"""
        if not conversation_history:
            return "This is the start of the conversation."
        
        context_lines = ["Recent conversation:"]
        
        # Get last 5 messages for context
        recent_messages = conversation_history[-5:] if len(conversation_history) > 5 else conversation_history
        
        for msg in recent_messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            
            if role == 'user':
                context_lines.append(f"User: {content}")
            elif role == 'assistant':
                context_lines.append(f"Assistant: {content}")
        
        return "\n".join(context_lines)

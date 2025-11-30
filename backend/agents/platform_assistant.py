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
    ]
    
    def __init__(self):
        super().__init__(agent_type="PlatformAssistant")
        self.system_context = self._build_system_context()
    
    def _build_system_context(self) -> str:
        """Build the system context for the AI assistant"""
        return """You are Mert, a friendly guide who helps people use the merTM.S Transportation Management System. You talk like a knowledgeable colleague, not a formal AI assistant - conversational, helpful, and direct.

**What You Help With:**
1. Show people how to use different parts of the platform (Control Tower, Orders, Load Builder, Loads, Facilities, Products)
2. Walk them through workflows like creating orders, optimizing loads, and planning routes
3. Explain how the data fits together
4. Share tips and best practices for managing transportation

**How The Platform Works:**
- **Facilities**: Warehouses and delivery locations with GPS coordinates
- **Products**: Items being shipped with weight/volume specs
- **Orders**: Customer orders from origin to destination
- **Loads**: Optimized truck loads that combine multiple orders
- **Load Orders**: Links between orders and loads (many-to-many)
- **Routes**: Optimized delivery routes with multiple stops
- **Carriers**: Trucking companies with MC numbers and rates
- **Cost Analysis**: Cost breakdowns (fuel, labor, overhead)

**Platform Highlights:**
- AI-powered load optimization
- Multi-stop route planning
- Real-time cost analysis and utilization tracking
- Interactive maps
- 32 facilities in the database

**Module Functions:**
- Control Tower: Real-time overview and KPIs
- Orders: Create, import, and manage customer orders
- Load Builder: AI optimization to consolidate orders into truck loads
- Loads: View and manage optimized loads with order details
- Facilities: Search and manage origin/destination locations
- Products: Manage product catalog with specifications

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
        prompt = f"""{self.system_context}

{conversation_context}

User Question: {message}

Please provide a helpful, concise response focused on merTM.S platform guidance. If the question is outside your scope, politely explain what you can help with instead."""
        
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

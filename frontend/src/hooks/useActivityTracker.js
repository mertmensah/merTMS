import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'

// Generate a unique session ID
const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Get or create session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('tms_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem('tms_session_id', sessionId)
  }
  return sessionId
}

// Activity tracking service
export const ActivityTracker = {
  // Log any activity
  async logActivity(activityType, data = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const sessionId = getSessionId()

      await supabase.from('user_activity_logs').insert({
        user_id: user.id,
        session_id: sessionId,
        activity_type: activityType,
        page_name: data.page_name,
        feature_name: data.feature_name,
        action_details: data.details,
        user_agent: navigator.userAgent
      })

      // Update session activity timestamp
      await supabase.rpc('update_session_activity', { p_session_id: sessionId })
    } catch (error) {
      console.error('Activity tracking error:', error)
    }
  },

  // Start a new session
  async startSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const sessionId = getSessionId()

      // Create session record
      await supabase.from('user_sessions').insert({
        user_id: user.id,
        session_id: sessionId,
        is_active: true,
        user_agent: navigator.userAgent
      })

      // Log login activity
      await this.logActivity('login', { page_name: 'Login' })

      // Update profile session count
      await supabase.rpc('execute_sql', {
        query: `UPDATE profiles SET total_sessions = COALESCE(total_sessions, 0) + 1 WHERE id = '${user.id}'`
      }).catch(() => {
        // Fallback if RPC not available
        supabase.from('profiles').update({ 
          total_sessions: user.total_sessions ? user.total_sessions + 1 : 1 
        }).eq('id', user.id)
      })
    } catch (error) {
      console.error('Session start error:', error)
    }
  },

  // End session
  async endSession() {
    try {
      const sessionId = getSessionId()
      
      // Log logout activity
      await this.logActivity('logout', { page_name: 'Logout' })

      // End session via RPC
      await supabase.rpc('end_user_session', { p_session_id: sessionId })

      // Clear session ID
      sessionStorage.removeItem('tms_session_id')
    } catch (error) {
      console.error('Session end error:', error)
    }
  },

  // Track page view
  async trackPageView(pageName) {
    try {
      const sessionId = getSessionId()

      await this.logActivity('page_view', { page_name: pageName })

      // Increment page view count
      await supabase
        .from('user_sessions')
        .update({ page_views: supabase.raw('page_views + 1') })
        .eq('session_id', sessionId)
        .eq('is_active', true)
    } catch (error) {
      console.error('Page view tracking error:', error)
    }
  },

  // Track feature usage
  async trackFeature(featureName, details = {}) {
    await this.logActivity('feature_use', { 
      feature_name: featureName,
      details 
    })
  },

  // Track custom action
  async trackAction(actionName, details = {}) {
    await this.logActivity('action', {
      feature_name: actionName,
      details
    })
  }
}

// React hook for activity tracking
export const useActivityTracker = (pageName) => {
  const { user } = useAuth()
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    if (user && pageName && !hasTrackedRef.current) {
      ActivityTracker.trackPageView(pageName)
      hasTrackedRef.current = true
    }
  }, [user, pageName])

  return ActivityTracker
}

// Auto-update session activity every 30 seconds
export const useSessionHeartbeat = () => {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const heartbeat = setInterval(() => {
      const sessionId = getSessionId()
      supabase.rpc('update_session_activity', { p_session_id: sessionId })
        .catch(err => console.error('Heartbeat error:', err))
    }, 30000) // Every 30 seconds

    return () => clearInterval(heartbeat)
  }, [user])
}

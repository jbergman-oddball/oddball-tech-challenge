// Tavus.io Video Call Integration
import { supabase } from './supabase'

export interface TavusPersona {
  id: string
  name: string
  description: string
  avatar_url?: string
  voice_id?: string
  personality_traits: string[]
  expertise_areas: string[]
  conversation_style: 'professional' | 'casual' | 'technical' | 'friendly'
  is_active: boolean
}

export interface TavusConversation {
  id: string
  persona_id: string
  session_id?: string
  challenge_id?: string
  participant_name: string
  participant_email: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  start_time?: string
  end_time?: string
  duration_minutes?: number
  conversation_summary?: string
  key_insights?: string[]
  technical_assessment?: {
    communication_score: number
    technical_knowledge: number
    problem_solving: number
    overall_rating: number
  }
  created_at: string
  updated_at: string
}

export interface TavusCallConfig {
  persona_id: string
  participant_name: string
  participant_email: string
  session_context?: {
    challenge_title?: string
    challenge_description?: string
    candidate_background?: string
    interview_focus?: string[]
  }
  call_settings: {
    max_duration_minutes: number
    auto_record: boolean
    enable_screen_share: boolean
    conversation_starters?: string[]
  }
}

export class TavusManager {
  private static instance: TavusManager
  private apiKey: string
  private baseUrl = 'https://api.tavus.io/v1'

  constructor() {
    this.apiKey = import.meta.env.VITE_TAVUS_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Tavus API key not found. Video calls will be simulated.')
    }
  }

  static getInstance(): TavusManager {
    if (!TavusManager.instance) {
      TavusManager.instance = new TavusManager()
    }
    return TavusManager.instance
  }

  // Get available personas
  async getPersonas(): Promise<TavusPersona[]> {
    try {
      if (!this.apiKey) {
        // Return mock personas for development
        return this.getMockPersonas()
      }

      const response = await fetch(`${this.baseUrl}/personas`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.personas || []
    } catch (error) {
      console.error('Error fetching Tavus personas:', error)
      return this.getMockPersonas()
    }
  }

  // Create a new video call session
  async createVideoCall(config: TavusCallConfig): Promise<{ call_url: string; conversation_id: string }> {
    try {
      if (!this.apiKey) {
        // Return mock call for development
        return this.createMockCall(config)
      }

      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          persona_id: config.persona_id,
          participant: {
            name: config.participant_name,
            email: config.participant_email
          },
          context: config.session_context,
          settings: config.call_settings
        })
      })

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Store conversation in our database
      await this.storeConversation({
        id: data.conversation_id,
        persona_id: config.persona_id,
        participant_name: config.participant_name,
        participant_email: config.participant_email,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      return {
        call_url: data.call_url,
        conversation_id: data.conversation_id
      }
    } catch (error) {
      console.error('Error creating Tavus video call:', error)
      return this.createMockCall(config)
    }
  }

  // Get conversation details
  async getConversation(conversationId: string): Promise<TavusConversation | null> {
    try {
      const { data, error } = await supabase
        .from('tavus_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (error) {
        console.error('Error fetching conversation:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error getting conversation:', error)
      return null
    }
  }

  // Update conversation status
  async updateConversationStatus(
    conversationId: string, 
    status: TavusConversation['status'],
    additionalData?: Partial<TavusConversation>
  ): Promise<void> {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      }

      const { error } = await supabase
        .from('tavus_conversations')
        .update(updateData)
        .eq('id', conversationId)

      if (error) {
        console.error('Error updating conversation:', error)
      }
    } catch (error) {
      console.error('Error updating conversation status:', error)
    }
  }

  // Get conversation analytics
  async getConversationAnalytics(conversationId: string): Promise<any> {
    try {
      if (!this.apiKey) {
        return this.getMockAnalytics()
      }

      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching conversation analytics:', error)
      return this.getMockAnalytics()
    }
  }

  // Store conversation in database
  private async storeConversation(conversation: Partial<TavusConversation>): Promise<void> {
    try {
      const { error } = await supabase
        .from('tavus_conversations')
        .insert(conversation)

      if (error) {
        console.error('Error storing conversation:', error)
      }
    } catch (error) {
      console.error('Error storing conversation:', error)
    }
  }

  // Mock data for development
  private getMockPersonas(): TavusPersona[] {
    return [
      {
        id: 'persona-tech-interviewer',
        name: 'Alex Chen',
        description: 'Senior Technical Interviewer specializing in full-stack development and system design',
        avatar_url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
        personality_traits: ['analytical', 'encouraging', 'detail-oriented', 'patient'],
        expertise_areas: ['JavaScript', 'React', 'Node.js', 'System Design', 'Algorithms'],
        conversation_style: 'professional',
        is_active: true
      },
      {
        id: 'persona-frontend-expert',
        name: 'Sarah Johnson',
        description: 'Frontend Architecture Expert with focus on modern web technologies and UX',
        avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
        personality_traits: ['creative', 'collaborative', 'user-focused', 'innovative'],
        expertise_areas: ['React', 'Vue.js', 'TypeScript', 'CSS', 'Web Performance'],
        conversation_style: 'friendly',
        is_active: true
      },
      {
        id: 'persona-backend-specialist',
        name: 'Michael Rodriguez',
        description: 'Backend Systems Architect with expertise in scalable infrastructure and APIs',
        avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
        personality_traits: ['logical', 'thorough', 'security-minded', 'performance-focused'],
        expertise_areas: ['Python', 'Java', 'Microservices', 'Databases', 'Cloud Architecture'],
        conversation_style: 'technical',
        is_active: true
      },
      {
        id: 'persona-devops-engineer',
        name: 'Emily Davis',
        description: 'DevOps Engineer specializing in CI/CD, containerization, and cloud platforms',
        avatar_url: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400',
        personality_traits: ['systematic', 'problem-solver', 'automation-focused', 'reliable'],
        expertise_areas: ['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Terraform'],
        conversation_style: 'casual',
        is_active: true
      }
    ]
  }

  private async createMockCall(config: TavusCallConfig): Promise<{ call_url: string; conversation_id: string }> {
    const conversationId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Store mock conversation
    await this.storeConversation({
      id: conversationId,
      persona_id: config.persona_id,
      participant_name: config.participant_name,
      participant_email: config.participant_email,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    return {
      call_url: `https://app.tavus.io/call/${conversationId}?mock=true`,
      conversation_id: conversationId
    }
  }

  private getMockAnalytics() {
    return {
      duration_minutes: Math.floor(Math.random() * 30) + 15,
      conversation_summary: "The candidate demonstrated strong technical knowledge and good communication skills. They were able to explain complex concepts clearly and showed enthusiasm for the role.",
      key_insights: [
        "Strong understanding of React and modern JavaScript",
        "Good problem-solving approach with systematic thinking",
        "Excellent communication skills and ability to explain technical concepts",
        "Shows passion for learning new technologies"
      ],
      technical_assessment: {
        communication_score: Math.floor(Math.random() * 20) + 80,
        technical_knowledge: Math.floor(Math.random() * 25) + 75,
        problem_solving: Math.floor(Math.random() * 20) + 80,
        overall_rating: Math.floor(Math.random() * 15) + 85
      }
    }
  }
}

export const tavusManager = TavusManager.getInstance()
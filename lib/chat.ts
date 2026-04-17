import { supabase } from './supabase';

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export async function saveChatSession(userId: string, messages: Message[], sessionId?: string) {
  if (sessionId) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ 
        messages,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', userId);
    
    if (error) console.error('Error updating chat session:', error);
    return data;
  } else {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        module: 'mentor',
        messages
      })
      .select()
      .single();
    
    if (error) console.error('Error creating chat session:', error);
    return data;
  }
}

export async function getChatSessions(userId: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }
  return data;
}

export async function getChatSessionById(sessionId: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  if (error) {
    console.error('Error fetching chat session:', error);
    return null;
  }
  return data;
}

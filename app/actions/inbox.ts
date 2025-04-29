'use server';

import { createServerClient } from '../../lib/supabaseClient';

// Función para obtener conversaciones
export async function getConversations() {
  const supabase = createServerClient();
  
  try {
    // Obtener todos los clientes con su último contacto
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, wa_id, bant_stage, requirement_stage, last_contact_at')
      .order('last_contact_at', { ascending: false });
    
    if (clientsError) throw clientsError;
    
    // Para cada cliente, obtener su último mensaje
    const conversationsWithMessages = await Promise.all(
      (clientsData || []).map(async (client) => {
        const { data: latestMessage, error: messageError } = await supabase
          .from('conversations')
          .select('id, message_in, message_out, timestamp')
          .eq('client_id', client.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();
        
        if (messageError && messageError.code !== 'PGRST116') {
          console.error(`Error fetching latest message for client ${client.id}:`, messageError);
        }
        
        const lastMessage = latestMessage?.message_in || latestMessage?.message_out || 'No hay mensajes';
        
        return {
          id: client.id + '-' + (latestMessage?.id || 'no-message'),
          client_id: client.id,
          client_name: client.name || '',
          client_wa_id: client.wa_id,
          bant_stage: client.bant_stage,
          requirement_stage: client.requirement_stage,
          last_message: lastMessage,
          last_message_at: latestMessage?.timestamp || client.last_contact_at
        };
      })
    );
    
    return conversationsWithMessages;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

// Función para obtener mensajes de un cliente
export async function getClientMessages(clientId: string) {
  const supabase = createServerClient();
  
  try {
    // Obtener detalles del cliente
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, name, wa_id, bant_stage, requirement_stage')
      .eq('id', clientId)
      .single();
    
    if (clientError) throw clientError;
    
    // Obtener mensajes
    const { data: messagesData, error: messagesError } = await supabase
      .from('conversations')
      .select('id, client_id, message_in, message_out, timestamp')
      .eq('client_id', clientId)
      .order('timestamp', { ascending: true });
    
    if (messagesError) throw messagesError;
    
    return {
      client: clientData,
      messages: messagesData || []
    };
  } catch (error) {
    console.error('Error fetching client messages:', error);
    throw error;
  }
}

// Función para enviar un mensaje
export async function sendMessage(clientId: string, message: string) {
  const supabase = createServerClient();
  
  try {
    // Guardar mensaje en la base de datos
    const { data: newMessage, error } = await supabase
      .from('conversations')
      .insert({
        client_id: clientId,
        message_out: message,
        message_type: 'text'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Actualizar último contacto del cliente
    await supabase
      .from('clients')
      .update({ last_contact_at: new Date().toISOString() })
      .eq('id', clientId);
    
    return newMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}
'use server';

import { createServerClient } from '../../lib/supabaseClient';

// Función para crear un cliente de prueba
export async function createTestClient() {
  const supabase = createServerClient();
  
  try {
    // Verificar si ya existe un cliente de prueba
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id')
      .eq('wa_id', 'test-client')
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    // Si ya existe, devolver su ID
    if (existingClient) {
      return existingClient.id;
    }
    
    // Crear un nuevo cliente de prueba
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert({
        wa_id: 'test-client',
        name: 'Usuario de Prueba',
        bant_stage: 'start'
      })
      .select()
      .single();
    
    if (createError) throw createError;
    
    return newClient.id;
  } catch (error) {
    console.error('Error creating test client:', error);
    throw error;
  }
}

// Función para guardar un mensaje en la base de datos
export async function saveMessage(clientId: string, message: string, isIncoming: boolean) {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        client_id: clientId,
        message_in: isIncoming ? message : null,
        message_out: isIncoming ? null : message,
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
    
    return data;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}
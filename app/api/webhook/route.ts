// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient'; // Importar cliente Supabase
import { processMessage, processRequirements } from '../../langgraph/agent/agent'; // Importar funciones del agente
import { graph } from '../../langgraph/agent/agent'; // Importar el grafo LangGraph para compatibilidad
import { HumanMessage } from '@langchain/core/messages'; // Importar HumanMessage

// TODO: Implementar la verificación del token de WhatsApp y la firma X-Hub-Signature
async function verifyWhatsAppSignature(req: NextRequest): Promise<boolean> {
  // Placeholder: Lógica de verificación
  const hubSignature = req.headers.get('X-Hub-Signature-256');
  const whatsAppToken = process.env.WHATSAPP_VERIFY_TOKEN; // Necesitarás configurar esta variable de entorno

  if (!hubSignature || !whatsAppToken) {
    console.error('Missing WhatsApp verification token or signature header');
    return false;
  }

  // Aquí iría la lógica real para validar la firma usando el token secreto de la app de WhatsApp
  // Por ahora, devolvemos true para desarrollo inicial
  console.log('Skipping signature verification for now.');
  return true;
}

// TODO: Implementar la lógica para guardar/actualizar datos del cliente en Supabase
// Guarda o actualiza el cliente básico en la tabla 'clients'
// Devuelve el registro completo del cliente (incluyendo su ID interno)
async function saveOrUpdateClientData(clientData: { wa_id: string; name: string; }): Promise<any> {
  console.log('[Webhook] Upserting client data in Supabase...', clientData);

  // Datos a insertar/actualizar. Siempre actualizamos 'name' y 'last_contact_at'.
  // 'wa_id' se usa para la condición de conflicto.
  // Los campos 'bant_stage', 'requirement_stage', 'collected_info' se manejarán en el agente.
  const upsertData = {
      wa_id: clientData.wa_id,
      name: clientData.name,
      last_contact_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('clients')
    .upsert(upsertData, {
        onConflict: 'wa_id', // Si ya existe un cliente con este wa_id...
        // ignoreDuplicates: false // Asegura que se actualice si hay conflicto (comportamiento por defecto)
    })
    .select('id, wa_id, name, bant_stage, requirement_stage, collected_info, last_contact_at') // Seleccionar todos los campos para devolver el estado actual
    .single(); // Espera un solo resultado (el cliente insertado o actualizado)

  if (error) {
    console.error('[Webhook] Supabase error upserting client data:', error);
    throw new Error(`Supabase error: ${error.message}`);
  }

  if (!data) {
      console.error('[Webhook] Supabase upsert did not return data for client:', clientData.wa_id);
      throw new Error('Failed to retrieve client data after upsert.');
  }

  console.log('[Webhook] Client data upserted successfully:', data);
  // Devolvemos el registro completo del cliente, incluyendo su 'id' (UUID)
  // que es crucial para las referencias en otras tablas y para el agente.
  return data;
}

// Implementación usando las funciones del agente
async function processWithLangChain(message: string, clientId: string): Promise<string> {
    console.log(`[Webhook] Processing message for client ${clientId}: "${message}"`);
    
    if (!clientId || clientId === 'client_placeholder_id') {
        console.error("[Webhook] Invalid clientId provided to processWithLangChain:", clientId);
        return "Error: No se pudo identificar al cliente para procesar el mensaje.";
    }

    try {
        // Obtener el contexto del cliente para determinar en qué etapa está
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('bant_stage, requirement_stage')
            .eq('id', clientId)
            .single();
        
        if (clientError) {
            console.error("[Webhook] Error fetching client data:", clientError);
            return "Lo siento, ocurrió un error al acceder a tus datos.";
        }
        
        // Guardar el mensaje entrante en la tabla de conversaciones
        const { error: conversationError } = await supabase
            .from('conversations')
            .insert({
                client_id: clientId,
                message_in: message,
                message_type: 'text'
            });
        
        if (conversationError) {
            console.error("[Webhook] Error saving incoming message:", conversationError);
            // No interrumpimos el flujo por este error
        }
        
        let response = "";
        
        // Determinar qué flujo usar basado en las etapas del cliente
        if (clientData.bant_stage === 'completed' && clientData.requirement_stage) {
            // Si BANT está completo y ya inició el flujo de requerimientos
            console.log(`[Webhook] Using requirements flow for client ${clientId}`);
            response = await processRequirements(message, clientId);
        } else {
            // Si está en BANT o no ha iniciado requerimientos
            console.log(`[Webhook] Using BANT flow for client ${clientId}`);
            response = await processMessage(message, clientId);
        }
        
        // Guardar el mensaje de respuesta en la tabla de conversaciones
        const { error: responseError } = await supabase
            .from('conversations')
            .insert({
                client_id: clientId,
                message_out: response,
                message_type: 'text'
            });
        
        if (responseError) {
            console.error("[Webhook] Error saving outgoing message:", responseError);
            // No interrumpimos el flujo por este error
        }
        
        return response;
    } catch (error) {
        console.error('[Webhook] Error processing message:', error);
        let errorMessage = "Lo siento, ocurrió un error interno al procesar tu solicitud.";
        if (error instanceof Error) {
            errorMessage += ` (${error.message})`;
        }
        return errorMessage;
    }
}

// TODO: Implementar la lógica para enviar la respuesta a WhatsApp via API
async function sendWhatsAppMessage(recipientId: string, message: string): Promise<void> {
    // Placeholder: Lógica para enviar mensaje vía WhatsApp Business API
    console.log(`Sending message to ${recipientId} via WhatsApp API: "${message}" (placeholder)...`);
    const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        console.error('Missing WhatsApp API Token or Phone Number ID');
        return;
    }

    const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`; // Asegúrate de usar la versión correcta de la API

    const body = {
        messaging_product: "whatsapp",
        to: recipientId,
        type: "text",
        text: {
            preview_url: false,
            body: message
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error sending WhatsApp message:', response.status, errorData);
        } else {
            const responseData = await response.json();
            console.log('WhatsApp message sent successfully:', responseData);
        }
    } catch (error) {
        console.error('Error during WhatsApp API call:', error);
    }
}


// Handler para GET (Verificación del Webhook)
export async function GET(req: NextRequest) {
  console.log('Received GET request for webhook verification');
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  console.log('Mode:', mode);
  console.log('Token:', token);
  console.log('Challenge:', challenge);
  console.log('Expected Token:', WHATSAPP_VERIFY_TOKEN);


  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verified successfully!');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('Webhook verification failed.');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// Handler para POST (Recepción de mensajes)
export async function POST(req: NextRequest) {
  console.log('Received POST request on webhook');
  try {
    // 1. Verificar autenticidad (simplificado por ahora)
    // const isValid = await verifyWhatsAppSignature(req);
    // if (!isValid) {
    //   console.error('Invalid webhook signature');
    //   return new NextResponse('Forbidden', { status: 403 });
    // }
    console.log('Skipping signature verification for POST request (development).');

    const payload = await req.json();
    console.log('Webhook Payload:', JSON.stringify(payload, null, 2));

    // Procesar solo mensajes de texto entrantes por ahora
    if (payload.object === 'whatsapp_business_account' && payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const messageData = payload.entry[0].changes[0].value.messages[0];
        const contactData = payload.entry[0].changes[0].value.contacts?.[0];

        if (messageData.type === 'text') {
            const from = messageData.from; // Número del cliente
            const messageBody = messageData.text.body;
            const profileName = contactData?.profile?.name || 'Cliente'; // Nombre del perfil

            console.log(`Message from ${profileName} (${from}): "${messageBody}"`);

            // 2. Guardar o actualizar datos del cliente en Supabase (placeholder)
            const client = await saveOrUpdateClientData({ wa_id: from, name: profileName, /* otros datos */ });

            // 3. TODO: Verificar consentimiento antes de procesar

            // 4. Pasar mensaje a LangChain (placeholder)
            const langChainResponse = await processWithLangChain(messageBody, client.id);

            // 5. Enviar respuesta vía WhatsApp API (placeholder)
            await sendWhatsAppMessage(from, langChainResponse);

            return new NextResponse('Message received and processed (simulated)', { status: 200 });
        } else {
             console.log('Received non-text message type:', messageData.type);
             // Opcionalmente, enviar una respuesta indicando que solo se procesan textos
             await sendWhatsAppMessage(messageData.from, "Lo siento, por ahora solo puedo procesar mensajes de texto.");
             return new NextResponse('Non-text message received', { status: 200 });
        }
    } else if (payload.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]) {
        // Manejar actualizaciones de estado (delivered, read, etc.) - opcional
        console.log('Received status update:', JSON.stringify(payload.entry[0].changes[0].value.statuses[0], null, 2));
        return new NextResponse('Status update received', { status: 200 });
    }
     else {
      console.log('Received non-message notification or unhandled payload structure');
      return new NextResponse('Webhook received, but not a user message', { status: 200 });
    }

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
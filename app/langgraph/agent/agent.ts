import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { supabase } from "../../../lib/supabaseClient";

// --- Tipos de Datos del Esquema ---
interface Lead {
    id: string;
    client_id: string;
    budget?: string;
    authority?: string;
    need?: string;
    timeline?: string;
    qualification_status?: 'pending' | 'qualified' | 'unqualified';
    created_at: string;
}

interface ClientContextData {
    id: string;
    name: string;
    bant_stage: 'start' | 'need' | 'budget' | 'authority' | 'timeline' | 'completed' | 'error';
    requirement_stage: string | null;
}

// Modelo LLM
const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.7 });

// --- Funciones de Supabase ---
async function getClientContext(clientId: string): Promise<any> {
    console.log(`[Agent] Getting context for client ID: ${clientId}`);
    if (!clientId) {
        console.warn('[Agent] Invalid clientId for getClientContext.');
        return { name: 'Cliente', bant_stage: 'start', requirement_stage: null };
    }
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('id, name, bant_stage, requirement_stage')
            .eq('id', clientId)
            .single();

        if (error && error.code !== 'PGRST116') { // No rows found
            console.error('[Agent] Supabase error fetching client context:', error);
            return { name: 'Cliente', bant_stage: 'error', requirement_stage: null };
        }

        if (data) {
            console.log('[Agent] Found client context:', data);
            return {
                id: data.id,
                name: data.name || 'Cliente',
                bant_stage: data.bant_stage || 'start',
                requirement_stage: data.requirement_stage,
            };
        } else {
            console.warn('[Agent] No client found in DB for getClientContext:', clientId);
            return { name: 'Cliente', bant_stage: 'start', requirement_stage: null };
        }
    } catch (err) {
        console.error('[Agent] Exception fetching client context:', err);
        return { name: 'Cliente', bant_stage: 'error', requirement_stage: null };
    }
}

async function getOrCreateLead(clientId: string): Promise<any> {
    console.log(`[Agent] Getting or creating lead for client ID: ${clientId}`);
    if (!clientId) return null;

    try {
        const { data: existingLeads, error: fetchError } = await supabase
            .from('leads')
            .select('*')
            .eq('client_id', clientId)
            .in('qualification_status', ['pending', null])
            .order('created_at', { ascending: false })
            .limit(1);

        if (fetchError) {
            console.error('[Agent] Supabase error fetching existing leads:', fetchError);
            return null;
        }

        if (existingLeads && existingLeads.length > 0) {
            console.log('[Agent] Found existing pending lead:', existingLeads[0]);
            return existingLeads[0] as Lead;
        } else {
            console.log('[Agent] No pending lead found, creating a new one.');
            const { data: newLead, error: insertError } = await supabase
                .from('leads')
                .insert({ client_id: clientId, qualification_status: 'pending' })
                .select()
                .single();

            if (insertError) {
                console.error('[Agent] Supabase error creating new lead:', insertError);
                return null;
            }
            console.log('[Agent] New lead created:', newLead);
            return newLead as Lead;
        }
    } catch (err) {
        console.error('[Agent] Exception getting or creating lead:', err);
        return null;
    }
}

async function updateLead(leadId: string, updates: any) {
    if (!leadId || Object.keys(updates).length === 0) {
        console.warn('[Agent] Skipping lead update: Invalid leadId or no updates provided.');
        return;
    }
    console.log(`[Agent] Updating lead ID ${leadId}:`, updates);
    try {
        const { error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', leadId);

        if (error) {
            console.error('[Agent] Supabase error updating lead:', error);
        } else {
            console.log('[Agent] Lead updated successfully.');
        }
    } catch (err) {
        console.error('[Agent] Exception updating lead:', err);
    }
}

async function updateClientStages(clientId: string, updates: any) {
     if (!clientId || Object.keys(updates).length === 0) {
        console.warn('[Agent] Skipping client stage update: Invalid clientId or no updates.');
        return;
    }
    const payload = { ...updates, last_contact_at: new Date().toISOString() };
    console.log(`[Agent] Updating client stages for ID ${clientId}:`, payload);
    try {
        const { error } = await supabase
            .from('clients')
            .update(payload)
            .eq('id', clientId);

        if (error) {
            console.error('[Agent] Supabase error updating client stages:', error);
        } else {
            console.log('[Agent] Client stages updated successfully.');
        }
    } catch (err) {
        console.error('[Agent] Exception updating client stages:', err);
    }
}

// --- Función principal del agente ---
// En lugar de usar StateGraph, simplificamos a una función que procesa mensajes
export async function processMessage(message: string, clientId: string): Promise<string> {
    console.log(`[Agent] Processing message for client ${clientId}: "${message}"`);
    
    if (!clientId) {
        console.error("[Agent] Client ID is missing!");
        return "Error interno: No se pudo identificar al cliente.";
    }

    // Obtener contexto del cliente y lead
    const clientContext = await getClientContext(clientId);
    const clientName = clientContext.name || 'Cliente';
    let currentBantStage = clientContext.bant_stage || 'start';
    
    const activeLead = await getOrCreateLead(clientId);
    if (!activeLead) {
        console.error(`[Agent] Failed to get or create a lead for client ${clientId}.`);
        return "Lo siento, hubo un problema interno al procesar tu solicitud.";
    }
    
    const currentLeadId = activeLead.id;
    console.log(`[Agent] Context for client ${clientId}: Name=${clientName}, BANT Stage=${currentBantStage}, Lead ID=${currentLeadId}`);

    // Procesar el mensaje según el estado BANT
    let nextQuestion = "";
    let nextBantStage = currentBantStage;
    let leadUpdates = {};
    let clientStageUpdates = {};

    // Lógica BANT
    switch (currentBantStage) {
        case 'start':
            nextQuestion = `¡Hola ${clientName}! Gracias por contactarnos. Para entender mejor cómo podemos ayudarte, ¿podrías contarme un poco sobre la necesidad o el problema principal que buscas resolver?`;
            nextBantStage = 'need';
            clientStageUpdates = { bant_stage: nextBantStage };
            break;
        case 'need':
            leadUpdates = { need: message };
            nextQuestion = `Entendido (Necesidad registrada: ${message || activeLead.need || 'pendiente'}). ¿Tienes un presupuesto estimado o un rango de inversión en mente para este proyecto o solución?`;
            nextBantStage = 'budget';
            clientStageUpdates = { bant_stage: nextBantStage };
            break;
        case 'budget':
            leadUpdates = { budget: message };
            nextQuestion = `Perfecto (Presupuesto: ${message || activeLead.budget || 'pendiente'}). ¿Quién o qué rol dentro de tu organización tomará la decisión final sobre seguir adelante con una solución como esta?`;
            nextBantStage = 'authority';
            clientStageUpdates = { bant_stage: nextBantStage };
            break;
        case 'authority':
            leadUpdates = { authority: message };
            nextQuestion = `Muy bien (Autoridad: ${message || activeLead.authority || 'pendiente'}). ¿En qué plazo te gustaría tener implementada esta solución o resolver esta necesidad? ¿Hay alguna fecha límite importante?`;
            nextBantStage = 'timeline';
            clientStageUpdates = { bant_stage: nextBantStage };
            break;
        case 'timeline':
            leadUpdates = { timeline: message, qualification_status: 'qualified' };
            nextBantStage = 'completed';
            clientStageUpdates = { bant_stage: nextBantStage };
            const finalLeadData = { ...activeLead, ...leadUpdates };
            nextQuestion = `¡Excelente ${clientName}! Muchas gracias por toda la información. Hemos registrado tus respuestas (Necesidad: ${finalLeadData.need || 'N/A'}, Presupuesto: ${finalLeadData.budget || 'N/A'}, Autoridad: ${finalLeadData.authority || 'N/A'}, Plazo: ${finalLeadData.timeline || 'N/A'}). Un especialista de nuestro equipo se pondrá en contacto contigo pronto.`;
            break;
        case 'completed':
            nextQuestion = `Hola ${clientName}, ya tenemos tu información registrada y un especialista se pondrá en contacto pronto. Respondiendo a tu último mensaje: "${message}" - Por ahora, te reitero que pronto tendrás noticias nuestras.`;
            break;
        default:
            console.error(`[Agent] Estado BANT desconocido o de error: ${currentBantStage}`);
            nextQuestion = "Parece que hubo un problema. Reiniciando nuestra conversación sobre tus necesidades. ¿Podrías contarme el problema principal que buscas resolver?";
            nextBantStage = 'need';
            clientStageUpdates = { bant_stage: nextBantStage };
            leadUpdates = { qualification_status: 'unqualified' };
            break;
    }

    // Actualizar estado en Supabase
    if (Object.keys(leadUpdates).length > 0 && currentLeadId) {
        updateLead(currentLeadId, leadUpdates).catch(err => console.error("[Agent] Failed to update lead in background:", err));
    }
    if (Object.keys(clientStageUpdates).length > 0) {
        updateClientStages(clientId, clientStageUpdates).catch(err => console.error("[Agent] Failed to update client stages in background:", err));
    }

    return nextQuestion;
}

// --- Función para invocar el LLM directamente si es necesario ---
export async function invokeLLM(messages: BaseMessage[]): Promise<string> {
    try {
        const response = await llm.invoke(messages);
        return response.content as string;
    } catch (error) {
        console.error("[Agent] Error invoking LLM:", error);
        return "Lo siento, ocurrió un error al procesar tu solicitud.";
    }
}

// --- Función para manejar el flujo de levantamiento de requerimientos ---
export async function processRequirements(message: string, clientId: string): Promise<string> {
    console.log(`[Agent] Processing requirements for client ${clientId}: "${message}"`);
    
    if (!clientId) {
        console.error("[Agent] Client ID is missing for requirements processing!");
        return "Error interno: No se pudo identificar al cliente para el levantamiento de requerimientos.";
    }

    // Obtener contexto del cliente
    const clientContext = await getClientContext(clientId);
    const clientName = clientContext.name || 'Cliente';
    let currentRequirementStage = clientContext.requirement_stage || 'start';
    
    // Obtener lead activo (debe haber completado BANT)
    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('client_id', clientId)
        .eq('qualification_status', 'qualified')
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (leadsError || !leads || leads.length === 0) {
        console.error(`[Agent] No qualified lead found for client ${clientId}:`, leadsError);
        return `${clientName}, parece que aún no hemos completado la calificación inicial de tu proyecto. Primero necesitamos entender mejor tus necesidades básicas.`;
    }
    
    const activeLead = leads[0];
    
    // Obtener o crear registro de requerimientos
    let activeRequirement;
    const { data: existingRequirements, error: reqError } = await supabase
        .from('requirements')
        .select('*')
        .eq('client_id', clientId)
        .eq('lead_id', activeLead.id)
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (reqError) {
        console.error(`[Agent] Error fetching requirements for client ${clientId}:`, reqError);
        return "Lo siento, hubo un problema al acceder a tus datos de requerimientos.";
    }
    
    if (existingRequirements && existingRequirements.length > 0) {
        activeRequirement = existingRequirements[0];
    } else {
        // Crear nuevo registro de requerimientos
        const { data: newRequirement, error: createError } = await supabase
            .from('requirements')
            .insert({
                client_id: clientId,
                lead_id: activeLead.id,
                status: 'draft'
            })
            .select()
            .single();
        
        if (createError || !newRequirement) {
            console.error(`[Agent] Error creating requirements for client ${clientId}:`, createError);
            return "Lo siento, hubo un problema al iniciar el proceso de levantamiento de requerimientos.";
        }
        
        activeRequirement = newRequirement;
    }
    
    // Procesar el mensaje según la etapa de requerimientos
    let nextQuestion = "";
    let nextRequirementStage = currentRequirementStage;
    let requirementUpdates: {
        objective?: string;
        features?: string;
        integrations?: string;
        audience?: string;
        reference?: string;
        priority?: string;
        brd_summary?: string;
        status?: string;
    } = {};
    
    switch (currentRequirementStage) {
        case 'start':
            nextQuestion = `¡Excelente ${clientName}! Ahora vamos a profundizar en los detalles de tu proyecto. Para empezar, ¿podrías describir el objetivo principal o problema que buscas resolver con este proyecto? Sé lo más específico posible.`;
            nextRequirementStage = 'objective';
            break;
            
        case 'objective':
            requirementUpdates.objective = message;
            nextQuestion = `Gracias por compartir ese objetivo. Ahora, ¿podrías listar las características o funcionalidades principales que consideras esenciales para este proyecto? Puedes enumerarlas en orden de prioridad.`;
            nextRequirementStage = 'features';
            break;
            
        case 'features':
            requirementUpdates.features = message;
            nextQuestion = `Excelente lista de funcionalidades. ¿Necesitas que este sistema se integre con otras plataformas, sistemas o servicios existentes? Por favor, menciona cuáles y qué tipo de integración requieres.`;
            nextRequirementStage = 'integrations';
            break;
            
        case 'integrations':
            requirementUpdates.integrations = message;
            nextQuestion = `Entendido. Ahora, ¿quiénes serán los usuarios principales de este sistema? Describe brevemente los diferentes tipos de usuarios y sus necesidades específicas.`;
            nextRequirementStage = 'audience';
            break;
            
        case 'audience':
            requirementUpdates.audience = message;
            nextQuestion = `Gracias. ¿Tienes algún ejemplo, referencia o competidor que te gustaría que consideráramos como inspiración para este proyecto? Puede ser un sitio web, una aplicación o cualquier otro sistema similar.`;
            nextRequirementStage = 'reference';
            break;
            
        case 'reference':
            requirementUpdates.reference = message;
            nextQuestion = `Casi terminamos. Por último, ¿cómo calificarías la prioridad general de este proyecto para tu organización? (Alta, Media, Baja) y ¿hay alguna fecha límite específica que debamos considerar?`;
            nextRequirementStage = 'priority';
            break;
            
        case 'priority':
            requirementUpdates.priority = message;
            nextRequirementStage = 'completed';
            
            // Generar resumen BRD usando el LLM
            const brdPrompt = `
            Genera un Documento de Requerimientos de Negocio (BRD) conciso basado en la siguiente información:
            
            CLIENTE: ${clientName}
            NECESIDAD: ${activeLead.need || 'No especificada'}
            PRESUPUESTO: ${activeLead.budget || 'No especificado'}
            AUTORIDAD: ${activeLead.authority || 'No especificada'}
            PLAZO: ${activeLead.timeline || 'No especificado'}
            
            OBJETIVO: ${activeRequirement.objective || requirementUpdates.objective || 'No especificado'}
            CARACTERÍSTICAS: ${activeRequirement.features || requirementUpdates.features || 'No especificadas'}
            INTEGRACIONES: ${activeRequirement.integrations || requirementUpdates.integrations || 'No especificadas'}
            AUDIENCIA: ${activeRequirement.audience || requirementUpdates.audience || 'No especificada'}
            REFERENCIAS: ${activeRequirement.reference || requirementUpdates.reference || 'No especificadas'}
            PRIORIDAD: ${activeRequirement.priority || requirementUpdates.priority || 'No especificada'}
            
            El BRD debe incluir:
            1. Resumen ejecutivo
            2. Alcance del proyecto
            3. Requerimientos funcionales clave
            4. Requerimientos no funcionales
            5. Restricciones y dependencias
            6. Criterios de aceptación
            7. Próximos pasos recomendados
            
            Formato el documento de manera profesional y concisa.
            `;
            
            const brdMessages = [new SystemMessage("Eres un analista de negocios experto en redactar documentos de requerimientos claros y concisos."), new HumanMessage(brdPrompt)];
            const brdResponse = await invokeLLM(brdMessages);
            
            // Guardar el BRD generado
            requirementUpdates.brd_summary = brdResponse;
            requirementUpdates.status = 'review';
            
            nextQuestion = `¡Perfecto ${clientName}! He recopilado toda la información necesaria y he generado un borrador del Documento de Requerimientos de Negocio (BRD). A continuación te presento un resumen:\n\n${brdResponse}\n\nEste documento nos servirá como base para avanzar con tu proyecto. ¿Te gustaría agendar una reunión con uno de nuestros especialistas para revisar estos requerimientos en detalle?`;
            break;
            
        case 'completed':
            // Si ya completó el levantamiento, podemos ofrecer agendar una reunión o modificar el BRD
            if (message.toLowerCase().includes('reunión') || message.toLowerCase().includes('agendar') || message.toLowerCase().includes('cita')) {
                nextQuestion = `Excelente. Para agendar una reunión, necesitaría saber tu disponibilidad (día y hora) y el correo electrónico donde quieres recibir la invitación. Un especialista te contactará para confirmar los detalles.`;
            } else if (message.toLowerCase().includes('modifica') || message.toLowerCase().includes('cambia') || message.toLowerCase().includes('actualiza')) {
                nextQuestion = `Entendido. Para modificar los requerimientos, por favor indícame qué sección específica te gustaría actualizar (Objetivo, Características, Integraciones, Audiencia, Referencias o Prioridad).`;
                nextRequirementStage = 'start'; // Reiniciar el flujo
            } else {
                nextQuestion = `Gracias por completar el levantamiento de requerimientos. El documento está listo para revisión. ¿Hay algo más en lo que pueda ayudarte? Puedo agendar una reunión con un especialista o modificar alguna sección del documento si lo necesitas.`;
            }
            break;
            
        default:
            console.error(`[Agent] Estado de requerimientos desconocido: ${currentRequirementStage}`);
            nextQuestion = "Parece que hubo un problema con el proceso de levantamiento de requerimientos. Vamos a reiniciar. ¿Podrías describir el objetivo principal de tu proyecto?";
            nextRequirementStage = 'objective';
            break;
    }
    
    // Actualizar el registro de requerimientos
    if (Object.keys(requirementUpdates).length > 0) {
        const { error: updateError } = await supabase
            .from('requirements')
            .update({
                ...requirementUpdates,
                updated_at: new Date().toISOString()
            })
            .eq('id', activeRequirement.id);
        
        if (updateError) {
            console.error(`[Agent] Error updating requirements for client ${clientId}:`, updateError);
        }
    }
    
    // Actualizar la etapa de requerimientos en el cliente
    if (currentRequirementStage !== nextRequirementStage) {
        const { error: clientUpdateError } = await supabase
            .from('clients')
            .update({
                requirement_stage: nextRequirementStage,
                last_contact_at: new Date().toISOString()
            })
            .eq('id', clientId);
        
        if (clientUpdateError) {
            console.error(`[Agent] Error updating client requirement stage for ${clientId}:`, clientUpdateError);
        }
    }
    
    return nextQuestion;
}

// Exportar un objeto vacío para compatibilidad con el código existente
export const graph = {
    invoke: async (state: any, config: any) => {
        const message = state.messages[state.messages.length - 1].content;
        const clientId = config?.configurable?.clientId;
        const response = await processMessage(message, clientId);
        return {
            messages: [...state.messages, new AIMessage(response)]
        };
    }
};

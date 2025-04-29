import { NextRequest, NextResponse } from 'next/server';
import { processMessage, processRequirements } from '../../../app/langgraph/agent/agent';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { message, clientId } = await req.json();
    
    if (!message || !clientId) {
      return NextResponse.json(
        { error: 'Se requieren message y clientId' },
        { status: 400 }
      );
    }
    
    // Get client data to determine which flow to use
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('bant_stage, requirement_stage')
      .eq('id', clientId)
      .single();
    
    if (clientError) {
      console.error('[API] Error fetching client data:', clientError);
      return NextResponse.json(
        { error: 'Error al obtener datos del cliente' },
        { status: 500 }
      );
    }
    
    let response: string;
    
    // Determine which flow to use
    if (clientData.bant_stage === 'completed' && clientData.requirement_stage) {
      // Use requirements flow
      console.log(`[API] Using requirements flow for client ${clientId}`);
      response = await processRequirements(message, clientId);
    } else {
      // Use BANT flow
      console.log(`[API] Using BANT flow for client ${clientId}`);
      response = await processMessage(message, clientId);
    }
    
    // Update client's last_contact_at
    await supabase
      .from('clients')
      .update({ last_contact_at: new Date().toISOString() })
      .eq('id', clientId);
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('[API] Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

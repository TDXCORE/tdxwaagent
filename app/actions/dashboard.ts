'use server';

import { createServerClient } from '../../lib/supabaseClient';

// Función para obtener estadísticas del dashboard
export async function getDashboardStats() {
  const supabase = createServerClient();
  
  try {
    // Obtener total de leads
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('qualification_status', { count: 'exact' });
    
    if (leadsError) throw leadsError;
    
    // Obtener leads calificados
    const { data: qualifiedLeadsData, error: qualifiedLeadsError } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('qualification_status', 'qualified');
    
    if (qualifiedLeadsError) throw qualifiedLeadsError;
    
    // Obtener requerimientos completados
    const { data: requirementsData, error: requirementsError } = await supabase
      .from('requirements')
      .select('id', { count: 'exact' })
      .eq('status', 'review');
    
    if (requirementsError) throw requirementsError;
    
    // Obtener reuniones agendadas
    const { data: meetingsData, error: meetingsError } = await supabase
      .from('meetings')
      .select('id', { count: 'exact' });
    
    if (meetingsError) throw meetingsError;
    
    return {
      totalLeads: leadsData?.length || 0,
      qualifiedLeads: qualifiedLeadsData?.length || 0,
      completedRequirements: requirementsData?.length || 0,
      scheduledMeetings: meetingsData?.length || 0
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// Función para obtener clientes recientes
export async function getRecentClients() {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, wa_id, bant_stage, requirement_stage, last_contact_at')
      .order('last_contact_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching recent clients:', error);
    throw error;
  }
}
'use server';

import { createServerClient } from '../../lib/supabaseClient';

interface Setting {
  id: string;
  key: string;
  value: any;
  description: string;
}

// Función para obtener configuraciones
export async function getSettings() {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');
    
    if (error) throw error;
    
    // Parse JSON values if needed
    const parsedSettings = data.map(setting => ({
      ...setting,
      value: typeof setting.value === 'string' ? setting.value : setting.value
    }));
    
    return parsedSettings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
}

// Función para guardar configuraciones
export async function saveSettings(settings: Setting[]) {
  const supabase = createServerClient();
  
  try {
    // Update each setting individually
    for (const setting of settings) {
      const { error } = await supabase
        .from('settings')
        .update({ value: setting.value })
        .eq('id', setting.id);
      
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

// Función para crear configuraciones predeterminadas si no existen
export async function createDefaultSettings() {
  const supabase = createServerClient();
  
  try {
    // Verificar si ya existen configuraciones
    const { data, error } = await supabase
      .from('settings')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    // Si ya hay configuraciones, no hacer nada
    if (data && data.length > 0) {
      return { success: true, created: false };
    }
    
    // Crear configuraciones predeterminadas
    const defaultSettings = [
      {
        key: 'bant_prompts',
        value: {
          need: "¿Cuál es tu necesidad o problema principal que buscas resolver?",
          budget: "¿Tienes un presupuesto estimado o rango de inversión para este proyecto?",
          authority: "¿Quién toma las decisiones finales sobre este proyecto en tu organización?",
          timeline: "¿En qué plazo necesitas implementar esta solución?"
        },
        description: "Preguntas personalizadas para el flujo BANT"
      },
      {
        key: 'requirement_prompts',
        value: {
          objective: "¿Cuál es el objetivo principal de este proyecto?",
          features: "¿Qué características o funcionalidades consideras esenciales?",
          integrations: "¿Necesitas integración con otros sistemas o plataformas?",
          audience: "¿Quiénes son los usuarios principales de este sistema?",
          reference: "¿Tienes algún ejemplo o referencia que te gustaría considerar?",
          priority: "¿Cuál es la prioridad de este proyecto y hay alguna fecha límite?"
        },
        description: "Preguntas personalizadas para el flujo de levantamiento de requerimientos"
      },
      {
        key: 'llm_config',
        value: {
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 1000
        },
        description: "Configuración del modelo de lenguaje"
      },
      {
        key: 'agent_behavior',
        value: {
          tone: "profesional",
          follow_up: true,
          summarize_responses: true
        },
        description: "Configuración del comportamiento del agente"
      }
    ];
    
    for (const setting of defaultSettings) {
      const { error: insertError } = await supabase
        .from('settings')
        .insert(setting);
      
      if (insertError) throw insertError;
    }
    
    return { success: true, created: true };
  } catch (error) {
    console.error('Error creating default settings:', error);
    throw error;
  }
}
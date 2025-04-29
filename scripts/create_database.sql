-- Script de creación de base de datos para CRM WhatsApp
-- Aplicación de gestión de clientes basada en conversaciones de WhatsApp Business

-- Habilitar la extensión uuid-ossp si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla clients: Guarda la información del cliente/contacto de WhatsApp
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wa_id TEXT UNIQUE NOT NULL, -- Número de WhatsApp (ID)
  name TEXT,
  bant_stage TEXT, -- Estado del flujo BANT (start, need, budget, authority, timeline, completed, error)
  requirement_stage TEXT, -- Estado del flujo de requerimientos (start, objective, features, integrations, audience, reference, priority, completed, error)
  collected_info JSONB, -- Respuestas recolectadas (BANT + Requerimientos)
  consent BOOLEAN DEFAULT FALSE, -- Consentimiento para procesamiento de datos
  last_contact_at TIMESTAMP DEFAULT NOW()
);

-- Crear índice para búsquedas frecuentes por wa_id
CREATE INDEX idx_clients_wa_id ON clients(wa_id);
-- Crear índice para búsquedas por fecha de último contacto
CREATE INDEX idx_clients_last_contact ON clients(last_contact_at);

-- Tabla conversations: Guarda el historial de todos los mensajes entrantes y salientes
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  message_in TEXT,
  message_out TEXT,
  message_type TEXT, -- text, image, audio, document, etc.
  metadata JSONB, -- Metadatos adicionales del mensaje
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Crear índice para búsquedas por client_id
CREATE INDEX idx_conversations_client_id ON conversations(client_id);
-- Crear índice para búsquedas por timestamp
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp);

-- Tabla leads: Guarda las respuestas y calificación del flujo BANT
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  budget TEXT,
  authority TEXT,
  need TEXT,
  timeline TEXT, -- Cambiado de timing a timeline para consistencia con el código
  qualification_status TEXT, -- pending, qualified, unqualified
  assigned_to TEXT, -- Usuario/agente asignado para seguimiento
  notes TEXT, -- Notas adicionales sobre el lead
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índice para búsquedas por client_id
CREATE INDEX idx_leads_client_id ON leads(client_id);
-- Crear índice para búsquedas por qualification_status
CREATE INDEX idx_leads_qualification ON leads(qualification_status);

-- Tabla requirements: Guarda los datos del levantamiento de requerimientos funcionales
CREATE TABLE requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL, -- Referencia al lead asociado
  objective TEXT,
  features TEXT,
  integrations TEXT,
  audience TEXT,
  reference TEXT,
  priority TEXT,
  brd_summary TEXT, -- Texto completo resumen tipo BRD
  status TEXT DEFAULT 'draft', -- draft, review, approved, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índice para búsquedas por client_id
CREATE INDEX idx_requirements_client_id ON requirements(client_id);
-- Crear índice para búsquedas por lead_id
CREATE INDEX idx_requirements_lead_id ON requirements(lead_id);

-- Tabla meetings: Registra las reuniones agendadas para demos o seguimientos
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL, -- Referencia al lead asociado
  requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL, -- Referencia al requerimiento asociado
  meeting_link TEXT,
  meeting_id TEXT, -- ID de la reunión en MS Teams
  meeting_datetime TIMESTAMP,
  duration INTEGER, -- Duración en minutos
  attendees JSONB, -- Lista de participantes
  agenda TEXT, -- Agenda de la reunión
  status TEXT, -- scheduled, completed, canceled
  notes TEXT, -- Notas de la reunión
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índice para búsquedas por client_id
CREATE INDEX idx_meetings_client_id ON meetings(client_id);
-- Crear índice para búsquedas por meeting_datetime
CREATE INDEX idx_meetings_datetime ON meetings(meeting_datetime);
-- Crear índice para búsquedas por status
CREATE INDEX idx_meetings_status ON meetings(status);

-- Tabla users: Usuarios del sistema (administradores, agentes, etc.)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT, -- admin, agent, viewer
  settings JSONB, -- Configuraciones personalizadas
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla settings: Configuraciones globales del sistema
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla audit_logs: Registro de auditoría para cambios importantes
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- create, update, delete
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Insertar configuraciones iniciales
INSERT INTO settings (key, value, description) VALUES 
('webhook_config', '{"verify_token": "your_verify_token_here", "verify_signature": false}', 'Configuración del webhook de WhatsApp'),
('llm_config', '{"model": "gpt-4o-mini", "temperature": 0.7}', 'Configuración del modelo LLM'),
('bant_questions', '{"need": "¿Cuál es tu necesidad principal?", "budget": "¿Cuál es tu presupuesto?", "authority": "¿Quién toma las decisiones?", "timeline": "¿Cuál es tu plazo?"}', 'Preguntas BANT personalizables');

-- Comentarios adicionales:
-- 1. Se han añadido índices para mejorar el rendimiento de consultas frecuentes
-- 2. Se han agregado campos adicionales útiles como metadata, notes, status
-- 3. Se han añadido tablas para users, settings y audit_logs
-- 4. Se han establecido relaciones entre requirements, leads y meetings
-- 5. Se han agregado timestamps de created_at y updated_at donde es relevante
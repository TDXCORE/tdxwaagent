# Diagrama de Relaciones de Entidades (ERD)

Este diagrama muestra la estructura de la base de datos para la aplicación CRM de WhatsApp.

```mermaid
erDiagram
    CLIENTS {
        UUID id PK
        text wa_id
        text name
        text bant_stage
        text requirement_stage
        jsonb collected_info
        boolean consent
        timestamp last_contact_at
    }
    
    CONVERSATIONS {
        UUID id PK
        UUID client_id FK
        text message_in
        text message_out
        text message_type
        jsonb metadata
        timestamp timestamp
    }
    
    LEADS {
        UUID id PK
        UUID client_id FK
        text budget
        text authority
        text need
        text timeline
        text qualification_status
        text assigned_to
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    REQUIREMENTS {
        UUID id PK
        UUID client_id FK
        UUID lead_id FK
        text objective
        text features
        text integrations
        text audience
        text reference
        text priority
        text brd_summary
        text status
        timestamp created_at
        timestamp updated_at
    }
    
    MEETINGS {
        UUID id PK
        UUID client_id FK
        UUID lead_id FK
        UUID requirement_id FK
        text meeting_link
        text meeting_id
        timestamp meeting_datetime
        integer duration
        jsonb attendees
        text agenda
        text status
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    USERS {
        UUID id PK
        text email
        text name
        text role
        jsonb settings
        timestamp created_at
        timestamp updated_at
    }
    
    SETTINGS {
        UUID id PK
        text key
        jsonb value
        text description
        timestamp updated_at
        UUID updated_by FK
    }
    
    AUDIT_LOGS {
        UUID id PK
        UUID user_id FK
        text action
        text table_name
        UUID record_id
        jsonb old_values
        jsonb new_values
        timestamp timestamp
    }

    CLIENTS ||--o{ CONVERSATIONS : has
    CLIENTS ||--o{ LEADS : has
    CLIENTS ||--o{ REQUIREMENTS : has
    CLIENTS ||--o{ MEETINGS : has
    LEADS ||--o{ REQUIREMENTS : associated_with
    LEADS ||--o{ MEETINGS : associated_with
    REQUIREMENTS ||--o{ MEETINGS : associated_with
    USERS ||--o{ SETTINGS : updates
    USERS ||--o{ AUDIT_LOGS : performs
```

## Relaciones principales

1. Un **CLIENTE** puede tener muchas **CONVERSACIONES**
2. Un **CLIENTE** puede tener muchos **LEADS** (calificaciones BANT)
3. Un **CLIENTE** puede tener muchos **REQUERIMIENTOS**
4. Un **CLIENTE** puede tener muchas **REUNIONES**
5. Un **LEAD** puede estar asociado con muchos **REQUERIMIENTOS**
6. Un **LEAD** puede estar asociado con muchas **REUNIONES**
7. Un **REQUERIMIENTO** puede estar asociado con muchas **REUNIONES**
8. Un **USUARIO** puede actualizar muchas **CONFIGURACIONES**
9. Un **USUARIO** puede realizar muchas acciones registradas en **AUDIT_LOGS**

## Notas sobre la implementación

- Todas las relaciones están configuradas con `ON DELETE CASCADE` para mantener la integridad referencial.
- Se han creado índices para mejorar el rendimiento en consultas frecuentes.
- La tabla `SETTINGS` almacena configuraciones globales del sistema.
- La tabla `AUDIT_LOGS` registra cambios importantes para auditoría.
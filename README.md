# TDX WhatsApp Agent

Aplicación CRM conversacional basada en WhatsApp Business, LangChain, OpenAI, Next.js y Supabase.

## Características

- Webhook para recibir mensajes de WhatsApp
- Gestión de leads con preguntas BANT
- Levantamiento de requerimientos funcionales para generación automática de BRD
- Agendamiento de reuniones en MS Teams
- UI con módulos Dashboard, Inbox, Chat AI, Settings
- Implementación de Guardrails AI para seguridad

## Configuración del Proyecto

### 1. Configuración de Variables de Entorno

1. Copia el archivo `.env.example` a `.env`
2. Completa las variables de entorno con tus credenciales:
   - `OPENAI_API_KEY`: Tu clave de API de OpenAI
   - Variables de Supabase (ya configuradas)
   - Variables de WhatsApp Business API

### 2. Configuración de la Base de Datos en Supabase

#### Opción 1: Usando la Interfaz de Supabase

1. Inicia sesión en [Supabase](https://supabase.com) y accede a tu proyecto
2. Ve a la sección "SQL Editor"
3. Crea una nueva consulta
4. Copia y pega el contenido del archivo `scripts/create_database.sql`
5. Ejecuta la consulta

#### Opción 2: Usando la CLI de Supabase

1. Instala la CLI de Supabase si aún no la tienes:
   ```bash
   npm install -g supabase
   ```

2. Inicia sesión en Supabase:
   ```bash
   supabase login
   ```

3. Ejecuta el script SQL:
   ```bash
   supabase db execute --project-ref lfdfpqedfxlqnsqewacn -f scripts/create_database.sql
   ```

### 3. Instalación de Dependencias

```bash
npm install
# o
yarn install
```

### 4. Ejecución del Proyecto en Desarrollo

```bash
npm run dev
# o
yarn dev
```

El servidor se iniciará en `http://localhost:3000`.

### 5. Configuración del Webhook de WhatsApp

1. Configura un túnel seguro a tu servidor local (usando ngrok, Cloudflare Tunnel, etc.)
   ```bash
   ngrok http 3000
   ```

2. Copia la URL HTTPS generada (ej: `https://your-tunnel-url.ngrok.io`)

3. Configura el webhook en la plataforma de desarrolladores de Meta:
   - URL del Webhook: `https://your-tunnel-url.ngrok.io/api/webhook`
   - Token de Verificación: El mismo valor que configuraste en `WHATSAPP_VERIFY_TOKEN`
   - Suscríbete a los eventos `messages` y `message_status`

## Estructura de la Base de Datos

El proyecto utiliza las siguientes tablas en Supabase:

- `clients`: Información de los clientes/contactos de WhatsApp
- `conversations`: Historial de mensajes entrantes y salientes
- `leads`: Respuestas y calificación del flujo BANT
- `requirements`: Datos del levantamiento de requerimientos funcionales
- `meetings`: Reuniones agendadas para demos o seguimientos
- `users`: Usuarios del sistema (administradores, agentes, etc.)
- `settings`: Configuraciones globales del sistema
- `audit_logs`: Registro de auditoría para cambios importantes

Para ver el diagrama de relaciones (ERD), consulta el archivo `docs/database_erd.md`.

## Flujo de Trabajo

1. El cliente envía un mensaje a través de WhatsApp
2. El webhook recibe el mensaje y lo procesa
3. El agente LangChain determina la etapa del cliente:
   - Si es primer contacto, realiza preguntas BANT
   - Si ya completó BANT, puede iniciar levantamiento de requerimientos
   - Si completó requerimientos, puede agendar reuniones
4. La respuesta se envía de vuelta al cliente a través de WhatsApp
5. Los datos se almacenan en Supabase para su gestión en la UI

## Desarrollo

### Estructura del Proyecto

- `/app`: Componentes y páginas de Next.js (App Router)
- `/app/api`: Endpoints de API, incluyendo el webhook
- `/app/langgraph`: Implementación del agente LangChain
- `/components`: Componentes reutilizables de UI
- `/lib`: Utilidades y configuraciones
- `/scripts`: Scripts para configuración y mantenimiento
- `/docs`: Documentación del proyecto

### Contribución

1. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
2. Realiza tus cambios
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Envía tu rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

# TDX WhatsApp Agent

Aplicación CRM conversacional basada en WhatsApp Business, LangChain, OpenAI, Next.js y Supabase.

## Características

- Webhook para recibir mensajes de WhatsApp
- Gestión de leads con preguntas BANT
- Levantamiento de requerimientos funcionales para generación automática de BRD
- Agendamiento de reuniones en MS Teams
- UI con módulos Dashboard, Inbox, Chat AI, Settings
- Implementación de Guardrails AI para seguridad

## Estructura del Proyecto

- `/app`: Código de la aplicación Next.js
  - `/dashboard`: Panel de control con KPIs y métricas
  - `/inbox`: Gestión de conversaciones de WhatsApp
  - `/chat-ai`: Interfaz para interactuar con el agente
  - `/settings`: Configuración del comportamiento del agente
  - `/api`: Endpoints de API (webhook, chat)
- `/components`: Componentes reutilizables
- `/lib`: Utilidades y configuración
- `/scripts`: Scripts de configuración y utilidades

## Requisitos Previos

- Node.js (v18 o superior)
- Cuenta en Supabase
- Cuenta en OpenAI
- Cuenta de desarrollador en Meta (para WhatsApp Business API)

## Configuración Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TDXCORE/tdxwaagent.git
   cd tdxwaagent
   ```

2. Instalar dependencias:
   ```bash
   yarn install
   ```

3. Configurar variables de entorno:
   - Copiar `.env.example` a `.env`
   - Completar las variables requeridas

4. Configurar la base de datos:
   ```bash
   yarn setup-db
   ```

5. Iniciar el servidor de desarrollo:
   ```bash
   yarn dev
   ```

## Despliegue en Vercel

### Preparación para el Despliegue

1. Asegúrate de que todas las dependencias estén correctamente configuradas en `package.json`

2. Actualiza el archivo de bloqueo:
   ```bash
   yarn update-lockfile
   ```

3. Configura las variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave anónima de Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Clave de servicio de Supabase
   - `OPENAI_API_KEY`: Clave de API de OpenAI
   - `WHATSAPP_VERIFY_TOKEN`: Token de verificación para el webhook de WhatsApp
   - `WHATSAPP_API_TOKEN`: Token de API de WhatsApp Business
   - `WHATSAPP_PHONE_NUMBER_ID`: ID del número de teléfono de WhatsApp

### Despliegue

1. Conecta tu repositorio a Vercel

2. Configura el proyecto:
   - Framework Preset: Next.js
   - Build Command: `yarn build`
   - Output Directory: `.next`
   - Install Command: `yarn install --immutable`

3. Despliega la aplicación

## Solución de Problemas

### Problemas con Dependencias

Si encuentras problemas con las dependencias durante el despliegue:

1. Verifica que todas las dependencias peer estén instaladas:
   ```bash
   yarn install
   ```

2. Si hay conflictos con el archivo de bloqueo:
   ```bash
   yarn update-lockfile
   ```

3. Asegúrate de que las versiones de Next.js y React sean compatibles

### Problemas con Variables de Entorno

Si encuentras problemas con las variables de entorno:

1. Verifica que todas las variables requeridas estén configuradas en Vercel

2. Asegúrate de que las variables públicas tengan el prefijo `NEXT_PUBLIC_`

3. Para variables del lado del servidor, usa las acciones del servidor de Next.js

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

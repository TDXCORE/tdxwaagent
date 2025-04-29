# Instrucciones para Ejecutar y Probar el Proyecto

Este documento proporciona instrucciones detalladas para configurar, ejecutar y probar el proyecto TDX WhatsApp Agent.

## Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- Cuenta en Supabase
- Cuenta en OpenAI (para acceso a la API)
- Cuenta de desarrollador en Meta (para WhatsApp Business API)
- ngrok (para exponer el webhook localmente)

## Configuración del Proyecto

### 1. Clonar el Repositorio

```bash
git clone https://github.com/TDXCORE/tdxwaagent.git
cd tdxwaagent
```

### 2. Instalar Dependencias

```bash
npm install
# o
yarn install
```

### 3. Configurar Variables de Entorno

El archivo `.env` ya está creado con las credenciales de Supabase. Necesitas completar las siguientes variables:

- `OPENAI_API_KEY`: Tu clave de API de OpenAI
- `WHATSAPP_VERIFY_TOKEN`: Un token secreto para verificar el webhook (puedes generar uno aleatorio)
- `WHATSAPP_API_TOKEN`: Token de acceso para la API de WhatsApp Business
- `WHATSAPP_PHONE_NUMBER_ID`: ID del número de teléfono registrado en WhatsApp Business

### 4. Configurar la Base de Datos

Ejecuta el siguiente comando para crear las tablas en Supabase:

```bash
npm run setup-db
# o
yarn setup-db
```

Alternativamente, puedes ejecutar el script SQL manualmente desde la interfaz de Supabase:

1. Inicia sesión en [Supabase](https://supabase.com) y accede a tu proyecto
2. Ve a la sección "SQL Editor"
3. Crea una nueva consulta
4. Copia y pega el contenido del archivo `scripts/create_database.sql`
5. Ejecuta la consulta

## Ejecución del Proyecto

### 1. Iniciar el Servidor de Desarrollo

```bash
npm run dev
# o
yarn dev
```

El servidor se iniciará en `http://localhost:3000`.

### 2. Exponer el Webhook con ngrok

En una nueva terminal, ejecuta:

```bash
npm run webhook
# o
yarn webhook
# o directamente
ngrok http 3000
```

Esto generará una URL HTTPS pública (por ejemplo, `https://a1b2c3d4.ngrok.io`) que puedes usar para configurar el webhook de WhatsApp.

### 3. Configurar el Webhook en Meta for Developers

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Accede a tu aplicación o crea una nueva
3. Configura el producto "WhatsApp" en tu aplicación
4. En la sección "Webhook", configura:
   - URL del Webhook: `https://tu-url-ngrok.io/api/webhook`
   - Token de Verificación: El mismo valor que configuraste en `WHATSAPP_VERIFY_TOKEN`
   - Campos de suscripción: `messages`, `message_status`

## Pruebas

### 1. Verificar la Configuración del Webhook

Meta enviará una solicitud GET a tu webhook para verificarlo. Si todo está configurado correctamente, verás un mensaje de éxito en la consola del servidor.

### 2. Probar el Flujo BANT

1. Envía un mensaje desde WhatsApp al número configurado
2. El sistema debería responder con la primera pregunta del flujo BANT
3. Continúa la conversación respondiendo a las preguntas

### 3. Probar el Flujo de Requerimientos

1. Completa el flujo BANT
2. El sistema debería detectar que BANT está completo y cambiar al flujo de requerimientos
3. Sigue las preguntas para completar el levantamiento de requerimientos

### 4. Verificar los Datos en Supabase

1. Inicia sesión en [Supabase](https://supabase.com) y accede a tu proyecto
2. Ve a la sección "Table Editor"
3. Verifica que los datos se estén guardando correctamente en las tablas:
   - `clients`: Información del cliente
   - `conversations`: Historial de mensajes
   - `leads`: Respuestas BANT
   - `requirements`: Datos de requerimientos

## Solución de Problemas

### El Webhook no Verifica

- Verifica que la URL de ngrok sea correcta y esté activa
- Asegúrate de que el token de verificación en `.env` coincida con el configurado en Meta
- Revisa los logs del servidor para ver si hay errores

### No se Reciben Mensajes

- Verifica que el número de WhatsApp esté correctamente configurado
- Asegúrate de que la suscripción al webhook esté activa
- Revisa los logs del servidor para ver si hay errores de autenticación

### Errores en la Base de Datos

- Verifica que las credenciales de Supabase sean correctas
- Asegúrate de que las tablas se hayan creado correctamente
- Revisa los logs del servidor para ver errores específicos de Supabase

## Próximos Pasos

Una vez que hayas verificado que todo funciona correctamente, puedes:

1. Personalizar los flujos de conversación en `app/langgraph/agent/agent.ts`
2. Implementar la interfaz de usuario en Next.js
3. Configurar el despliegue en producción
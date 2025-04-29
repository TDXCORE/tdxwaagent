'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import ChatInterface from '../../components/chat-ai/ChatInterface';
import { createTestClient, saveMessage } from '../actions/chat';
import { toast } from 'sonner';

export default function ChatAIPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  // Inicializar el cliente de prueba
  useEffect(() => {
    async function initTestClient() {
      try {
        // Verificar si ya tenemos un ID de cliente guardado
        const storedClientId = localStorage.getItem('tdx_test_client_id');
        
        if (storedClientId) {
          setClientId(storedClientId);
        } else {
          // Crear un nuevo cliente de prueba usando la acción del servidor
          const newClientId = await createTestClient();
          localStorage.setItem('tdx_test_client_id', newClientId);
          setClientId(newClientId);
        }
      } catch (error) {
        console.error('Error initializing test client:', error);
        toast.error('Error al inicializar el cliente de prueba');
      }
    }
    
    initTestClient();
  }, []);

  const handleSendMessage = async (message: string): Promise<string> => {
    setIsProcessing(true);
    
    try {
      if (!clientId) {
        throw new Error('Cliente no inicializado');
      }
      
      // Guardar el mensaje usando la acción del servidor
      await saveMessage(clientId, message, true);
      
      // Procesar el mensaje con el agente a través del endpoint API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          clientId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al procesar el mensaje');
      }
      
      const data = await response.json();
      
      // Guardar la respuesta usando la acción del servidor
      await saveMessage(clientId, data.response, false);
      
      return data.response;
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      toast.error('Error al procesar el mensaje');
      return 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.';
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Chat AI</h1>
        <p className="text-white/80">Interactúa directamente con el agente de LangGraph</p>
      </div>
      
      <div className="bg-black/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg overflow-hidden h-[calc(100vh-200px)]">
        <ChatInterface
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
        />
      </div>
    </AppLayout>
  );
}
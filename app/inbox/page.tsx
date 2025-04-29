'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import ConversationList from '../../components/inbox/ConversationList';
import ConversationView from '../../components/inbox/ConversationView';
import { getConversations, getClientMessages, sendMessage } from '../actions/inbox';

interface Conversation {
  id: string;
  client_id: string;
  client_name: string;
  client_wa_id: string;
  bant_stage: string;
  requirement_stage: string | null;
  last_message: string;
  last_message_at: string;
}

interface Message {
  id: string;
  client_id: string;
  message_in: string | null;
  message_out: string | null;
  timestamp: string;
}

interface Client {
  id: string;
  name: string;
  wa_id: string;
  bant_stage: string;
  requirement_stage: string | null;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Fetch conversations
  useEffect(() => {
    async function fetchConversations() {
      setIsLoadingConversations(true);
      try {
        const conversationsData = await getConversations();
        setConversations(conversationsData);
      } catch (error) {
        console.error('Error in fetchConversations:', error);
      } finally {
        setIsLoadingConversations(false);
      }
    }
    
    fetchConversations();
  }, []);

  // Fetch messages when a client is selected
  useEffect(() => {
    if (!selectedClientId) {
      setMessages([]);
      setSelectedClient(null);
      return;
    }
    
    async function fetchClientAndMessages() {
      setIsLoadingMessages(true);
      try {
        // Asegurarse de que selectedClientId no sea null
        if (selectedClientId) {
          const data = await getClientMessages(selectedClientId);
          setSelectedClient(data.client);
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('Error in fetchClientAndMessages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    }
    
    fetchClientAndMessages();
  }, [selectedClientId]);

  const handleSelectConversation = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedClientId || !selectedClient) return;
    
    try {
      // Add message to UI immediately for better UX
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        client_id: selectedClientId,
        message_in: null,
        message_out: message,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Save message to database using server action
      const newMessage = await sendMessage(selectedClientId, message);
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m =>
        m.id === optimisticMessage.id ? newMessage : m
      ));
      
      // Process message with agent (this would normally be handled by the webhook)
      // This is just for testing the UI
      setTimeout(async () => {
        try {
          // Simulate agent response
          const agentResponse = `Respuesta simulada al mensaje: "${message}"`;
          
          // Call API endpoint to process message
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message,
              clientId: selectedClientId
            }),
          });
          
          if (!response.ok) {
            throw new Error('Error al procesar el mensaje');
          }
          
          const data = await response.json();
          
          // Add agent response to messages
          setMessages(prev => [...prev, {
            id: `response-${Date.now()}`,
            client_id: selectedClientId,
            message_in: data.response,
            message_out: null,
            timestamp: new Date().toISOString()
          }]);
        } catch (error) {
          console.error('Error in agent response simulation:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== `temp-${Date.now()}`));
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Inbox</h1>
        <p className="text-white/80">Gestiona tus conversaciones de WhatsApp</p>
      </div>
      
      <div className="bg-black/10 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg overflow-hidden h-[calc(100vh-200px)]">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          <div className="md:col-span-1 border-r border-white/10 h-full">
            <ConversationList
              conversations={conversations}
              onSelectConversation={handleSelectConversation}
              selectedClientId={selectedClientId}
              isLoading={isLoadingConversations}
            />
          </div>
          <div className="md:col-span-2 h-full">
            <ConversationView
              client={selectedClient}
              messages={messages}
              isLoading={isLoadingMessages}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
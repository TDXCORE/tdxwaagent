'use client';

import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface ConversationViewProps {
  client: Client | null;
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string) => void;
}

export default function ConversationView({ 
  client, 
  messages, 
  isLoading = false,
  onSendMessage 
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = React.useState('');
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  if (!client) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-white/70">
          <p className="text-lg mb-2">Selecciona una conversación</p>
          <p className="text-sm">Elige un chat de la lista para ver los mensajes</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="h-6 bg-white/20 animate-pulse rounded w-1/3"></div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg ${
                i % 2 === 0 ? 'bg-white/10' : 'bg-white/20'
              } animate-pulse h-12`}></div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="h-10 bg-white/20 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h2 className="font-medium text-white">
          {client.name || client.wa_id}
        </h2>
        <div className="flex gap-2 mt-1">
          <span className="text-xs px-2 py-1 bg-white/20 rounded-full text-white">
            BANT: {client.bant_stage}
          </span>
          {client.requirement_stage && (
            <span className="text-xs px-2 py-1 bg-white/20 rounded-full text-white">
              Req: {client.requirement_stage}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-white/70 py-8">
            No hay mensajes en esta conversación
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.message_in ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg ${
                message.message_in ? 'bg-white/10' : 'bg-white/20'
              }`}>
                <div className="text-white">
                  {message.message_in || message.message_out}
                </div>
                <div className="text-right mt-1">
                  <span className="text-xs text-white/50">
                    {formatDistanceToNow(new Date(message.timestamp), {
                      addSuffix: true,
                      locale: es
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
            disabled={!newMessage.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
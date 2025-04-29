'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (clientId: string) => void;
  selectedClientId: string | null;
  isLoading?: boolean;
}

export default function ConversationList({ 
  conversations, 
  onSelectConversation, 
  selectedClientId,
  isLoading = false 
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.client_name.toLowerCase().includes(searchLower) ||
      conv.client_wa_id.toLowerCase().includes(searchLower) ||
      conv.bant_stage.toLowerCase().includes(searchLower) ||
      (conv.requirement_stage && conv.requirement_stage.toLowerCase().includes(searchLower))
    );
  });

  const getStageLabel = (bantStage: string, requirementStage: string | null) => {
    if (bantStage !== 'completed') {
      return `BANT: ${bantStage}`;
    } else if (requirementStage && requirementStage !== 'completed') {
      return `Req: ${requirementStage}`;
    } else if (requirementStage === 'completed') {
      return 'Completado';
    } else {
      return 'BANT Completado';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-10 bg-white/20 animate-pulse rounded-lg w-full"></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b border-white/10 animate-pulse">
              <div className="h-5 bg-white/20 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            className="pl-10 pr-4 py-2 w-full bg-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-white/70">
            No se encontraron conversaciones
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b border-white/10 cursor-pointer transition-colors ${
                selectedClientId === conversation.client_id
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
              }`}
              onClick={() => onSelectConversation(conversation.client_id)}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-white">
                  {conversation.client_name || conversation.client_wa_id}
                </h3>
                <span className="text-xs text-white/70">
                  {formatDistanceToNow(new Date(conversation.last_message_at), {
                    addSuffix: true,
                    locale: es
                  })}
                </span>
              </div>
              <div className="text-sm text-white/70 truncate">
                {conversation.last_message}
              </div>
              <div className="mt-2">
                <span className="text-xs px-2 py-1 bg-white/20 rounded-full text-white">
                  {getStageLabel(conversation.bant_stage, conversation.requirement_stage)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
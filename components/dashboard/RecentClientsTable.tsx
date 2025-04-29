'use client';

import React from 'react';
import Card, { CardTitle, CardContent } from '../ui/Card';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Client {
  id: string;
  name: string;
  wa_id: string;
  bant_stage: string;
  requirement_stage: string | null;
  last_contact_at: string;
}

interface RecentClientsTableProps {
  clients: Client[];
  isLoading?: boolean;
}

export default function RecentClientsTable({ clients, isLoading = false }: RecentClientsTableProps) {
  const getBantStageLabel = (stage: string) => {
    const stages: Record<string, string> = {
      'start': 'Inicio',
      'need': 'Necesidad',
      'budget': 'Presupuesto',
      'authority': 'Autoridad',
      'timeline': 'Plazo',
      'completed': 'Completado',
      'error': 'Error'
    };
    return stages[stage] || stage;
  };

  const getRequirementStageLabel = (stage: string | null) => {
    if (!stage) return 'No iniciado';
    
    const stages: Record<string, string> = {
      'start': 'Inicio',
      'objective': 'Objetivo',
      'features': 'Características',
      'integrations': 'Integraciones',
      'audience': 'Audiencia',
      'reference': 'Referencias',
      'priority': 'Prioridad',
      'completed': 'Completado',
      'error': 'Error'
    };
    return stages[stage] || stage;
  };

  const getStageColor = (stage: string | null, isRequirement = false) => {
    if (!stage) return 'bg-gray-200 text-gray-700';
    
    if (isRequirement) {
      if (stage === 'completed') return 'bg-green-100 text-green-800';
      if (stage === 'error') return 'bg-red-100 text-red-800';
      return 'bg-blue-100 text-blue-800';
    } else {
      if (stage === 'completed') return 'bg-green-100 text-green-800';
      if (stage === 'error') return 'bg-red-100 text-red-800';
      return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardTitle>Clientes Recientes</CardTitle>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardTitle>Clientes Recientes</CardTitle>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No hay clientes registrados todavía.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>Clientes Recientes</CardTitle>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 text-sm">
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Etapa BANT</th>
                <th className="pb-3 font-medium">Etapa Req.</th>
                <th className="pb-3 font-medium">Último contacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="text-sm">
                  <td className="py-3">
                    <div className="font-medium text-gray-800">{client.name || 'Sin nombre'}</div>
                    <div className="text-gray-500 text-xs">{client.wa_id}</div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStageColor(client.bant_stage)}`}>
                      {getBantStageLabel(client.bant_stage)}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStageColor(client.requirement_stage, true)}`}>
                      {getRequirementStageLabel(client.requirement_stage)}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {formatDistanceToNow(new Date(client.last_contact_at), { 
                      addSuffix: true,
                      locale: es
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
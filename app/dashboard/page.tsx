'use client';

import React, { useEffect, useState } from 'react';
import { Users, BarChart4, FileText, Calendar } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import StatCard from '../../components/dashboard/StatCard';
import FunnelChart from '../../components/dashboard/FunnelChart';
import RecentClientsTable from '../../components/dashboard/RecentClientsTable';
import { getDashboardStats, getRecentClients } from '../actions/dashboard';

interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  completedRequirements: number;
  scheduledMeetings: number;
}

interface Client {
  id: string;
  name: string;
  wa_id: string;
  bant_stage: string;
  requirement_stage: string | null;
  last_contact_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    qualifiedLeads: 0,
    completedRequirements: 0,
    scheduledMeetings: 0
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [funnelData, setFunnelData] = useState([
    { name: 'Leads Totales', value: 0, fill: '#4299E1' },
    { name: 'BANT Completado', value: 0, fill: '#48BB78' },
    { name: 'Requerimientos', value: 0, fill: '#ECC94B' },
    { name: 'Reuniones', value: 0, fill: '#F56565' }
  ]);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        // Usar acciones del servidor para obtener datos
        const statsData = await getDashboardStats();
        const clientsData = await getRecentClients();
        
        setStats(statsData);
        setClients(clientsData);
        
        setFunnelData([
          { name: 'Leads Totales', value: statsData.totalLeads, fill: '#4299E1' },
          { name: 'BANT Completado', value: statsData.qualifiedLeads, fill: '#48BB78' },
          { name: 'Requerimientos', value: statsData.completedRequirements, fill: '#ECC94B' },
          { name: 'Reuniones', value: statsData.scheduledMeetings, fill: '#F56565' }
        ]);
      } catch (error) {
        console.error('Error in fetchDashboardData:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-white/80">Resumen de actividad y métricas clave</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Leads Totales"
          value={stats.totalLeads}
          icon={<Users size={24} />}
          change={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Leads Calificados"
          value={stats.qualifiedLeads}
          icon={<BarChart4 size={24} />}
          change={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="BRDs Generados"
          value={stats.completedRequirements}
          icon={<FileText size={24} />}
          change={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Reuniones Agendadas"
          value={stats.scheduledMeetings}
          icon={<Calendar size={24} />}
          change={{ value: 2, isPositive: true }}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <FunnelChart data={funnelData} />
        <RecentClientsTable clients={clients} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
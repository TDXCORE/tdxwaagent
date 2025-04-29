'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import SettingsForm from '../../components/settings/SettingsForm';
import { getSettings, saveSettings, createDefaultSettings } from '../actions/settings';
import { toast } from 'sonner';

interface Setting {
  id: string;
  key: string;
  value: any;
  description: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        // Intentar crear configuraciones predeterminadas si no existen
        await createDefaultSettings();
        
        // Obtener configuraciones
        const settingsData = await getSettings();
        setSettings(settingsData);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Error al cargar la configuración');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSettings();
  }, []);

  const handleSaveSettings = async (updatedSettings: Setting[]) => {
    try {
      await saveSettings(updatedSettings);
      setSettings(updatedSettings);
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
      throw error;
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Configuración</h1>
        <p className="text-white/80">Personaliza el comportamiento del agente</p>
      </div>
      
      <div className="space-y-6">
        <SettingsForm
          settings={settings}
          onSave={handleSaveSettings}
          isLoading={isLoading}
        />
      </div>
    </AppLayout>
  );
}
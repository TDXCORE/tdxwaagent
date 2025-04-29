'use client';

import React, { useState } from 'react';
import Card, { CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Save } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: any;
  description: string;
}

interface SettingsFormProps {
  settings: Setting[];
  onSave: (settings: Setting[]) => Promise<void>;
  isLoading?: boolean;
}

export default function SettingsForm({ settings, onSave, isLoading = false }: SettingsFormProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>(
    settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>)
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (key: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Create updated settings array
      const updatedSettings = settings.map(setting => ({
        ...setting,
        value: formValues[setting.key]
      }));
      
      await onSave(updatedSettings);
      
      setSaveMessage({
        type: 'success',
        text: 'Configuración guardada correctamente'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      
      setSaveMessage({
        type: 'error',
        text: 'Error al guardar la configuración'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSettingInput = (setting: Setting) => {
    const value = formValues[setting.key];
    
    // Handle different types of settings
    if (typeof value === 'string' && value.length > 100) {
      // Long text - use textarea
      return (
        <textarea
          className="w-full px-4 py-2 bg-white/10 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value}
          onChange={(e) => handleChange(setting.key, e.target.value)}
          rows={6}
        />
      );
    } else if (typeof value === 'boolean') {
      // Boolean - use checkbox
      return (
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleChange(setting.key, e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span>Activado</span>
        </label>
      );
    } else if (typeof value === 'number') {
      // Number - use number input
      return (
        <input
          type="number"
          className="w-full px-4 py-2 bg-white/10 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value}
          onChange={(e) => handleChange(setting.key, parseFloat(e.target.value))}
        />
      );
    } else if (typeof value === 'object') {
      // Object - use textarea with JSON
      return (
        <textarea
          className="w-full px-4 py-2 bg-white/10 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleChange(setting.key, parsed);
            } catch (error) {
              // Allow invalid JSON during editing
              handleChange(setting.key, e.target.value);
            }
          }}
          rows={8}
        />
      );
    } else {
      // Default - use text input
      return (
        <input
          type="text"
          className="w-full px-4 py-2 bg-white/10 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value}
          onChange={(e) => handleChange(setting.key, e.target.value)}
        />
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardTitle>Configuración del Agente</CardTitle>
        <CardContent>
          <div className="space-y-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardTitle>Configuración del Agente</CardTitle>
        <CardContent>
          <div className="space-y-6">
            {settings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {setting.key}
                </label>
                <p className="text-xs text-gray-500 mb-1">{setting.description}</p>
                {renderSettingInput(setting)}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div>
              {saveMessage && (
                <p className={`text-sm ${
                  saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {saveMessage.text}
                </p>
              )}
            </div>
            <button
              type="submit"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isSaving
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              disabled={isSaving}
            >
              <Save size={18} />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
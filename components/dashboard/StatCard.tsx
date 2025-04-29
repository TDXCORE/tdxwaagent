import React from 'react';
import Card from '../ui/Card';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, icon, change }: StatCardProps) {
  return (
    <Card className="flex items-center">
      <div className="mr-4 p-3 rounded-xl bg-blue-500/10 text-blue-600">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
        
        {change && (
          <p className={`text-xs mt-1 ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}% desde el mes pasado
          </p>
        )}
      </div>
    </Card>
  );
}
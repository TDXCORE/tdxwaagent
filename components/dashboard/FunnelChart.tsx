'use client';

import React from 'react';
import { ResponsiveContainer, FunnelChart as RechartsFunnel, Funnel, LabelList, Tooltip } from 'recharts';
import Card, { CardTitle, CardContent } from '../ui/Card';

interface FunnelChartProps {
  data: {
    name: string;
    value: number;
    fill: string;
  }[];
}

export default function FunnelChart({ data }: FunnelChartProps) {
  return (
    <Card className="h-80">
      <CardTitle>Embudo de Conversión</CardTitle>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsFunnel
            width={730}
            height={250}
            data={data}
          >
            <Tooltip
              formatter={(value: number) => [`${value} clientes`, '']}
              labelFormatter={(name: string) => `Etapa: ${name}`}
            />
            <Funnel
              dataKey="value"
              nameKey="name"
              isAnimationActive
            >
              <LabelList 
                position="right" 
                fill="#fff" 
                stroke="none" 
                dataKey="name" 
                fontSize={12}
              />
              <LabelList 
                position="right" 
                fill="#fff" 
                stroke="none" 
                dataKey="value" 
                fontSize={12}
                formatter={(value: number) => `${value} clientes`}
                offset={40}
              />
            </Funnel>
          </RechartsFunnel>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
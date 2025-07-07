
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SensorReading } from '../types';

interface DynamicChartProps {
  data: SensorReading[];
}

const colors = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', 
  '#FFBB28', '#FF8042', '#d0ed57', '#a4de6c', '#8dd1e1', '#83a6ed',
  '#8e44ad', '#c0392b', '#16a085'
];

const DynamicChart: React.FC<DynamicChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full bg-slate-100 rounded-md"><p>Sem dados para exibir o gráfico.</p></div>;
  }
  
  const sensorIds = data.length > 0 && data[0].temperatures ? Object.keys(data[0].temperatures) : [];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" label={{ value: 'Tempo (minutos)', position: 'insideBottomRight', offset: -5 }} />
        <YAxis label={{ value: 'Temperatura (°C)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        {sensorIds.map((id, index) => (
          <Line 
            key={id} 
            type="monotone" 
            dataKey={`temperatures.${id}`} 
            name={id} 
            stroke={colors[index % colors.length]} 
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default DynamicChart;

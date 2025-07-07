
import React, { useState } from 'react';
import { Test, QualificationType } from '../types';
import DynamicChart from './DynamicChart';

interface TestSectionProps {
    test: Test;
    onTemperatureChange: (testId: string, timeIndex: number, sensorId: string, newValue: number) => void;
    isAutoclave: boolean;
}

const TestSection: React.FC<TestSectionProps> = ({ test, onTemperatureChange, isAutoclave }) => {
    const [showTable, setShowTable] = useState(false);
    const sensorIds = test.data.length > 0 ? Object.keys(test.data[0].temperatures) : [];

    return (
        <div id={test.id} className="p-6 bg-white rounded-lg shadow-md scroll-mt-24">
            <h3 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">{test.name}</h3>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Status" value={test.status} status={test.status} />
                <StatCard label="Temp. Média" value={`${test.stats.avgTemp?.toFixed(2) ?? 'N/A'} °C`} />
                <StatCard label="Estabilidade" value={`${test.stats.stability[sensorIds[0]]?.toFixed(2) ?? 'N/A'} °C`} />
                <StatCard label="Uniformidade" value={`${test.stats.uniformity?.toFixed(2) ?? 'N/A'} °C`} />
                {isAutoclave && <StatCard label="F₀ Mínimo" value={`${test.stats.minF0?.toFixed(2) ?? 'N/A'} min`} />}
            </div>

            {/* Chart */}
            <div id={test.chartId} className="mb-6 h-96">
                <DynamicChart data={test.data} />
            </div>

            {/* Data Table Toggle */}
            <button
                onClick={() => setShowTable(!showTable)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
            >
                {showTable ? 'Ocultar' : 'Mostrar'} Tabela de Dados Detalhados
            </button>

            {/* Data Table */}
            {showTable && (
                <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3">Tempo (min)</th>
                                {sensorIds.map(id => <th key={id} scope="col" className="px-6 py-3">{id}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {test.data.map((reading, timeIndex) => (
                                <tr key={timeIndex} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-3 font-medium text-slate-900">{reading.time}</td>
                                    {sensorIds.map(id => (
                                        <td key={id} className="px-6 py-3">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={reading.temperatures[id] ?? ''}
                                                onChange={(e) => onTemperatureChange(test.id, timeIndex, id, parseFloat(e.target.value))}
                                                className="w-20 p-1 bg-transparent border-b border-transparent focus:border-blue-500 focus:ring-0 focus:outline-none transition"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

interface StatCardProps {
    label: string;
    value: string;
    status?: 'Conforme' | 'Não Conforme' | 'N/A';
}
const StatCard: React.FC<StatCardProps> = ({ label, value, status }) => {
    const statusColor = status === 'Conforme' ? 'text-green-600' : status === 'Não Conforme' ? 'text-red-600' : 'text-slate-800';
    return (
        <div className="bg-slate-50 p-4 rounded-lg text-center">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`text-2xl font-bold ${statusColor}`}>{value}</p>
        </div>
    );
};

export default TestSection;

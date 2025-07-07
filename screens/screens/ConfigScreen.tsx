
import React from 'react';
import { useAppContext } from '../context/AppContext';
import type { ReportConfig, QualificationType } from '../types';

const InputField: React.FC<{label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string}> = ({label, name, value, onChange, className}) => (
    <div className={className}>
        <label htmlFor={name} className="block text-sm font-medium text-brand-text-secondary mb-1">{label}</label>
        <input
            type="text"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-slate-50 border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
    </div>
);

const SelectField: React.FC<{label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; className?: string}> = ({label, name, value, onChange, children, className}) => (
    <div className={className}>
        <label htmlFor={name} className="block text-sm font-medium text-brand-text-secondary mb-1">{label}</label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-slate-50 border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
            {children}
        </select>
    </div>
);


const ConfigScreen = () => {
  const { state, dispatch } = useAppContext();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'SET_CONFIG',
      payload: { [e.target.name as keyof ReportConfig]: e.target.value }
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newType = value === 'Autoclave' ? 'autoclave' : 'chamber';
    
    // Only dispatch if the core type changes, to reset defaults
    if (newType !== state.qualificationType) {
        dispatch({ type: 'SET_QUALIFICATION_TYPE', payload: newType });
    } else { // Otherwise, just update the config
        dispatch({
          type: 'SET_CONFIG',
          payload: { [name as keyof ReportConfig]: value }
        });
    }
  };

  const goToNextStep = () => {
    dispatch({ type: 'SET_STEP', payload: 'editor' });
  };
  
  const goToPreviousStep = () => {
    dispatch({ type: 'SET_STEP', payload: 'upload' });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-brand-surface rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">Configuração do Relatório</h2>
        
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold text-brand-primary mb-4">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Nome do Cliente" name="clientName" value={state.config.clientName} onChange={handleChange} className="md:col-span-2"/>
                    <InputField label="CNPJ" name="cnpj" value={state.config.cnpj} onChange={handleChange} />
                    <InputField label="Endereço" name="address" value={state.config.address} onChange={handleChange} />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-brand-primary mb-4">Detalhes do Equipamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SelectField label="Tipo de Equipamento" name="equipmentType" value={state.config.equipmentType} onChange={handleSelectChange}>
                        <option value="Câmara de Conservação">Câmara de Conservação</option>
                        <option value="Autoclave">Autoclave</option>
                    </SelectField>
                    <InputField label="Descrição" name="equipmentDescription" value={state.config.equipmentDescription} onChange={handleChange} />
                    <InputField label="Fabricante" name="manufacturer" value={state.config.manufacturer} onChange={handleChange} />
                    <InputField label="Modelo" name="model" value={state.config.model} onChange={handleChange} />
                    <InputField label="Número de Série" name="serialNumber" value={state.config.serialNumber} onChange={handleChange} />
                    <InputField label="Patrimônio" name="assetNumber" value={state.config.assetNumber} onChange={handleChange} />
                    <InputField label={state.qualificationType === 'chamber' ? "Temperatura Alvo (°C)" : "Temperatura de Esterilização (°C)"} name="targetTemperature" value={state.config.targetTemperature} onChange={handleChange} />
                </div>
            </div>

             <div>
                <h3 className="text-lg font-semibold text-brand-primary mb-4">Responsáveis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Responsável Técnico" name="technicalManager" value={state.config.technicalManager} onChange={handleChange} />
                    <InputField label="Técnico Executor" name="executingTechnician" value={state.config.executingTechnician} onChange={handleChange} />
                    <InputField label="Revisão Relatório" name="reportReviewer" value={state.config.reportReviewer} onChange={handleChange} />
                    <InputField label="Data do Relatório" name="reportDate" value={state.config.reportDate} onChange={handleChange} />
                </div>
            </div>
        </div>

        <div className="mt-8 pt-6 border-t border-brand-border flex justify-between items-center">
             <button
                onClick={goToPreviousStep}
                className="py-2 px-4 border border-brand-border text-brand-text-secondary rounded-md shadow-sm hover:bg-slate-100 transition-colors"
            >
                Voltar
            </button>
            <button
                onClick={goToNextStep}
                className="py-2 px-6 bg-brand-primary text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 transition-colors"
            >
                Ir para o Editor
            </button>
        </div>
    </div>
  );
};

export default ConfigScreen;

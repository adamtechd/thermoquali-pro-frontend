
import React, { useState, useCallback } from 'react';
import { ReportData, Test, QualificationType } from '../types';
import { updateSingleReading } from '../services/dataProcessor';
import { generatePdf } from '../services/pdfGenerator';
import { generateDocx } from '../services/docxGenerator';
import { generateExcel } from '../services/excelGenerator';
import { Icons } from '../constants';
import TestSection from '../components/TestSection';

interface EditorScreenProps {
  reportData: ReportData;
  onUpdate: <K extends keyof ReportData>(key: K, value: ReportData[K]) => void;
  onBack: () => void;
}

const EditorScreen: React.FC<EditorScreenProps> = ({ reportData, onUpdate, onBack }) => {
  const [activeSection, setActiveSection] = useState('introduction');
  const [isGenerating, setIsGenerating] = useState<'pdf' | 'docx' | 'excel' | null>(null);

  const handleTextChange = (section: keyof ReportData['sections'], value: string) => {
    onUpdate('sections', { ...reportData.sections, [section]: value });
  };
  
  const handleTestUpdate = (updatedTest: Test) => {
    const updatedTests = reportData.tests.map(t => t.id === updatedTest.id ? updatedTest : t);
    onUpdate('tests', updatedTests);
  };
  
  const handleTemperatureChange = (testId: string, timeIndex: number, sensorId: string, newValue: number) => {
      const updatedTests = updateSingleReading(reportData.tests, testId, timeIndex, sensorId, newValue, reportData.qualificationType as QualificationType);
      onUpdate('tests', updatedTests);
  };

  const handleGeneratePdf = async () => {
    setIsGenerating('pdf');
    try {
        // This function is not implemented in the new stack, so we just log
        console.log("Attempting to generate PDF with old data structure.");
        // await generatePdf(reportData);
    } catch(e) {
        console.error("Error generating PDF:", e);
        alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
    } finally {
        setIsGenerating(null);
    }
  };
  
  const handleGenerateDocx = async () => {
    setIsGenerating('docx');
    try {
        await generateDocx(reportData);
    } catch(e) {
        console.error("Error generating DOCX:", e);
        alert("Ocorreu um erro ao gerar o DOCX. Verifique o console para mais detalhes.");
    } finally {
        setIsGenerating(null);
    }
  };

  const handleGenerateExcel = async () => {
    setIsGenerating('excel');
    try {
        // The generateExcel function now expects AppState, but this component uses the legacy ReportData.
        // This feature is not supported in this legacy view.
        console.error("generateExcel is not compatible with the old ReportData structure in this component.");
        alert("A função para gerar Excel não está disponível nesta tela. Por favor, use o novo editor de relatórios.");
        // await generateExcel(reportData);
    } catch(e) {
        console.error("Error generating Excel:", e);
        alert("Ocorreu um erro ao gerar o Excel. Verifique o console para mais detalhes.");
    } finally {
        setIsGenerating(null);
    }
  };


  const navLinks = [
    { id: 'introduction', label: 'Introdução' },
    { id: 'objectives', label: 'Objetivos' },
    { id: 'responsibilities', label: 'Responsabilidades' },
    { id: 'definitions', label: 'Definições' },
    { id: 'instrumentation', label: 'Instrumentação' },
    { id: 'methodology', label: 'Metodologia' },
    ...reportData.tests.map(t => ({ id: t.id, label: t.name })),
    { id: 'conclusion', label: 'Conclusão' },
  ];

  return (
    <div className="flex min-h-screen">
      <nav className="w-64 bg-white shadow-lg p-4 fixed top-0 left-0 h-full overflow-y-auto">
        <h2 className="text-xl font-bold text-blue-700 mb-4 border-b pb-2">Seções do Relatório</h2>
        <ul>
          {navLinks.map(link => (
            <li key={link.id} className="mb-1">
              <a href={`#${link.id}`} 
                 onClick={() => setActiveSection(link.id)}
                 className={`block px-3 py-2 rounded text-sm font-medium transition-colors ${activeSection === link.id ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-6 pt-4 border-t">
            <button onClick={onBack} className="w-full text-left text-sm text-slate-600 hover:text-blue-700 font-medium">
                &larr; Voltar para Configuração
            </button>
        </div>
      </nav>

      <main className="ml-64 flex-1 p-8 bg-slate-100">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold text-slate-800">Editor de Relatório</h1>
            <div className="flex space-x-2">
                <button onClick={handleGeneratePdf} disabled={!!isGenerating} className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-all disabled:bg-red-300">
                    {isGenerating === 'pdf' ? Icons.loading : Icons.pdf}
                    <span>Gerar PDF</span>
                </button>
                <button onClick={handleGenerateDocx} disabled={!!isGenerating} className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-all disabled:bg-blue-300">
                    {isGenerating === 'docx' ? Icons.loading : Icons.word}
                    <span>Gerar Word</span>
                </button>
                 <button onClick={handleGenerateExcel} disabled={!!isGenerating} className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-all disabled:bg-green-300">
                    {isGenerating === 'excel' ? Icons.loading : Icons.excel}
                    <span>Gerar Excel</span>
                </button>
            </div>
        </header>

        <div className="space-y-8">
            <CustomTextSection id="introduction" title="Introdução" content={reportData.sections.introduction} onChange={(val) => handleTextChange('introduction', val)} />
            <CustomTextSection id="objectives" title="Objetivos" content={reportData.sections.objectives} onChange={(val) => handleTextChange('objectives', val)} />
            <CustomTextSection id="responsibilities" title="Responsabilidades" content={reportData.sections.responsibilities} onChange={(val) => handleTextChange('responsibilities', val)} />
            <CustomTextSection id="definitions" title="Definições e Terminologias" content={reportData.sections.definitions} onChange={(val) => handleTextChange('definitions', val)} />
            <CustomTextSection id="instrumentation" title="Instrumentação Utilizada" content={reportData.sections.instrumentation} onChange={(val) => handleTextChange('instrumentation', val)} />
            <CustomTextSection id="methodology" title="Metodologia Aplicada" content={reportData.sections.methodology} onChange={(val) => handleTextChange('methodology', val)} />

            {reportData.tests.map(test => (
              <TestSection 
                key={test.id} 
                test={test}
                onTemperatureChange={handleTemperatureChange}
                isAutoclave={reportData.qualificationType === QualificationType.AUTOCLAVE}
              />
            ))}

            <CustomTextSection id="conclusion" title="Conclusão" content={reportData.sections.conclusion} onChange={(val) => handleTextChange('conclusion', val)} />
        </div>
      </main>
    </div>
  );
};

interface TextSectionProps {
    id: string;
    title: string;
    content: string;
    onChange: (value: string) => void;
}

const CustomTextSection: React.FC<TextSectionProps> = ({ id, title, content, onChange }) => (
    <div id={id} className="p-6 bg-white rounded-lg shadow-md scroll-mt-24">
      <h3 className="text-xl font-semibold text-slate-700 border-b pb-2 mb-4">{title}</h3>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-48 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-slate-600 leading-relaxed"
      />
    </div>
);

export default EditorScreen;

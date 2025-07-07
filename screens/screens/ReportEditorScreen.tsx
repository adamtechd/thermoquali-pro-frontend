
import React, { FC, useCallback, useState, useRef, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ConfigIcon, ImageIcon, PdfIcon, DownloadIcon, SpinnerIcon, WordIcon } from '../components/icons';
import type { ReportTextBlocks, TestResult, SensorDataRow } from '../types';
import { useDropzone } from 'react-dropzone';
import { generatePdf } from '../services/pdfGenerator';
import { generateWord } from '../services/wordGenerator';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const ImageDropzone: React.FC<{
  onImageDrop: (base64: string) => void;
  imagePreview: string | null;
  promptText: string;
  className?: string;
}> = ({ onImageDrop, imagePreview, promptText, className }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageDrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.svg'] },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`p-4 border-2 border-dashed rounded-lg cursor-pointer text-center min-h-[150px] flex flex-col justify-center items-center transition-colors ${
        isDragActive ? 'border-brand-primary bg-blue-50' : 'border-brand-border hover:border-brand-primary/50'
      } ${className}`}
    >
      <input {...getInputProps()} />
      {imagePreview && imagePreview.startsWith('data:image') ? (
        <img src={imagePreview} alt="Preview" className="max-h-48 w-auto rounded object-contain" />
      ) : (
        <div className="text-brand-text-secondary">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-brand-secondary" />
          <p className="text-sm">{promptText}</p>
        </div>
      )}
    </div>
  );
};

const EditableTextBlock: FC<{ title: string; contentKey: keyof ReportTextBlocks; id: string; rows?: number }> = ({ title, contentKey, id, rows = 7 }) => {
    const { state, dispatch } = useAppContext();
    const content = state.textBlocks[contentKey];

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch({ type: 'SET_TEXT_BLOCK', payload: { key: contentKey, value: e.target.value } });
    };

    return (
        <section id={id} className="bg-brand-surface rounded-xl shadow-md p-6 print-section">
            <h3 className="text-xl font-bold text-brand-primary mb-4 border-b border-brand-border pb-2">{title}</h3>
            <textarea
                value={content}
                onChange={handleChange}
                rows={rows}
                className="w-full bg-slate-50 border border-brand-border rounded-md p-3 text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
        </section>
    );
};

const IdentificationSection: FC = () => {
    const { state } = useAppContext();
    const { config } = state;
    
    const InfoItem: FC<{label:string, value:string}> = ({label, value}) => (
        <div className="bg-slate-50 p-3 rounded-md">
            <p className="text-sm text-brand-text-secondary">{label}</p>
            <p className="font-semibold text-brand-text-primary">{value}</p>
        </div>
    );

    return (
        <section id="Identificação" className="bg-brand-surface rounded-xl shadow-md p-6 print-section">
            <h2 className="text-2xl font-bold text-brand-primary col-span-full mb-4 border-b border-brand-border pb-2">1. Identificação do Equipamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoItem label="Cliente" value={config.clientName} />
                <InfoItem label="Endereço" value={config.address} />
                <InfoItem label="CNPJ" value={config.cnpj} />
                <InfoItem label="Descrição" value={config.equipmentDescription} />
                <InfoItem label="Fabricante" value={config.manufacturer} />
                <InfoItem label="Modelo" value={config.model} />
                <InfoItem label="N° de Série" value={config.serialNumber} />
                <InfoItem label="Patrimônio" value={config.assetNumber} />
            </div>
        </section>
    );
};


const DataTable: FC<{ rows: SensorDataRow[], testIndex: number }> = ({ rows, testIndex }) => {
    const { dispatch } = useAppContext();
    const columns = rows.length > 0 ? Object.keys(rows[0]).filter(key => key !== 'timestamp') : [];

    const handleCellChange = (rowIndex: number, columnId: string, value: string) => {
        dispatch({ type: 'UPDATE_CELL', payload: { testIndex, rowIndex, columnId, value } });
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-brand-border">
            <table className="min-w-full text-sm text-left text-brand-text-secondary">
                <thead className="text-xs text-brand-text-primary uppercase bg-slate-100">
                    <tr>
                        {columns.map(col => <th key={col} className="px-4 py-3 font-semibold">{col}</th>)}
                    </tr>
                </thead>
                <tbody className="bg-brand-surface">
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-brand-border last:border-b-0 hover:bg-slate-50">
                            {columns.map(col => (
                                <td key={`${rowIndex}-${col}`} className="px-4 py-2">
                                    {col.startsWith('T') && !col.startsWith('Tempo') ? (
                                        <input 
                                            type="number"
                                            value={row[col]}
                                            onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                                            className="w-20 bg-transparent rounded-md p-1 focus:bg-white focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary text-brand-text-primary text-center"
                                        />
                                    ) : (
                                        <span className={col === 'Máxima' ? 'text-red-500 font-semibold' : col === 'Mínima' ? 'text-blue-500 font-semibold' : ''}>{row[col]}</span>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const TestEditableField: FC<{ testIndex: number, fieldKey: keyof TestResult, title: string, rows?: number }> = ({ testIndex, fieldKey, title, rows=5}) => {
    const { state, dispatch } = useAppContext();
    const value = state.tests[testIndex][fieldKey] as string;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch({ type: 'UPDATE_TEST_DETAILS', payload: { testIndex, key: fieldKey, value: e.target.value } });
    };

    return (
        <div>
            <h4 className="text-lg font-semibold text-brand-text-primary mb-2">{title}</h4>
            <textarea
                value={value}
                onChange={handleChange}
                rows={rows}
                className="w-full bg-slate-50 border border-brand-border rounded-md p-3 text-sm text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
        </div>
    )
}

const TestSection: FC<{ test: TestResult; testNumber: number }> = ({ test, testNumber }) => {
    const { state, dispatch } = useAppContext();
    const sensorKeys = test.chartData.length > 0 ? Object.keys(test.chartData[0]).filter(k => k.startsWith('T')) : [];
    const sensorColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#387908', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A42A00', '#E31A1C', '#FDBF6F', '#FF7F00', '#CAB2D6', '#666666', '#B15928'];

    return (
        <section id={`test-${testNumber}`} className="space-y-6 print-section mb-8">
            <div className="bg-brand-surface rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-brand-primary mb-4 border-b border-brand-border pb-2">{`9.${testNumber} ${test.name}`}</h3>
                
                <div className="space-y-6">
                    <TestEditableField testIndex={testNumber-1} fieldKey="description" title={`9.${testNumber}.1 Descrição do Ensaio`} />
                    <TestEditableField testIndex={testNumber-1} fieldKey="cycleInfo" title={`9.${testNumber}.2 Ciclos Ensaidos`} rows={3} />
                    
                    {testNumber === 1 && (
                         <div>
                            <h4 className="text-lg font-semibold text-brand-text-primary mb-2">Posicionamento dos Sensores</h4>
                            <p className="text-sm text-brand-text-secondary mb-4">A distribuição das cargas e dos sensores no equipamento está explicitada nos esquemáticos e fotos abaixo.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <ImageDropzone
                                    onImageDrop={(base64) => dispatch({ type: 'SET_TECHNICAL_DRAWING_IMAGE', payload: base64 })}
                                    imagePreview={state.technicalDrawingImage}
                                    promptText="Desenho Técnico"
                                />
                                <ImageDropzone
                                    onImageDrop={(base64) => dispatch({ type: 'SET_EQUIPMENT_IMAGE', payload: base64 })}
                                    imagePreview={state.equipmentImage}
                                    promptText="Imagem do Equipamento"
                                />
                            </div>
                        </div>
                    )}

                    <TestEditableField testIndex={testNumber-1} fieldKey="methodology" title="Metodologia" />
                    <TestEditableField testIndex={testNumber-1} fieldKey="acceptanceCriteria" title="Critério de Aceitação" />
                    <TestEditableField testIndex={testNumber-1} fieldKey="results" title={`9.${testNumber}.3 Resultados`} rows={2} />

                    {state.qualificationType === 'autoclave' && test.summary.f0 !== undefined && test.f0Results && test.f0Results.length > 0 && (
                        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-brand-border">
                            <h4 className="text-lg font-semibold text-brand-text-primary mb-3">Resultados de Letalidade (F0)</h4>
                            <div className="flex items-center flex-wrap gap-4 p-3 mb-4 rounded-md bg-white shadow-sm">
                                <div className="font-bold text-brand-text-secondary">F0 Mínimo:</div>
                                <div className={`text-2xl font-bold ${test.summary.f0 >= 15 ? 'text-green-600' : 'text-red-600'}`}>
                                    {test.summary.f0.toFixed(2)} min
                                </div>
                                <div className={`px-3 py-1 text-sm font-semibold rounded-full ${test.summary.status === 'Conforme' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {test.summary.status}
                                </div>
                            </div>
                            <h5 className="font-semibold text-brand-text-secondary mb-2">Valores F0 por Sensor:</h5>
                            <div className="overflow-y-auto rounded-lg border border-brand-border max-h-60">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-200 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold text-brand-text-primary">Sensor</th>
                                            <th className="px-4 py-2 text-right font-semibold text-brand-text-primary">Valor F0 (min)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-brand-surface">
                                        {test.f0Results.map(res => (
                                            <tr key={res.sensor} className="border-b border-brand-border last:border-b-0">
                                                <td className="px-4 py-2 text-brand-text-secondary">{`Sensor ${res.sensor.substring(1)}`}</td>
                                                <td className="px-4 py-2 text-right font-semibold text-brand-text-primary">{res.f0.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>


                <div id={`chart-test-${testNumber - 1}`} className="w-full h-96 bg-white p-4 rounded-lg mt-6">
                    <ResponsiveContainer>
                        <AreaChart data={test.chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748B' }} tickLine={{ stroke: '#CBD5E1' }} />
                            <YAxis tick={{ fill: '#64748B' }} tickLine={{ stroke: '#CBD5E1' }} domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '0.5rem' }}/>
                            <Legend />
                            {sensorKeys.map((key, index) => (
                                <Area key={key} type="monotone" dataKey={key} stroke={sensorColors[index % sensorColors.length]} fill={sensorColors[index % sensorColors.length]} fillOpacity={0.1} strokeWidth={2} name={`Sensor ${key.substring(1)}`} />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-6">
                    <h4 className="text-lg font-semibold text-brand-text-primary mb-4">9.{testNumber}.4 Anexos - Dados Tabulados</h4>
                    <DataTable rows={test.rawData} testIndex={testNumber-1} />
                </div>
            </div>
        </section>
    );
}

const CertificateUploadSection: FC = () => {
    const { state, dispatch } = useAppContext();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            dispatch({ type: 'SET_CALIBRATION_CERTIFICATE', payload: file });
        }
    }, [dispatch]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false
    });

    return (
        <section id="anexo-certificado" className="bg-brand-surface rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-brand-primary mb-4">Anexo A: Certificado de Calibração</h3>
             <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg cursor-pointer text-center flex flex-col justify-center items-center transition-colors ${isDragActive ? 'border-brand-primary bg-blue-50' : 'border-brand-border hover:border-brand-primary/50'}`}>
                <input {...getInputProps()} />
                <div className="text-brand-text-secondary">
                    <PdfIcon className="w-12 h-12 mx-auto mb-2 text-brand-secondary" />
                    {state.calibrationCertificate ? (
                        <p>Arquivo selecionado: <span className="font-semibold text-brand-text-primary">{state.calibrationCertificate.name}</span></p>
                    ) : (
                        <p>Arraste o PDF do certificado de calibração aqui, ou clique para selecionar.</p>
                    )}
                </div>
            </div>
        </section>
    );
}


const ReportContent: FC = () => {
    const { state, dispatch } = useAppContext();
    return (
        <div className="space-y-8">
             <section id="company-logo" className="bg-brand-surface rounded-xl shadow-md p-6 print-section">
                <h3 className="text-xl font-bold text-brand-primary mb-4 border-b border-brand-border pb-2">Logo da Empresa (para a Capa)</h3>
                <ImageDropzone
                    onImageDrop={(base64) => dispatch({ type: 'SET_COMPANY_LOGO', payload: base64 })}
                    imagePreview={state.companyLogo}
                    promptText="Arraste o logo ou clique para selecionar."
                />
            </section>
            <section id="sumario" className="bg-brand-surface rounded-xl shadow-md p-6 print-section">
                <h3 className="text-xl font-bold text-brand-primary mb-4 border-b border-brand-border pb-2">Sumário</h3>
                <p className="text-brand-text-secondary">O sumário será gerado automaticamente no PDF final com base nas seções abaixo.</p>
            </section>
            <IdentificationSection />
            <EditableTextBlock id="Introdução" title="2. Introdução" contentKey="introduction" />
            <EditableTextBlock id="Objetivos" title="3. Objetivos" contentKey="objectives" />
            <EditableTextBlock id="Responsabilidades" title="4. Responsabilidades" contentKey="responsibilities" rows={10}/>
            <EditableTextBlock id="Definições" title="5. Definição dos Termos" contentKey="termDefinitions" />
            <EditableTextBlock id="Ciclos" title="6. Configuração dos Ciclos" contentKey="cycleConfig" />
            <EditableTextBlock id="Instrumentação" title="7. Instrumentação" contentKey="instrumentation" rows={12}/>
            
             <section id="relacao-ensaios" className="bg-brand-surface rounded-xl shadow-md p-6 print-section">
                <h3 className="text-xl font-bold text-brand-primary mb-4 border-b border-brand-border pb-2">8. Relação dos Ensaios Realizados</h3>
                 <p className="text-brand-text-secondary">Este campo é gerado automaticamente com base nos dados carregados.</p>
                <ul className="list-disc list-inside text-brand-text-secondary mt-4 bg-slate-50 p-3 rounded-md">
                    {state.tests.map((test, i) => <li key={i}>{test.name}</li>)}
                </ul>
            </section>

            <section id="Resultados">
                 <h2 className="text-2xl font-bold text-brand-text-primary mb-4">9. Ensaios</h2>
                 {state.tests.map((test, index) => (
                    <TestSection key={index} test={test} testNumber={index+1} />
                ))}
            </section>
           
            <EditableTextBlock id="Conclusão" title="10. Conclusão" contentKey="conclusion" />

            <section id="responsaveis" className="bg-brand-surface rounded-xl shadow-md p-6 print-section">
                <h3 className="text-xl font-bold text-brand-primary mb-4 border-b border-brand-border pb-2">11. Responsáveis Técnicos</h3>
                <p className="text-brand-text-secondary">Os nomes dos responsáveis são configurados na tela anterior. As assinaturas serão adicionadas no PDF final.</p>
            </section>
            <CertificateUploadSection />
        </div>
    );
};

const Sidebar: FC = () => {
    const { state, dispatch } = useAppContext();
    
    const handleGeneratePdf = async () => {
      dispatch({ type: 'SET_GENERATING_PDF', payload: true });
      try {
        await generatePdf(state);
      } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
      } finally {
        dispatch({ type: 'SET_GENERATING_PDF', payload: false });
      }
    };

    const handleGenerateWord = async () => {
      dispatch({ type: 'SET_GENERATING_WORD', payload: true });
      try {
        await generateWord(state);
      } catch (error) {
        console.error("Failed to generate Word document:", error);
        alert("Ocorreu um erro ao gerar o documento Word. Verifique o console para mais detalhes.");
      } finally {
        dispatch({ type: 'SET_GENERATING_WORD', payload: false });
      }
    };
    
    const navItems = [
        { id: 'company-logo', label: "Logo da Empresa", section: '☆'},
        { id: 'sumario', label: 'Sumário', section: 'i' },
        { id: 'Identificação', label: 'Identificação', section: '1' },
        { id: 'Introdução', label: 'Introdução', section: '2' },
        { id: 'Objetivos', label: 'Objetivos', section: '3' },
        { id: 'Responsabilidades', label: 'Responsabilidades', section: '4' },
        { id: 'Definições', label: 'Definição dos Termos', section: '5' },
        { id: 'Ciclos', label: 'Configuração dos Ciclos', section: '6' },
        { id: 'Instrumentação', label: 'Instrumentação', section: '7' },
        { id: 'relacao-ensaios', label: 'Relação dos Ensaios', section: '8' },
        { id: 'Resultados', label: 'Ensaios', section: '9' },
        ...state.tests.map((test, index) => ({
            id: `test-${index + 1}`,
            label: test.name,
            section: `9.${index + 1}`,
        })),
        { id: 'Conclusão', label: 'Conclusão', section: '10' },
        { id: 'responsaveis', label: 'Responsáveis Técnicos', section: '11' },
        { id: 'anexo-certificado', label: 'Anexo: Certificado', section: 'A' },
    ];
    
    const [activeId, setActiveId] = useState(navItems[0].id);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveId(entry.target.id);
                }
            });
        }, { rootMargin: "-50% 0px -50% 0px" });

        navItems.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });

        return () => {
            navItems.forEach(item => {
                const el = document.getElementById(item.id);
                if (el) observer.unobserve(el);
            });
        };
    }, [state.tests.length]);


    const handleGoBack = () => {
        dispatch({ type: 'SET_STEP', payload: 'config' });
    }

    const isGenerating = state.isGeneratingPdf || state.isGeneratingWord;

    return (
        <div className="w-full md:w-64 bg-brand-surface p-4 rounded-xl shadow-md flex flex-col h-full sticky top-8">
            <h2 className="text-lg font-bold mb-4 text-brand-text-primary px-3">Seções do Relatório</h2>
            <nav className="flex-grow">
                <ul>
                    {navItems.map(item => (
                        <li key={item.id} className="mb-1">
                             <a href={`#${item.id}`} 
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors 
                                ${item.label.startsWith('Ensaio') ? 'pl-8' : ''}
                                ${activeId === item.id ? 'bg-blue-100 text-brand-primary' : 'text-brand-text-secondary hover:bg-slate-100'}`}
                              >
                                <span className="font-bold w-10 text-right pr-2">{item.section}</span>
                                <span className="flex-1">{item.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="mt-4 pt-4 border-t border-brand-border space-y-2">
                 <button onClick={handleGoBack} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-brand-border text-brand-text-secondary hover:bg-slate-100 disabled:opacity-50">
                    <ConfigIcon className="w-5 h-5"/>
                    <span>Voltar à Configuração</span>
                </button>
                <button 
                    onClick={handleGenerateWord} 
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                    {state.isGeneratingWord ? (
                        <>
                            <SpinnerIcon className="w-5 h-5" />
                            <span>Gerando Word...</span>
                        </>
                    ) : (
                        <>
                            <WordIcon className="w-5 h-5"/>
                            <span>Gerar Relatório Word</span>
                        </>
                    )}
                </button>
                <button 
                    onClick={handleGeneratePdf} 
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-brand-primary text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                    {state.isGeneratingPdf ? (
                        <>
                            <SpinnerIcon className="w-5 h-5" />
                            <span>Gerando PDF...</span>
                        </>
                    ) : (
                        <>
                            <PdfIcon className="w-5 h-5"/>
                            <span>Gerar Relatório PDF</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

const ReportEditorScreen = () => {
    return (
        <HashRouter>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-64 flex-shrink-0">
                    <Sidebar />
                </aside>
                <main className="flex-grow min-w-0">
                    <ReportContent />
                </main>
            </div>
        </HashRouter>
    );
};

export default ReportEditorScreen;

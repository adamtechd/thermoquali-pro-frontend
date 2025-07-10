import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppContext } from '../context/AppContext';
import type { RawArkmedsData, QualificationType } from '../types';
import { QualificationType as QualificationTypeEnum } from '../types';
import { UploadIcon, SpinnerIcon, ChamberIcon, AutoclaveIcon } from '../components/icons';

declare const XLSX: any; // From script tag

const parseCsvData = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index].trim();
            return obj;
        }, {} as {[key: string]: string});
    });
    return data;
};

const parseArkmedsJsonToStandardFormat = (data: RawArkmedsData): RawArkmedsData => {
    // This function assumes the JSON is already in the standard `RawArkmedsData` format.
    // It's a placeholder for any future normalization if needed.
    return data;
}

const UploadScreen = () => {
  const { state, dispatch } = useAppContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<QualificationType | null>(null);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});

  const chamberTests = {
      study24h: "1. Ensaio de Distribuição Térmica (24 horas)",
      doorOpen: "2. Ensaio de Porta Aberta",
      powerOutage: "3. Ensaio de Queda de Energia"
  };

  const autoclaveTests = {
      bowieDick: "1. Ensaio de Penetração de Vapor (Bowie-Dick)",
      cycle121: "2. Ciclo de Esterilização 121°C",
      cycle134: "3. Ciclo de Esterilização 134°C",
      biological: "4. Ensaio com Indicador Biológico"
  };

  const currentTests = selectedType === QualificationTypeEnum.CHAMBER ? chamberTests : autoclaveTests;

  const handleSelectType = (type: QualificationType) => {
    setSelectedType(type);
    setFiles({}); // Reset files when type changes
    setError(null);
    dispatch({ type: 'SET_QUALIFICATION_TYPE', payload: type });
  };

  const onDrop = useCallback((acceptedFiles: File[], fileKey: string) => {
    if (acceptedFiles.length > 0) {
      setFiles(prevFiles => ({
        ...prevFiles,
        [fileKey]: acceptedFiles[0],
      }));
      setError(null);
    }
  }, []);

  const FileDropzone = ({ fileKey, title }: { fileKey: string, title: string }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (accepted) => onDrop(accepted, fileKey),
      accept: { 
        'application/json': ['.json'],
        'text/csv': ['.csv'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
       },
      multiple: false,
    });
    const file = files[fileKey];
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold text-brand-text-primary mb-3">{title}</h3>
        <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 flex items-center justify-center text-center h-24 ${isDragActive ? 'border-brand-primary bg-blue-50' : 'border-brand-border hover:border-brand-primary hover:bg-slate-50'}`}>
          <input {...getInputProps()} />
          <div className="flex items-center gap-3 text-brand-text-secondary">
            <UploadIcon className="w-8 h-8 text-brand-secondary flex-shrink-0" />
            {file ? (
              <p className="text-sm font-medium text-brand-text-primary break-all">{file.name}</p>
            ) : isDragActive ? (
              <p className="text-sm">Solte o arquivo aqui...</p>
            ) : (
              <p className="text-sm">Arraste e solte ou clique para selecionar</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const readFile = (file: File): Promise<{fileData: any, type: string}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const fileType = file.name.split('.').pop()?.toLowerCase();
      
      reader.onload = () => {
        try {
          if (fileType === 'json') {
            const data = JSON.parse(reader.result as string);
             if (!data || !data.serial_number || !Array.isArray(data.configurations) || data.configurations.length === 0) {
              throw new Error(`Estrutura do JSON inválida em ${file.name}.`);
            }
             if (!data.configurations.every((c: any) => c.cycles && c.cycles.length > 0 && c.cycles[0].measures)) {
                throw new Error(`Configuração sem medições encontrada em ${file.name}.`);
            }
            resolve({ fileData: data, type: 'json' });
          } else if (fileType === 'xlsx') {
             // For xlsx, we use the ArrayBuffer result
            const workbook = XLSX.read(reader.result, { type: 'arraybuffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            // This is a basic conversion, more complex logic might be needed
            // For now, let's assume it's just raw data and will be processed later.
            // A more robust solution would convert this to RawArkmedsData format here.
            resolve({ fileData: jsonData, type: 'xlsx' });
          } else { // CSV
            resolve({ fileData: reader.result as string, type: 'csv' });
          }
        } catch (e: any) {
           reject(new Error(`Erro ao processar ${file.name}: ${e.message}`));
        }
      };
      reader.onerror = () => reject(new Error(`Falha ao ler o arquivo ${file.name}`));
      
      if (fileType === 'xlsx') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleProcessFiles = async () => {
    if (!selectedType) return;
    setError(null);
    setIsLoading(true);

    const fileList = Object.values(files).filter(f => f !== null) as File[];

    try {
      const parsedData = await Promise.all(fileList.map(readFile));

      // For now, we only support the Arkmeds JSON format for automatic processing.
      // CSV/XLSX would require a dedicated mapping/parsing step which is not fully defined.
      // We will only pass JSON files to the LOAD_DATA reducer.
      const jsonFiles = parsedData.filter(d => d.type === 'json').map(d => d.fileData as RawArkmedsData);

      dispatch({ type: 'LOAD_DATA', payload: { rawJsonDataArray: jsonFiles } });
      dispatch({ type: 'SET_STEP', payload: 'config' });

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl text-center bg-brand-surface p-8 sm:p-12 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold mb-2 text-brand-text-primary">Sistema de Geração de Relatórios</h2>
        <p className="text-lg text-brand-text-secondary mb-8">
            {selectedType ? `Importe os arquivos de dados (.json, .csv, .xlsx) para cada ensaio ou prossiga para iniciar com um modelo.` : 'Selecione o tipo de equipamento para a qualificação.'}
        </p>
        
        {!selectedType ? (
            <div className="grid md:grid-cols-2 gap-6">
                <button onClick={() => handleSelectType(QualificationTypeEnum.CHAMBER)} className="group p-8 border-2 border-brand-border rounded-lg hover:border-brand-primary hover:bg-blue-50 transition-all duration-300 transform hover:scale-105">
                    <ChamberIcon className="w-16 h-16 mx-auto text-brand-secondary group-hover:text-brand-primary transition-colors"/>
                    <h3 className="text-xl font-bold mt-4 text-brand-text-primary">Câmara Fria</h3>
                    <p className="text-sm text-brand-text-secondary mt-1">NBR 16328 / RDC 430/2020</p>
                </button>
                 <button onClick={() => handleSelectType(QualificationTypeEnum.AUTOCLAVE)} className="group p-8 border-2 border-brand-border rounded-lg hover:border-brand-primary hover:bg-blue-50 transition-all duration-300 transform hover:scale-105">
                    <AutoclaveIcon className="w-16 h-16 mx-auto text-brand-secondary group-hover:text-brand-primary transition-colors"/>
                    <h3 className="text-xl font-bold mt-4 text-brand-text-primary">Autoclave</h3>
                    <p className="text-sm text-brand-text-secondary mt-1">RDC 15/2012 / ISO 17665</p>
                </button>
            </div>
        ) : (
            <>
            <div className="space-y-6 mb-8 text-left">
                {Object.entries(currentTests).map(([key, title]) => (
                    <FileDropzone key={key} fileKey={key} title={title} />
                ))}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                    onClick={() => setSelectedType(null)}
                    className="py-3 px-6 border border-brand-border text-brand-text-secondary rounded-md shadow-sm hover:bg-slate-100 transition-colors"
                >
                    Voltar e trocar tipo
                </button>
                <button
                onClick={handleProcessFiles}
                disabled={!selectedType || isLoading}
                className="w-full max-w-xs flex items-center justify-center gap-3 py-3 px-6 bg-brand-primary text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                {isLoading ? (
                    <>
                    <SpinnerIcon className="w-5 h-5" />
                    <span>Processando...</span>
                    </>
                ) : (
                    <span>Processar e Iniciar</span>
                )}
                </button>
            </div>
            </>
        )}

        {error && <p className="mt-6 text-red-600 bg-red-100 p-3 rounded-md border border-red-200">{error}</p>}
      </div>
    </div>
  );
};

export default UploadScreen;

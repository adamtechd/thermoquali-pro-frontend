// thermocert-api/src/services/dataProcessor.ts
import type { RawArkmedsData, SensorDataRow } from '../types';

/**
 * Converte dados de CSV/XLSX (Array de Arrays) para RawArkmedsData.
 * Procura a linha de cabeçalho real dinamicamente e melhora o parsing de data/hora.
 */
export const processCsvOrXlsxToArkmedsData = (
  rawData: any[][], // Agora sempre Array<Array<any>>
  fileName: string
): RawArkmedsData => {
  let headerRowIndex = -1;
  let headers: string[] = [];

  // 1. Encontrar a linha de cabeçalho real procurando por "Index", "Time" e um sensor (CHxx ou Sxx)
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    // Garante que a célula é string antes de chamar trim()
    if (row && row.length > 0 && 
        row.some(cell => typeof cell === 'string' && cell.trim().toLowerCase() === 'index') && 
        row.some(cell => typeof cell === 'string' && cell.trim().toLowerCase() === 'time') &&   
        row.some(cell => typeof cell === 'string' && (cell.trim().toLowerCase().startsWith('ch') || cell.trim().toLowerCase().startsWith('s')))) { 
      headers = row.map(h => (h || '').trim()); // Protege trim()
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(`Formato de arquivo inválido para ${fileName}. Não foi possível encontrar a linha de cabeçalho esperada (com 'Index', 'Time' e 'CHxx/Sxx').`);
  }

  const dataRows = rawData.slice(headerRowIndex + 1);

  const timeHeader = headers.find(h => h.toLowerCase().includes('time') || h.toLowerCase().includes('tempo'));
  const sensorHeaders = headers.filter(h => h.toLowerCase().startsWith('ch') || h.toLowerCase().startsWith('s'));

  if (!timeHeader || sensorHeaders.length === 0) {
    throw new Error(`Erro interno: Colunas de tempo ou sensores não encontradas após identificar cabeçalho em ${fileName}.`);
  }

  const measures: { [key: string]: any }[] = [];
  const timeIndex = headers.indexOf(timeHeader);

  dataRows.forEach((row: any[], rowIndex: number) => {
    // Pular linhas completamente vazias
    if (row.every(cell => !cell || (typeof cell === 'string' && cell.trim() === ''))) {
      return;
    }

    // Pular linhas se o campo de tempo não existir ou estiver vazio
    if (timeIndex === -1 || !row[timeIndex] || String(row[timeIndex]).trim() === '') {
        console.warn(`[WARN] Linha ${headerRowIndex + 2 + rowIndex} em ${fileName} ignorada: campo de tempo vazio ou ausente.`);
        return;
    }

    let timeValue = String(row[timeIndex]).trim();
    let timestamp: number;

    const parseDateWithFormat = (dateStr: string): Date | null => {
        let date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date;
        const parts = dateStr.match(/(\d{2})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (parts) {
            const [, day, month, year, hours, minutes, seconds] = parts.map(Number);
            const fullYear = year < 70 ? 2000 + year : 1900 + year;
            return new Date(fullYear, month - 1, day, hours, minutes, seconds);
        }
        const excelDate = parseFloat(dateStr);
        if(!isNaN(excelDate)){
            const dateFromExcel = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
            if (!isNaN(dateFromExcel.getTime())) return dateFromExcel;
        }
        return null;
    };

    const parsedDate = parseDateWithFormat(timeValue);

    if (parsedDate && !isNaN(parsedDate.getTime())) {
        timestamp = Math.floor(parsedDate.getTime() / 1000); 
    } else {
        console.warn(`[WARN] Formato de tempo inválido na linha ${headerRowIndex + 2 + rowIndex} de ${fileName}: "${timeValue}". Linha ignorada.`);
        return; 
    }
    
    const measureEntry: { [key: string]: any } = { timestamp: timestamp };

    sensorHeaders.forEach((sensorHeader: string, index: number) => {
      const sensorColIndex = headers.indexOf(sensorHeader);
      let sensorValue = '';
      if (sensorColIndex !== -1 && row[sensorColIndex] !== undefined && row[sensorColIndex] !== null) { 
        sensorValue = String(row[sensorColIndex]).trim(); 
      }
      
      const parsedValue = parseFloat(sensorValue);
      measureEntry[`sensor${index + 1}`] = isNaN(parsedValue) ? 0 : parsedValue; 
    });
    measures.push(measureEntry);
  });

  if (measures.length === 0) {
    throw new Error(`Nenhum dado de medição válido encontrado em ${fileName} após processamento. Verifique o conteúdo do arquivo.`);
  }

  const arkmedsSensors = sensorHeaders.map((_h: string, index: number) => `sensor${index + 1}`);

  return {
    status: 'parsed',
    serial_number: `FROM_${fileName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_${Date.now()}`, 
    configurations: [
      {
        duration: measures.length > 1 ? measures[measures.length - 1].timestamp - measures[0].timestamp : 0,
        material: fileName, 
        cycles: [
          {
            begin: measures[0]?.timestamp || 0,
            end: measures[measures.length - 1]?.timestamp || 0,
            numberOfSensors: arkmedsSensors.length,
            measures: measures,
            numberOfPoints: measures.length,
            sensors: arkmedsSensors,
          },
        ],
        temperature: 'N/A', 
      },
    ],
  };
};

export const normalizeRawArkmedsData = (dataArray: RawArkmedsData[]): RawArkmedsData[] => {
  return dataArray.map(data => ({
    ...data,
    configurations: data.configurations || [],
    serial_number: data.serial_number || 'N/A',
    configurations: data.configurations.map(config => ({
      ...config,
      cycles: config.cycles.map(cycle => ({
        ...cycle,
        measures: cycle.measures || [],
        sensors: cycle.sensors || [],
        numberOfSensors: cycle.numberOfSensors || cycle.sensors.length,
        numberOfPoints: cycle.numberOfPoints || cycle.measures.length,
      }))
    }))
  }));
};
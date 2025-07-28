// thermocert-pro/src/services/dataProcessor.ts
import type { RawArkmedsData, SensorDataRow } from '../types';

/**
 * Converte dados de CSV/XLSX (Array de Arrays) para RawArkmedsData.
 * Assume que o CSV/XLSX contém dados de sensores para um único ciclo.
 * Procura a linha de cabeçalho real dinamicamente e melhora o parsing de data/hora.
 */
export const processCsvOrXlsxToArkmedsData = (
  rawData: string[][], // Agora sempre Array<Array<string>>
  fileName: string
): RawArkmedsData => {
  let headerRowIndex = -1;
  let headers: string[] = [];

  // 1. Encontrar a linha de cabeçalho real procurando por "Index", "Time" e um sensor (CHxx ou Sxx)
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (row && row.length > 0 && 
        row.some(cell => typeof cell === 'string' && cell.trim().toLowerCase() === 'index') && // Procura por 'Index'
        row.some(cell => typeof cell === 'string' && cell.trim().toLowerCase() === 'time') &&   // Procura por 'Time'
        row.some(cell => typeof cell === 'string' && (cell.trim().toLowerCase().startsWith('ch') || cell.trim().toLowerCase().startsWith('s')))) { // Procura por CHxx ou Sxx
      headers = row.map(h => h.trim());
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

  dataRows.forEach((row: string[], rowIndex: number) => {
    // Pular linhas completamente vazias ou linhas que parecem ser cabeçalhos secundários
    if (row.every(cell => !cell || cell.trim() === '')) {
      return;
    }

    // Pular linhas que podem ser rodapés ou dados incompletos (ex: se não tiver o campo de tempo)
    if (timeIndex === -1 || !row[timeIndex] || row[timeIndex].trim() === '') {
        console.warn(`[WARN] Linha ${headerRowIndex + 2 + rowIndex} em ${fileName} ignorada: campo de tempo vazio ou ausente.`);
        return;
    }

    let timeValue = row[timeIndex].trim();
    let timestamp: number;

    // Melhoria no parsing de data/hora: DD-MM-YY HH:MM:SS
    // Ex: "25-07-25 01:07:34"
    const parseDateWithFormat = (dateStr: string): Date | null => {
        const parts = dateStr.match(/(\d{2})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (parts) {
            const [, day, month, year, hours, minutes, seconds] = parts.map(Number);
            // Corrige o ano para 4 dígitos (ex: 25 -> 2025). Assume anos < 70 são 20xx, >= 70 são 19xx.
            const fullYear = year < 70 ? 2000 + year : 1900 + year;
            // Note: Month is 0-indexed in JavaScript Date (0 for Jan, 11 for Dec)
            return new Date(fullYear, month - 1, day, hours, minutes, seconds);
        }
        return null;
    };

    const parsedDate = parseDateWithFormat(timeValue);

    if (parsedDate && !isNaN(parsedDate.getTime())) {
        timestamp = Math.floor(parsedDate.getTime() / 1000); // Segundos desde a época
    } else {
        console.warn(`[WARN] Formato de tempo inválido na linha ${headerRowIndex + 2 + rowIndex} de ${fileName}: "${timeValue}". Linha ignorada.`);
        return; 
    }
    
    const measureEntry: { [key: string]: any } = { timestamp: timestamp };

    sensorHeaders.forEach((sensorHeader: string, index: number) => {
      const sensorColIndex = headers.indexOf(sensorHeader);
      let sensorValue = '';
      if (sensorColIndex !== -1 && row[sensorColIndex]) {
        sensorValue = row[sensorColIndex].trim();
      }
      
      const parsedValue = parseFloat(sensorValue);
      if (!isNaN(parsedValue)) {
        measureEntry[`sensor${index + 1}`] = parsedValue;
      } else {
        console.warn(`[WARN] Valor não numérico para sensor '${sensorHeader}' na linha ${headerRowIndex + 2 + rowIndex} de ${fileName}: "${sensorValue}".`);
      }
    });
    measures.push(measureEntry);
  });

  if (measures.length === 0) {
    throw new Error(`Nenhum dado de medição válido encontrado em ${fileName} após processamento. Verifique o conteúdo do arquivo.`);
  }

  const arkmedsSensors = sensorHeaders.map((_h: string, index: number) => `sensor${index + 1}`);

  return {
    status: 'parsed',
    serial_number: `FROM_${fileName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_${Date.now()}`, // Serial único
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
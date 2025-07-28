// thermocert-pro/src/services/dataProcessor.ts
import type { RawArkmedsData, SensorDataRow } from '../types';

/**
 * Converte dados de CSV (Array de Arrays ou Array de Objetos) para RawArkmedsData.
 * Assume que o CSV contém dados de sensores para um único ciclo.
 */
export const processCsvOrXlsxToArkmedsData = (
  rawData: any[], // Pode ser Array<Array<string>> ou Array<Object>
  fileName: string
): RawArkmedsData => {
  // Assume a primeira linha como cabeçalhos
  const headers = rawData[0];
  const dataRows = rawData.slice(1);

  // Encontra as colunas de tempo e sensores
  const timeHeader = headers.find((h: string) => h.toLowerCase().includes('time') || h.toLowerCase().includes('tempo'));
  const sensorHeaders = headers.filter((h: string) => h.toLowerCase().startsWith('ch') || h.toLowerCase().startsWith('s')); // CH01, S1, etc.

  if (!timeHeader || sensorHeaders.length === 0) {
    throw new Error(`Formato de arquivo inválido para ${fileName}. Não foi possível encontrar colunas de tempo ou sensores.`);
  }

  const measures: { [key: string]: any }[] = [];
  dataRows.forEach((row: any) => {
    // Se rawData for array de arrays (de XLSX.utils.sheet_to_json({header:1}))
    let timeValue = row[headers.indexOf(timeHeader)];
    let currentMeasures: { [key: string]: number } = {};
    let timestamp: number;

    // Tentar parsear o tempo para timestamp (assumindo formato como 'DD-MM-YY HH:MM:SS' ou 'YYYY-MM-DD HH:MM:SS')
    try {
        // Tenta parsear a data, primeiro como string, depois como Date object
        let date = new Date(timeValue);
        if (isNaN(date.getTime())) { // Se a primeira tentativa falhar, tente um parse mais robusto para DD-MM-YY
            const [datePart, timePart] = timeValue.split(' ');
            const [day, month, year] = datePart.split('-');
            // Converte YY para YYYY (assumindo que 25 significa 2025)
            const fullYear = parseInt(year, 10) < 50 ? 2000 + parseInt(year, 10) : 1900 + parseInt(year, 10);
            date = new Date(`${fullYear}-${month}-${day}T${timePart}`);
        }
        timestamp = Math.floor(date.getTime() / 1000); // Segundos desde a época
    } catch (e) {
        throw new Error(`Formato de tempo inválido "${timeValue}" em ${fileName}. Verifique se é uma data/hora reconhecível.`);
    }

    if (isNaN(timestamp)) {
        console.warn(`Tempo inválido ou ausente para a linha em ${fileName}:`, timeValue);
        return; // Pula essa linha se o timestamp for inválido
    }
    
    // Adicionar timestamp
    const measureEntry: { [key: string]: any } = { timestamp: timestamp };

    // Adicionar valores dos sensores
    sensorHeaders.forEach((sensorHeader: string, index: number) => {
      let sensorValue;
      if (Array.isArray(row)) { // Se a linha é um array (xlsx com header:1)
        sensorValue = row[headers.indexOf(sensorHeader)];
      } else { // Se a linha é um objeto (csv simples)
        sensorValue = row[sensorHeader];
      }
      
      const parsedValue = parseFloat(sensorValue);
      if (!isNaN(parsedValue)) {
        measureEntry[`sensor${index + 1}`] = parsedValue; // Renomeia para sensor1, sensor2
      } else {
        console.warn(`Valor não numérico para sensor ${sensorHeader} em ${fileName}:`, sensorValue);
      }
    });
    measures.push(measureEntry);
  });

  const arkmedsSensors = sensorHeaders.map((_h: string, index: number) => `sensor${index + 1}`);

  return {
    status: 'parsed',
    serial_number: `FROM_${fileName.replace(/\s/g, '_').toUpperCase()}`, // Placeholder para serial
    configurations: [
      {
        duration: measures.length > 1 ? measures[measures.length - 1].timestamp - measures[0].timestamp : 0,
        material: fileName, // Nome do arquivo como material
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
        temperature: 'N/A', // Temperatura alvo não está no CSV genérico
      },
    ],
  };
};

/**
 * Normaliza um array de RawArkmedsData para lidar com possíveis campos ausentes
 * que podem vir de arquivos não-Arkmeds originais.
 */
export const normalizeRawArkmedsData = (dataArray: RawArkmedsData[]): RawArkmedsData[] => {
  return dataArray.map(data => ({
    ...data,
    configurations: data.configurations || [],
    serial_number: data.serial_number || 'N/A',
    // Garante que a estrutura de configurações e ciclos exista
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
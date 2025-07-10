
import { Test, SensorReading, QualificationType, TestStats, ReportData, ClientInfo, EquipmentInfo, ReportMetadata } from '../types';
import { UNIFORMITY_LIMIT, STABILITY_LIMIT, F0_MINIMUM } from '../constants';

const SENSOR_IDS_CHAMBER = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'];
const SENSOR_IDS_AUTOCLAVE = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15'];

const generateReadings = (sensorIds: string[], duration: number, interval: number, targetTemp: number, variation: number): SensorReading[] => {
    const readings: SensorReading[] = [];
    for (let time = 0; time <= duration; time += interval) {
        const temperatures: { [key: string]: number } = {};
        sensorIds.forEach(id => {
            let temp = targetTemp + (Math.random() - 0.5) * variation;
            temperatures[id] = parseFloat(temp.toFixed(2));
        });
        readings.push({ time, temperatures });
    }
    return readings;
};

const generateDoorOpenReadings = (sensorIds: string[], duration: number, interval: number, targetTemp: number, variation: number, openTime: number): SensorReading[] => {
    const readings = generateReadings(sensorIds, duration, interval, targetTemp, variation);
    return readings.map(r => {
        if(r.time > openTime && r.time < openTime + 2) { // 2 minute door open effect
            const newTemps: {[key: string]: number} = {};
            Object.keys(r.temperatures).forEach(key => {
                newTemps[key] = parseFloat((r.temperatures[key]! + 5 * Math.random()).toFixed(2));
            });
            return {...r, temperatures: newTemps};
        }
        return r;
    });
};

const generatePowerOutageReadings = (sensorIds: string[], duration: number, interval: number, targetTemp: number, variation: number, outageTime: number): SensorReading[] => {
    const readings = generateReadings(sensorIds, duration, interval, targetTemp, variation);
    return readings.map(r => {
        if(r.time > outageTime) {
            const newTemps: {[key: string]: number} = {};
            Object.keys(r.temperatures).forEach(key => {
                 const timeAfterOutage = r.time - outageTime;
                 const tempRise = timeAfterOutage * 0.1 * (1 + (Math.random() - 0.5) * 0.3); // Gradual rise
                newTemps[key] = parseFloat((r.temperatures[key]! + tempRise).toFixed(2));
            });
            return {...r, temperatures: newTemps};
        }
        return r;
    });
};


export const generateMockData = (type: QualificationType): Test[] => {
    const startTimestamp = Math.floor(Date.now() / 1000) - (24 * 60 * 60); // Mock start time 24h ago
    const initialStats: TestStats = { stability: {}, uniformity: null, minTemp: null, maxTemp: null, avgTemp: null };

    if (type === QualificationType.AUTOCLAVE) {
        const cycleData = generateReadings(SENSOR_IDS_AUTOCLAVE, 180, 1, 121, 0.5);
        const testsToProcess: Test[] = [
            { id: 'autoclave_cycle', name: 'Ciclo de Esterilização 121°C', data: cycleData, status: 'N/A', stats: initialStats, chartId: "chart-autoclave_cycle", startTimestamp }
        ];
        return testsToProcess.map(t => ({...t, ...calculateAllStats(t, QualificationType.AUTOCLAVE)}));
    }
    
    // Chamber
    const chamberTests: Test[] = [
        { id: 'chamber_dist', name: 'Ensaio de Distribuição Térmica (24h)', data: generateReadings(SENSOR_IDS_CHAMBER, 1440, 5, 5, 0.8), status: 'N/A', stats: initialStats, chartId: "chart-chamber_dist", startTimestamp },
        { id: 'chamber_open', name: 'Ensaio de Porta Aberta', data: generateDoorOpenReadings(SENSOR_IDS_CHAMBER, 10, 1/6, 5, 1, 2), status: 'N/A', stats: initialStats, chartId: "chart-chamber_open", startTimestamp: startTimestamp + 1440*60 },
        { id: 'chamber_closed', name: 'Ensaio de Porta Fechada', data: generateReadings(SENSOR_IDS_CHAMBER, 10, 1/6, 5, 0.2), status: 'N/A', stats: initialStats, chartId: "chart-chamber_closed", startTimestamp: startTimestamp + 1450*60 },
        { id: 'chamber_power_outage', name: 'Ensaio de Falta de Energia', data: generatePowerOutageReadings(SENSOR_IDS_CHAMBER, 10, 1/6, 5, 0.5, 1), status: 'N/A', stats: initialStats, chartId: "chart-chamber_power_outage", startTimestamp: startTimestamp + 1460*60 },
    ];
    return chamberTests.map(t => ({...t, ...calculateAllStats(t, QualificationType.CHAMBER)}));
};

export const parseArkmedsJson = (jsonData: any, qualificationType: QualificationType): Partial<ReportData> => {
    const result: Partial<ReportData> = {};

    // Extract top-level metadata if it exists
    if (jsonData.client && typeof jsonData.client === 'object') {
        result.client = jsonData.client;
    }
    if (jsonData.equipment && typeof jsonData.equipment === 'object') {
        result.equipment = jsonData.equipment;
    }
     if (jsonData.metadata && typeof jsonData.metadata === 'object') {
        result.metadata = jsonData.metadata;
    }

    if (!jsonData.configurations || !Array.isArray(jsonData.configurations)) {
        // It's possible the file only contains tests, which is fine.
        // But if it contains neither tests nor metadata, it's an issue.
        if (!result.client && !result.equipment) {
           throw new Error("Invalid JSON format: 'configurations' array not found and no other data present.");
        }
        result.tests = []; // No tests found, but maybe there was metadata
        return result;
    }
    
    // Parse tests
    const tests: Test[] = jsonData.configurations.map((config: any, index: number) => {
        if (!config.cycles || !config.cycles[0] || !config.cycles[0].measures) {
            console.warn(`Skipping configuration ${index} due to missing data.`);
            return null;
        }

        const cycle = config.cycles[0];
        const startTime = cycle.begin;

        const sensorReadings: SensorReading[] = cycle.measures.map((measure: any) => {
            const { timestamp, values } = measure;
            const temperatures: { [sensorId: string]: number | null } = {};
            
            Object.keys(values).forEach(key => {
                if (key.startsWith('sensor')) {
                    const sensorId = `S${parseInt(key.replace('sensor', ''), 10) + 1}`;
                    temperatures[sensorId] = values[key];
                }
            });
            
            return {
                time: (timestamp - startTime) / 60, // Convert to minutes
                temperatures,
            };
        });

        const testId = `test-${index}-${config.material.replace(/\s/g, '-')}`;
        const newTest: Test = {
            id: testId,
            name: config.material || `Ensaio ${index + 1}`,
            data: sensorReadings,
            status: 'N/A',
            stats: { stability: {}, uniformity: null, minTemp: null, maxTemp: null, avgTemp: null },
            chartId: `chart-${testId}`,
            startTimestamp: startTime,
        };

        const { stats, status } = calculateAllStats(newTest, qualificationType);
        return { ...newTest, stats, status };

    }).filter((t: Test | null): t is Test => t !== null);

    result.tests = tests;
    return result;
};

export const parseCsvData = (csvText: string, qualificationType: QualificationType): Partial<ReportData> => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
        throw new Error("Arquivo CSV inválido: poucas linhas de dados.");
    }
    
    const result: Partial<ReportData> = {
        client: {} as ClientInfo,
        equipment: {} as EquipmentInfo,
        metadata: {} as ReportMetadata
    };

    let dataStartIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#') || line.startsWith('//')) {
            const content = line.substring(line.startsWith('#') ? 1 : 2).trim();
            const parts = content.split(':');
            if (parts.length >= 2) {
                const key = parts[0].trim().toLowerCase();
                const value = parts.slice(1).join(':').trim();
                
                // Client Info
                if (key === 'cliente' || key === 'client') result.client!.name = value;
                else if (key === 'cnpj') result.client!.cnpj = value;
                else if (key === 'endereço' || key === 'address') result.client!.address = value;
                // Equipment Info
                else if (key === 'equipamento' || key === 'equipment name') result.equipment!.name = value;
                else if (key === 'fabricante' || key === 'manufacturer') result.equipment!.manufacturer = value;
                else if (key === 'modelo' || key === 'model') result.equipment!.model = value;
                else if (key.includes('serie') || key.includes('serial')) result.equipment!.serialNumber = value;
                else if (key.includes('identificação') || key.includes('identification')) result.equipment!.identification = value;
                else if (key.includes('faixa temp') || key.includes('range')) result.equipment!.temperatureRange = value;
                // Metadata
                else if (key.includes('responsável') || key.includes('responsible')) result.metadata!.responsible = value;
                else if (key === 'executor') result.metadata!.executor = value;
                else if (key === 'revisor' || key === 'reviewer') result.metadata!.reviewer = value;
            }
        } else {
            dataStartIndex = i;
            break;
        }
    }
    
    const dataLines = lines.slice(dataStartIndex);
    const headers = dataLines[0].split(',').map(h => h.trim());
    const dateIndex = headers.findIndex(h => h.toLowerCase() === 'data');
    const timeIndex = headers.findIndex(h => ['hora', 'tempo'].includes(h.toLowerCase()));
    
    if (dateIndex === -1 || timeIndex === -1) {
        throw new Error("Arquivo CSV inválido: colunas 'Data' e 'Hora'/'Tempo' não encontradas após metadados.");
    }
    
    const sensorHeaders = headers.filter(h => /[st]\d+/i.test(h));

    if (sensorHeaders.length === 0) {
        throw new Error("Nenhuma coluna de sensor (ex: S1, T2) foi encontrada no cabeçalho do CSV.");
    }

    let startTimestamp = 0;
    const readings: SensorReading[] = [];

    for (let i = 1; i < dataLines.length; i++) {
        const values = dataLines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;

        const dateParts = values[dateIndex].split('/'); // DD/MM/YYYY
        const timeParts = values[timeIndex].split(':'); // HH:MM:SS
        
        if(dateParts.length !== 3 || timeParts.length < 2) continue;

        const currentTimestamp = new Date(+dateParts[2], +dateParts[1] - 1, +dateParts[0], +timeParts[0], +timeParts[1], +timeParts[2] || 0).getTime();

        if (i === 1) {
            startTimestamp = Math.floor(currentTimestamp / 1000);
        }

        const temperatures: { [sensorId: string]: number | null } = {};
        sensorHeaders.forEach(header => {
            const sensorIndex = headers.indexOf(header);
            const value = parseFloat(values[sensorIndex].replace(',', '.'));
            temperatures[header.toUpperCase()] = isNaN(value) ? null : value;
        });

        readings.push({
            time: (currentTimestamp - (startTimestamp * 1000)) / (60 * 1000), // Time in minutes from start
            temperatures,
        });
    }

    const testId = `csv-test-${new Date().getTime()}`;
    const newTest: Test = {
        id: testId,
        name: "Ensaio de Dados Importado via CSV",
        data: readings,
        status: 'N/A',
        stats: { stability: {}, uniformity: null, minTemp: null, maxTemp: null, avgTemp: null },
        chartId: `chart-${testId}`,
        startTimestamp: startTimestamp,
    };

    const { stats, status } = calculateAllStats(newTest, qualificationType);
    result.tests = [{ ...newTest, stats, status }];

    return result;
};


export const calculateAllStats = (test: Test, type: QualificationType): { stats: TestStats, status: 'Conforme' | 'Não Conforme' | 'N/A' } => {
    const { data } = test;
    if (data.length === 0) return { stats: { stability: {}, uniformity: null, minTemp: null, maxTemp: null, avgTemp: null }, status: 'N/A' };

    const sensorIds = data.length > 0 && data[0].temperatures ? Object.keys(data[0].temperatures) : [];
    const allTemps = data.flatMap(r => Object.values(r.temperatures)).filter(t => t !== null) as number[];
    
    if (allTemps.length === 0) return { stats: { stability: {}, uniformity: null, minTemp: null, maxTemp: null, avgTemp: null }, status: 'N/A' };

    const stats: TestStats = {
        stability: {},
        uniformity: null,
        minTemp: Math.min(...allTemps),
        maxTemp: Math.max(...allTemps),
        avgTemp: allTemps.reduce((a, b) => a + b, 0) / allTemps.length,
        lethalityF0: {},
        minF0: null,
    };

    // Stability
    sensorIds.forEach(id => {
        const sensorTemps = data.map(r => r.temperatures[id]).filter(t => t !== null) as number[];
        if(sensorTemps.length > 0) {
            stats.stability[id] = Math.max(...sensorTemps) - Math.min(...sensorTemps);
        }
    });

    // Uniformity at each time point
    const uniformities = data.map(reading => {
        const temps = Object.values(reading.temperatures).filter(t => t !== null) as number[];
        if (temps.length < 2) return 0;
        return Math.max(...temps) - Math.min(...temps);
    });
    stats.uniformity = Math.max(...uniformities);
    
    let status: 'Conforme' | 'Não Conforme' | 'N/A' = 'Conforme';

    if (type === QualificationType.AUTOCLAVE) {
        const timeInterval = data.length > 1 ? data[1].time - data[0].time : 0;
        sensorIds.forEach(id => {
            const F0 = data.reduce((acc, reading) => {
                const temp = reading.temperatures[id];
                if (temp !== null && temp >= 100) { // F0 calculation is only relevant at high temperatures
                    return acc + (timeInterval * Math.pow(10, (temp - 121.1) / 10));
                }
                return acc;
            }, 0);
            stats.lethalityF0![id] = F0;
        });
        const allF0s = Object.values(stats.lethalityF0!).filter(f0 => f0 !== null) as number[];
        if(allF0s.length > 0) {
            stats.minF0 = Math.min(...allF0s);
            if(stats.minF0 < F0_MINIMUM) status = 'Não Conforme';
        }
    } else { // Chamber
        const maxStabilityValues = Object.values(stats.stability).filter(s => s !== null) as number[];
        if(maxStabilityValues.length > 0) {
            const maxStability = Math.max(...maxStabilityValues);
            if(maxStability > STABILITY_LIMIT) status = 'Não Conforme';
        }
        if((stats.uniformity ?? 0) > UNIFORMITY_LIMIT) status = 'Não Conforme';
    }

    return { stats, status };
};

export const updateSingleReading = (tests: Test[], testId: string, timeIndex: number, sensorId: string, newValue: number, type: QualificationType): Test[] => {
    return tests.map(test => {
        if (test.id === testId) {
            const newData = [...test.data];
            const newTemps = { ...newData[timeIndex].temperatures };
            if(newTemps[sensorId] !== undefined) {
                newTemps[sensorId] = newValue;
            }
            
            newData[timeIndex] = {
                ...newData[timeIndex],
                temperatures: newTemps
            };
            const updatedTest = { ...test, data: newData };
            const { stats, status } = calculateAllStats(updatedTest, type);
            return { ...updatedTest, stats, status };
        }
        return test;
    });
};

import React, { createContext, useReducer, Dispatch, useContext, useEffect } from 'react';
import type { 
    AppState, AppAction, SensorDataRow, TestResult, RawArkmedsData, 
    ReportTextBlocks, ReportConfig, User 
} from '../types'; 
import { QualificationType } from '../types'; 

const chamberDefaultConfig: Pick<ReportConfig, 'equipmentType' | 'equipmentDescription' | 'targetTemperature' | 'qualificationPhase' | 'chainType'> = {
    equipmentType: 'Câmara de Conservação',
    equipmentDescription: 'CÂMARA DE CONSERVAÇÃO',
    targetTemperature: '5.0',
    qualificationPhase: 'QP',
    chainType: 'Fria',
};

const autoclaveDefaultConfig: Pick<ReportConfig, 'equipmentType' | 'equipmentDescription' | 'targetTemperature' | 'qualificationPhase' | 'chainType'> = {
    equipmentType: 'Autoclave',
    equipmentDescription: 'AUTOCLAVE A VAPOR',
    targetTemperature: '121.0',
    qualificationPhase: 'QP',
    chainType: 'Quente',
};

const chamberTestNames = ['Ensaio de Distribuição Térmica (24h)', 'Ensaio de Porta Aberta', 'Ensaio de Queda de Energia'];
const autoclaveTestNames = ['Ensaio de Penetração de Vapor (Bowie-Dick)', 'Ciclo de Esterilização 121°C', 'Ciclo de Esterilização 134°C', 'Ensaio com Indicador Biológico'];

const chamberTextBlocks: ReportTextBlocks = {
    introduction: "Este relatório detalha os procedimentos e resultados da qualificação térmica realizada em conformidade com as diretrizes da norma ABNT NBR 16328 e RDC 430/2020. A qualificação térmica de câmaras de conservação é um procedimento essencial para garantir a conformidade e a confiabilidade de equipamentos utilizados na armazenagem de produtos que requerem condições térmicas controladas. Esse processo é especialmente crítico em setores como o farmacêutico, alimentício e hospitalar, onde a manutenção de temperaturas específicas é indispensável para preservar a integridade e a qualidade dos produtos.\n\nO procedimento de qualificação térmica envolve uma série de testes e análises destinados a verificar se a câmara opera dentro dos padrões exigidos pelas normas regulatórias aplicáveis, incluindo a verificação da uniformidade de temperatura, estabilidade térmica e desempenho do sistema de controle, entre outros parâmetros.",
    objectives: "O objetivo principal da qualificação térmica é assegurar que a câmara de conservação cumpra integralmente os requisitos de desempenho especificados, garantindo que os produtos armazenados sejam mantidos sob condições térmicas adequadas e seguras. Além disso, o certificado de qualificação térmica serve como evidência documentada de que o equipamento foi testado e aprovado, oferecendo respaldo para auditorias regulatórias e certificações de boas práticas.",
    responsibilities: "Contratado\n• Realizar e interpretar os ensaios de qualificação.\n• Elaborar o relatório de validação.\n\nContratante\n• Disponibilizar um profissional para acompanhar os serviços.\n• Disponibilizar as informações características do equipamento, incluindo manuais e protocolos de instalação.\n• Disponibilizar os equipamentos em perfeitas condições, dentro do cronograma de atividades.\n• Disponibilizar os materiais utilizados na etapa de qualificação de desempenho.\n• Revisão e aprovação final do relatório fornecido pelo contratado.",
    termDefinitions: "Amplitude de temperatura: Diferença entre a maior e menor medição de temperatura, para um mesmo instante.\n\nCalibração: É a operação que estabelece, sob condições especificadas, em uma primeira etapa, uma relação entre os valores e as incertezas de medição fornecidos por padrões e as indicações correspondentes com as incertezas associadas; numa segunda etapa, utiliza esta informação para estabelecer uma relação visando a obtenção de um resultado de medição a partir de uma indicação.\n\nCarga crítica: Também chamada de carga de maior desafio, é definida como a carga utilizada na qualificação de desempenho, cujo desafio representa o pior cenário na rotina de serviço.",
    cycleConfig: `Ciclo parametrizado - Ensaio de distribuição térmica\nAplicação: Qualificação térmica da câmara de conservação\n\nCiclo parametrizado - Ensaio porta aberta\nAplicação: Qualificação térmica da câmara de conservação\n\nCiclo parametrizado - Ensaio falta de rede\nAplicação: Qualificação térmica da câmara de conservação`,
    instrumentation: "Todos os certificados de calibração encontram-se em anexo.\n\n7.1 Sensores\n\n7.1.1 Módulo de aquisição de dados\n\n• Otto, Analisador de Qualificação Térmica, Arkmeds, com 16 canais de temperatura e 1 canal de pressão.\n• Calibrado usando padrão Analisador de Qualificação Térmica ARKMEDS OTTO tag: AN-001 ns: 02C2V2134D6F2 com precisão de 0.5.",
    conclusion: "Com base nos testes realizados e nos resultados obtidos, conclui-se que a câmara de conservação atendeu aos requisitos estabelecidos para a qualificação térmica. O equipamento está em conformidade com os padrões regulatórios e é adequado para a armazenagem de produtos sob condições térmicas controladas.\n\nA validade deste certificado de qualificação é de 12 meses, contados a partir da data de emissão. Caso o equipamento passe por qualquer processo de manutenção que possa impactar seu desempenho térmico, é obrigatória a realização de uma nova qualificação para assegurar a sua conformidade e desempenho adequado.",
};

const autoclaveTextBlocks: ReportTextBlocks = {
    introduction: "Este relatório documenta a qualificação de desempenho de um esterilizador a vapor (Autoclave), em conformidade com as diretrizes da RDC 15/2012 da ANVISA, a norma ABNT NBR ISO 17665, ISO 11138 e normas do Inmetro. A qualificação de autoclaves é um processo crítico para garantir a esterilidade de materiais e instrumentos em serviços de saúde, prevenindo infecções e assegurando a segurança do paciente.",
    objectives: "O objetivo desta qualificação é verificar e documentar que a autoclave está operando consistentemente de acordo com os parâmetros pré-estabelecidos, e que o processo de esterilização é eficaz, reprodutível e seguro, atendendo aos requisitos normativos para o processamento de produtos para saúde.",
    responsibilities: "Contratado\n• Realizar e interpretar os ensaios de qualificação.\n• Elaborar o relatório de validação.\n\nContratante\n• Disponibilizar um profissional para acompanhar os serviços.\n• Disponibilizar as informações características do equipamento, incluindo manuais e protocolos de instalação.\n• Disponibilizar os equipamentos em perfeitas condições, dentro do cronograma de atividades.\n• Disponibilizar os materiais utilizados na etapa de qualificação de desempenho.\n• Revisão e aprovação final do relatório fornecido pelo contratado.",
    termDefinitions: "Esterilização: Processo de destruição de todas as formas de vida microbiana.\n\nIndicador Biológico (IB): Sistema de teste contendo microrganismos viáveis com uma resistência definida e conhecida a um processo de esterilização específico.\n\nTeste de Bowie-Dick: Teste realizado para avaliar a eficácia da remoção de ar da câmara da autoclave.",
    cycleConfig: "Ciclos de esterilização parametrizados para qualificação de desempenho, incluindo testes de penetração de vapor e desafios com indicadores biológicos, conforme as cargas e configurações de rotina do equipamento.",
    instrumentation: "Todos os certificados de calibração encontram-se em anexo.\n\n7.1 Sensores\n\n7.1.1 Módulo de aquisição de dados\n\n• Otto, Analisador de Qualificação Térmica, Arkmeds, com 16 canais de temperatura e 1 canal de pressão.\n• Calibrado usando padrão Analisador de Qualificação Térmica ARKMEDS OTTO tag: AN-001 ns: 02C2V2134D6F2 com precisão de 0.5.",
    conclusion: "Com base nos resultados, conclui-se que a autoclave atendeu aos critérios de aceitação para a qualificação de desempenho. O equipamento demonstra ser capaz de realizar ciclos de esterilização eficazes e reprodutíveis, estando apto para o uso em rotina, conforme as cargas qualificadas. Recomenda-se a requalificação periódica conforme RDC 15/2012.",
};

const initialState: AppState = {
  currentUser: null,
  qualificationType: QualificationType.CHAMBER,
  currentStep: 'login', 
  config: {
    clientName: "FUNDAÇÃO HOSPITALAR DO ESTADO DE MINAS GERAIS - HOSPITAL JOÃO XXIII",
    cnpj: "19843929001344",
    address: "Avenida Professor Alfredo Balena, 400 - Belo Horizonte/MG - CEP 30130-100",
    ...chamberDefaultConfig,
    serialNumber: '0974',
    assetNumber: '19451156',
    model: '347CV1',
    manufacturer: 'FANEM',
    reportDate: new Date().toLocaleDateString('pt-BR'),
    city: 'Belo Horizonte',
    technicalManager: 'José Vilaça Custódio',
    executingTechnician: 'Edgar Junior',
    reportReviewer: 'Bruno Paes de Oliveira',
  },
  textBlocks: chamberTextBlocks,
  tests: [],
  equipmentImage: null,
  technicalDrawingImage: null,
  companyLogo: null,
  watermarkImage: null,
  calibrationCertificate: null,
  isGeneratingPdf: false,
  isGeneratingWord: false,
  users: [],
};

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within a AppProvider');
    }
    return context;
};

const normalizeTestName = (name: string, type: QualificationType): string => {
    const lowerCaseName = name.toLowerCase();
    if (type === QualificationType.CHAMBER) {
        if (lowerCaseName.includes('falta de rede') || lowerCaseName.includes('falta de energia') || lowerCaseName.includes('queda de energia')) return 'Ensaio de Queda de Energia';
        if (lowerCaseName.includes('porta aberta')) return 'Ensaio de Porta Aberta';
        if (lowerCaseName.includes('distribui') || lowerCaseName.includes('24 horas')) return 'Ensaio de Distribuição Térmica (24h)';
    } else { // autoclave
        if (lowerCaseName.includes('bowie') || lowerCaseName.includes('vácuo')) return 'Ensaio de Penetração de Vapor (Bowie-Dick)';
        if (lowerCaseName.includes('biologico') || lowerCaseName.includes('ib')) return 'Ensaio com Indicador Biológico';
        if (lowerCaseName.includes('121')) return 'Ciclo de Esterilização 121°C';
        if (lowerCaseName.includes('134')) return 'Ciclo de Esterilização 134°C';
    }
    return name.replace(/QUQLIFICACAO/gi, 'Qualificação').replace(/TERMICA/gi, 'Térmica');
};

const getDefaultTextsForTest = (testName: string, type: QualificationType) => {
    if (type === QualificationType.CHAMBER) {
        const isDistribuicao = testName.toLowerCase().includes('distribuição');
        return {
            description: "É o ensaio que verificada a distribuição de temperatura no interior da câmara do equipamento. Sensores de temperatura são distribuídos pela câmara interna, em configuração de grelha, sem tocar as superfícies. A temperatura é então monitorada em todos os pontos.",
            cycleInfo: `Ciclo desempenho térmico– 5 °C–${isDistribuicao ? '24 hora(s)' : '10 minutos'}–${testName}`,
            methodology: "Para iniciar o estudo de distribuição de temperatura, é necessário distribuir geometricamente 12 sensores de temperatura dentro da câmara interna, com um obrigatoriamente posicionado adjacente ao sensor de controle de temperatura do equipamento e garantindo que os sensores não entrem em contato com a superfície interna do equipamento. Convém que uma distância mínima de 3 cm entre os sensores e as laterais internas do equipamento seja respeitada.",
            acceptanceCriteria: "Durante o período de ensaio:\n• Em um determinado momento, as temperaturas médias medidas (máxima e mínima) devem estar entre 2 °C e 8 °C.\n• Calculando a média de temperatura de cada um dos sensores, a diferença máxima entre o maior e o menor valor deve ser de ± 3 °C.\n• Avariação máxima de temperatura em um dado sensor deve ser de 3 °C.",
            results: "A seguinte tabela apresenta o comportamento da temperatura. Situação: Aprovado"
        };
    } else { // autoclave
        return {
            description: "Este ensaio verifica a eficácia do ciclo de esterilização sob condições de carga e parâmetros definidos.",
            cycleInfo: `Ciclo de qualificação de desempenho – ${testName}`,
            methodology: "Sensores de temperatura e/ou indicadores biológicos foram distribuídos nos pontos de maior desafio térmico dentro da câmara e da carga. O ciclo foi executado conforme os parâmetros de rotina do equipamento.",
            acceptanceCriteria: "Todos os sensores devem atingir e manter a temperatura de esterilização pelo tempo definido. O valor de letalidade (F0) em cada ponto monitorado deve ser de, no mínimo, 15 minutos. Para ensaios com Indicadores Biológicos, o resultado deve ser negativo (sem crescimento microbiano). Para o teste de Bowie-Dick, a revelação deve ser uniforme.",
            results: "Os resultados detalhados, incluindo valores de temperatura e letalidade F0, são apresentados nas tabelas e gráficos a seguir. Situação: Aprovado"
        }
    }
}

const calculateF0 = (rawData: SensorDataRow[]): { f0Results: { sensor: string, f0: number }[], minF0: number } => {
    if (rawData.length < 2) return { f0Results: [], minF0: 0 };

    const sensorKeys = Object.keys(rawData[0]).filter(k => k.startsWith('T') && !k.startsWith('Tempo'));
    if (sensorKeys.length === 0) return { f0Results: [], minF0: 0 };

    const f0ResultsMap: { [key: string]: number } = {};
    sensorKeys.forEach(key => f0ResultsMap[key] = 0);

    for (let i = 1; i < rawData.length; i++) {
        const prevRow = rawData[i - 1];
        const currRow = rawData[i];
        
        const dt = (currRow.timestamp - prevRow.timestamp) / 60;
        if (dt <= 0 || isNaN(dt)) continue;

        sensorKeys.forEach(key => {
            const temp = parseFloat(currRow[key] as string);
            if (isNaN(temp)) return;
            if (temp >= 100) { 
                const Z = 10; // Z-value
                const T_ref = 121.1; // Reference temperature
                const L = Math.pow(10, (temp - T_ref) / Z);
                f0ResultsMap[key] += L * dt;
            }
        });
    }

    const f0Results = sensorKeys.map(key => ({
        sensor: key,
        f0: parseFloat(f0ResultsMap[key].toFixed(2))
    }));
    
    const f0Values = f0Results.map(r => r.f0);
    const minF0 = f0Values.length > 0 ? Math.min(...f0Values) : 0;

    return { f0Results, minF0: parseFloat(minF0.toFixed(2)) };
}


const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOGIN':
        localStorage.setItem('token', action.payload.token); 
        return { ...state, currentUser: action.payload.user, currentStep: 'upload' };
    case 'LOGOUT':
        localStorage.removeItem('token'); 
        return { ...initialState, currentUser: null, currentStep: 'login', users: [] }; 
    
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_QUALIFICATION_TYPE': {
        if (state.qualificationType === action.payload) return state;
        const isChamber = action.payload === QualificationType.CHAMBER; 
        
        const currentUser = state.currentUser;

        const baseStateReset: AppState = { 
            currentUser: currentUser,
            qualificationType: QualificationType.CHAMBER, 
            currentStep: 'upload', 
            config: {
                clientName: "FUNDAÇÃO HOSPITALAR DO ESTADO DE MINAS GERAIS - HOSPITAL JOÃO XXIII",
                cnpj: "19843929001344",
                address: "Avenida Professor Alfredo Balena, 400 - Belo Horizonte/MG - CEP 30130-100",
                ...chamberDefaultConfig,
                serialNumber: '0974',
                assetNumber: '19451156',
                model: '347CV1',
                manufacturer: 'FANEM',
                reportDate: new Date().toLocaleDateString('pt-BR'),
                city: 'Belo Horizonte',
                technicalManager: 'José Vilaça Custódio',
                executingTechnician: 'Edgar Junior',
                reportReviewer: 'Bruno Paes de Oliveira',
            },
            textBlocks: chamberTextBlocks,
            tests: [],
            equipmentImage: null,
            technicalDrawingImage: null,
            companyLogo: null,
            watermarkImage: null,
            calibrationCertificate: null,
            isGeneratingPdf: false,
            isGeneratingWord: false,
            users: [], 
        };


        return {
            ...baseStateReset, 
            currentStep: 'upload', 
            qualificationType: action.payload,
            config: {
                ...baseStateReset.config, 
                ...(isChamber ? chamberDefaultConfig : autoclaveDefaultConfig), 
            },
            textBlocks: isChamber ? chamberTextBlocks : autoclaveTextBlocks,
        };
    }
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'SET_TEXT_BLOCK':
        return { ...state, textBlocks: { ...state.textBlocks, [action.payload.key]: action.payload.value } };
    case 'LOAD_DATA': {
        const { rawJsonDataArray } = action.payload;
        let updatedConfig = { ...state.config }; 
        let finalTests: TestResult[] = []; 

        if (rawJsonDataArray.length === 0) {
            const testNames = state.qualificationType === QualificationType.CHAMBER ? chamberTestNames : autoclaveTestNames;
            
            finalTests = testNames.map(name => {
                const defaultTexts = getDefaultTextsForTest(name, state.qualificationType);
                const dummyRow: SensorDataRow = {
                    Data: 'dd/mm/aaaa', Tempo: 'hh:mm:ss',
                    timestamp: Math.floor(Date.now() / 1000),
                    'T1': 0, 'T2': 0, 'T3': 0, 'T4': 0, 'T5': 0, 'T6': 0, 'T7': 0, 'T8': 0, 'T9': 0, 'T10': 0, 'T11': 0, 'T12': 0,
                    Máxima: 0, Mínima: 0, Média: 0,
                };
                
                const chartData = [ { name: '00:00:00' }, { name: '00:01:00' } ];
                for(let i = 1; i <= 12; i++) {
                    (chartData[0] as any)[`T${i}`] = 0;
                    (chartData[1] as any)[`T${i}`] = 0;
                }
                
                const summary: TestResult['summary'] = {
                    min: 0, max: 0, chamber: 0, maxAmplitude: 0, maxVariation: 0, status: 'Conforme'
                };
                
                const testResult: TestResult = {
                    name, summary, ...defaultTexts,
                    rawData: [dummyRow],
                    chartData,
                };

                if (state.qualificationType === QualificationType.AUTOCLAVE) {
                    testResult.f0Results = [];
                    testResult.summary.f0 = 0;
                }
                
                return testResult;
            });
            
        } else {
            const allConfigurations = rawJsonDataArray.flatMap(data => data.configurations);

            finalTests = allConfigurations.map(config => {
                const cycle = config.cycles[0];
                if (!cycle) return null;

                const normalizedName = normalizeTestName(config.material, state.qualificationType);
                const defaultTexts = getDefaultTextsForTest(normalizedName, state.qualificationType);

                const sensorKeys = cycle.sensors.filter(s => s.startsWith('sensor'));
                
                const rawData: SensorDataRow[] = cycle.measures.map(measure => {
                    const date = new Date(measure.timestamp * 1000);
                    const row: SensorDataRow = {
                        timestamp: measure.timestamp,
                        Data: date.toLocaleDateString('pt-BR'),
                        Tempo: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        Máxima: 0, Mínima: 0, Média: 0,
                    };
                    
                    const sensorValues: number[] = [];
                    sensorKeys.forEach((sensorKey) => {
                        const sensorIndex = parseInt(sensorKey.replace('sensor', ''), 10);
                        const value = measure.values[sensorKey] ?? 0;
                        row[`T${sensorIndex}`] = parseFloat(value.toFixed(2));
                        sensorValues.push(value);
                    });

                    const validSensorValues = sensorValues.filter(v => v !== null && v !== undefined);
                    if (validSensorValues.length > 0) {
                        row.Mínima = parseFloat(Math.min(...validSensorValues).toFixed(2));
                        row.Máxima = parseFloat(Math.max(...validSensorValues).toFixed(2));
                        const sum = validSensorValues.reduce((a, b) => a + b, 0);
                        row.Média = parseFloat((sum / validSensorValues.length).toFixed(2));
                    }
                    
                    return row;
                });
                
                const chartData = rawData.map(row => {
                    const point: { [key: string]: any } = { name: row.Tempo };
                    for (let i = 1; i <= sensorKeys.length; i++) {
                        point[`T${i}`] = row[`T${i}`];
                    }
                    return point;
                });

                let overallMin = Infinity, overallMax = -Infinity, totalAvg = 0;
                rawData.forEach(row => {
                    if (row.Mínima < overallMin) overallMin = row.Mínima;
                    if (row.Máxima > overallMax) overallMax = row.Máxima;
                    totalAvg += row.Média;
                });
                const chamberAvg = rawData.length > 0 ? totalAvg / rawData.length : 0;
            
                const summary: TestResult['summary'] = {
                    min: parseFloat(overallMin.toFixed(1)),
                    max: parseFloat(overallMax.toFixed(1)),
                    chamber: parseFloat(chamberAvg.toFixed(1)),
                    maxAmplitude: 0, 
                    maxVariation: 0, 
                    status: 'Conforme'
                };
                
                const testResult: TestResult = {
                    name: normalizedName,
                    summary,
                    rawData,
                    chartData,
                    ...defaultTexts,
                };

                if (state.qualificationType === QualificationType.AUTOCLAVE) {
                    const { f0Results, minF0 } = calculateF0(testResult.rawData); 
                    testResult.f0Results = f0Results;
                    testResult.summary.f0 = minF0;
                    if (minF0 < 15) {
                        testResult.summary.status = 'Não Conforme';
                    }
                }
                
                return testResult;

            }).filter((t): t is TestResult => t !== null);

            const testOrder = state.qualificationType === QualificationType.CHAMBER
                ? ['Ensaio de Distribuição Térmica (24h)', 'Ensaio de Porta Aberta', 'Ensaio de Queda de Energia']
                : ['Ensaio de Penetração de Vapor (Bowie-Dick)', 'Ciclo de Esterilização 121°C', 'Ciclo de Esterilização 134°C', 'Ensaio com Indicador Biológico'];
            
            finalTests.sort((a, b) => {
                const indexA = testOrder.indexOf(a.name);
                const indexB = testOrder.indexOf(b.name);
                return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
            });

            const mainData: Partial<RawArkmedsData> = rawJsonDataArray[0] || {};
            updatedConfig = { 
                ...state.config,
                serialNumber: mainData.serial_number || state.config.serialNumber,
                targetTemperature: mainData.configurations?.[0]?.temperature || state.config.targetTemperature,
            };
        }

        return {
            ...state,
            config: updatedConfig, 
            tests: finalTests, 
        };
    }

    case 'UPDATE_CELL': {
        const { testIndex, rowIndex, columnId, value } = action.payload;
        const newTests = JSON.parse(JSON.stringify(state.tests));
        const testToUpdate = newTests[testIndex];

        testToUpdate.rawData[rowIndex][columnId] = value;

        const updatedRow = testToUpdate.rawData[rowIndex];
        const sensorValues = Object.keys(updatedRow)
            .filter(key => key.startsWith('T') && !key.startsWith('Tempo'))
            .map(key => parseFloat(updatedRow[key] as string))
            .filter(v => !isNaN(v));

        if (sensorValues.length > 0) {
            updatedRow.Mínima = parseFloat(Math.min(...sensorValues).toFixed(2));
            updatedRow.Máxima = parseFloat(Math.max(...sensorValues).toFixed(2));
            const sum = sensorValues.reduce((a, b) => a + b, 0);
            updatedRow.Média = parseFloat((sum / sensorValues.length).toFixed(2));
        }
        
        const point: { [key: string]: any } = { name: updatedRow.Tempo };
         for (let i = 1; i <= 16; i++) {
            if (updatedRow[`T${i}`] !== undefined) {
               point[`T${i}`] = updatedRow[`T${i}`];
            }
        }
        testToUpdate.chartData[rowIndex] = point;

        let overallMin = Infinity, overallMax = -Infinity, totalAvg = 0;
        testToToUpdate.rawData.forEach((row: SensorDataRow) => {
            if (row.Mínima < overallMin) overallMin = row.Mínima;
            if (row.Máxima > overallMax) overallMax = row.Máxima;
            totalAvg += row.Média;
        });
        const chamberAvg = testToUpdate.rawData.length > 0 ? totalAvg / rawData.length : 0;
    
        testToUpdate.summary = {
            ...testToUpdate.summary, 
            min: parseFloat(overallMin.toFixed(1)),
            max: parseFloat(overallMax.toFixed(1)),
            chamber: parseFloat(chamberAvg.toFixed(1)),
        };

        if (state.qualificationType === QualificationType.AUTOCLAVE) {
            const { f0Results, minF0 } = calculateF0(testToUpdate.rawData);
            testToUpdate.f0Results = f0Results;
            testToUpdate.summary.f0 = minF0;
            
            let status: 'Conforme' | 'Não Conforme' = 'Conforme';
            if (minF0 < 15) {
                status = 'Não Conforme';
            }
            testToUpdate.summary.status = status;
        }

        return {
            ...state,
            tests: newTests,
        };
    }
    
    case 'UPDATE_TEST_DETAILS': {
        const { testIndex, key, value } = action.payload;
        const newTests = [...state.tests];
        newTests[testIndex] = {
            ...newTests[testIndex],
            [key]: value
        };
        return { ...state, tests: newTests };
    }
    case 'SET_EQUIPMENT_IMAGE':
        return { ...state, equipmentImage: action.payload };
    case 'SET_TECHNICAL_DRAWING_IMAGE':
        return { ...state, technicalDrawingImage: action.payload };
    case 'SET_COMPANY_LOGO':
        return { ...state, companyLogo: action.payload };
    case 'SET_WATERMARK_IMAGE':
        return { ...state, watermarkImage: action.payload };
    case 'SET_CALIBRATION_CERTIFICATE':
        return { ...state, calibrationCertificate: action.payload };
    case 'SET_GENERATING_PDF':
        return { ...state, isGeneratingPdf: action.payload };
    case 'SET_GENERATING_WORD':
        return { ...state, isGeneratingWord: action.payload };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !state.currentUser) {
      const fetchUserFromBackend = async () => {
        try {
          const response = await fetch('https://thermocert-api-backend.onrender.com/api/auth/me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const userData: User = await response.json(); 
            dispatch({ type: 'LOGIN', payload: { user: userData, token: token } });
          } else {
            localStorage.removeItem('token');
            dispatch({ type: 'LOGOUT' }); 
          }
        } catch (error) {
          console.error("Erro ao validar token:", error);
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        }
      };
      fetchUserFromBackend();
    }
  }, [state.currentUser, dispatch]); 

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
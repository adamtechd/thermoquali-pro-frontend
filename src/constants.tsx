
import React from 'react';
import { ReportData, QualificationType } from './types';

export const initialReportData: ReportData = {
  qualificationType: null,
  client: { name: '', cnpj: '', address: '' },
  equipment: { name: '', manufacturer: '', model: '', serialNumber: '', identification: '', temperatureRange: '' },
  metadata: { responsible: '', executor: '', reviewer: '', qualification: '', coldChain: true },
  tests: [],
  sections: {
    introduction: '',
    objectives: '',
    responsibilities: '',
    definitions: '',
    instrumentation: '',
    methodology: '',
    conclusion: '',
  },
  images: {
    companyLogo: null,
    sensorLayout: null,
    equipmentPhoto: null,
    watermark: null,
  },
  calibrationCertificate: null,
};

export const getTextsForQualification = (type: QualificationType) => {
    if (type === QualificationType.AUTOCLAVE) {
        return {
            introduction: `Este relatório apresenta os resultados da Qualificação Térmica de Performance (QP) realizada na autoclave de marca [Fabricante], modelo [Modelo]. O objetivo é verificar se o equipamento mantém as condições de temperatura e letalidade (F₀) necessárias para processos de esterilização, em conformidade com as normas vigentes, como a ABNT NBR ISO/IEC 17025:2017.`,
            objectives: `O objetivo principal desta qualificação é demonstrar, através de evidências documentadas, que a autoclave opera de forma consistente e reprodutível dentro dos parâmetros pré-estabelecidos, garantindo a eficácia do processo de esterilização. Os objetivos específicos incluem:\n- Mapear a distribuição de temperatura na câmara.\n- Calcular a letalidade (F₀) em cada ponto monitorado.\n- Verificar a estabilidade e uniformidade da temperatura durante o ciclo.\n- Avaliar o desempenho em condições com e sem carga.`,
            methodology: `A qualificação foi realizada utilizando 15 sensores de temperatura calibrados e posicionados estrategicamente dentro da câmara da autoclave, conforme o diagrama técnico. Foram executados ciclos de esterilização a 121°C, registrando os dados de tempo e temperatura em intervalos de 60 segundos. O cálculo de F₀ foi realizado utilizando a fórmula padrão da indústria com Z = 10°C.`,
            conclusion: `Com base nos resultados obtidos, conclui-se que o equipamento [Status do Equipamento]. Os valores de temperatura e letalidade (F₀) registrados durante os ensaios atendem (ou não atendem) aos critérios de aceitação definidos. Recomenda-se a re-qualificação periódica conforme o plano mestre de validação.`
        };
    }
    // Default to Chamber
    return {
        introduction: `Este relatório descreve os procedimentos e resultados da Qualificação Térmica de Performance (QP) da câmara fria de marca [Fabricante], modelo [Modelo]. O estudo visa assegurar que o equipamento é capaz de manter a temperatura de forma uniforme e estável, conforme os requisitos da RDC 430/2020 da ANVISA e boas práticas de armazenamento.`,
        objectives: `O principal objetivo da qualificação é verificar e documentar que a câmara fria mantém as condições de temperatura especificadas para o armazenamento de produtos termossensíveis. Os objetivos específicos incluem:\n- Mapear a distribuição de temperatura no interior da câmara em três dimensões.\n- Determinar a estabilidade e a uniformidade térmica.\n- Avaliar o comportamento do equipamento durante ensaios de porta aberta e falta de energia.`,
        methodology: `Foram utilizados 9 sensores de temperatura calibrados, distribuídos nos oito cantos e no centro geométrico da câmara. Os dados foram coletados continuamente por um período de 24 horas, com o equipamento operando em seu regime normal. Ensaios de estresse, como abertura de porta e simulação de falta de energia, foram conduzidos para avaliar a recuperação do sistema.`,
        conclusion: `Com base nos dados coletados, conclui-se que o equipamento [Status do Equipamento]. A estabilidade e a uniformidade térmica estão dentro dos limites de aceitação (Estabilidade ≤ 1,0°C, Uniformidade ≤ 2,0°C). Os ensaios de estresse demonstraram a robustez do sistema. O equipamento está qualificado para o uso pretendido.`
    };
};

export const defaultSections = {
    responsibilities: `**Empresa Contratante:** Fornecer acesso ao equipamento e documentação relevante.\n**Empresa Executora:** Realizar os ensaios conforme a metodologia descrita, analisar os dados e emitir este relatório técnico.`,
    definitions: `**Estabilidade Térmica:** Variação de temperatura ao longo do tempo em um ponto específico da câmara.\n**Uniformidade Térmica:** Variação de temperatura entre diferentes pontos da câmara em um mesmo instante de tempo.\n**Letalidade (F₀):** Tempo, em minutos, equivalente de esterilização a 121.1°C para um processo com um valor Z de 10°C.`,
    instrumentation: `Para a execução dos ensaios, foram utilizados os seguintes instrumentos:\n- Registrador de dados de temperatura marca Arkmeds, modelo Otto.\n- Sensores de temperatura tipo Termopar PT-100.\n- Certificado de Calibração nº [Número do Certificado], emitido por laboratório acreditado pela RBC.`,
};

export const UNIFORMITY_LIMIT = 2.0;
export const STABILITY_LIMIT = 1.0;
export const F0_MINIMUM = 15.0; // minutes

export const Icons = {
    upload: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
    chamber: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    autoclave: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10s5 2 7 0l2.657-2.657a8 8 0 010 11.314z" /></svg>,
    pdf: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.828a2 2 0 00-.586-1.414l-4.414-4.414A2 2 0 0011.172 2H4zm6 10a1 1 0 10-2 0v2a1 1 0 102 0v-2zm-4 0a1 1 0 011-1h2a1 1 0 110 2H7a1 1 0 01-1-1zm7-7a1 1 0 00-1-1H4a1 1 0 00-1 1v1h14V5z" clipRule="evenodd" /></svg>,
    word: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.828a2 2 0 00-.586-1.414l-4.414-4.414A2 2 0 0011.172 2H4zm5 12a1 1 0 001-1v-4a1 1 0 00-2 0v4a1 1 0 001 1zm-3-2a1 1 0 01-1-1V9a1 1 0 012 0v2a1 1 0 01-1 1zm8-4a1 1 0 11-2 0V7a1 1 0 112 0v1z" clipRule="evenodd" /></svg>,
    excel: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2.5 2.5A2.5 2.5 0 015 0h10a2.5 2.5 0 012.5 2.5v15a2.5 2.5 0 01-2.5 2.5H5A2.5 2.5 0 012.5 17.5v-15zM5 1a1.5 1.5 0 00-1.5 1.5v15A1.5 1.5 0 005 19h10a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0015 1H5z"/><path d="M7.5 4a.5.5 0 00-.5.5v2a.5.5 0 001 0v-2a.5.5 0 00-.5-.5zm2 0a.5.5 0 00-.5.5v2a.5.5 0 001 0v-2a.5.5 0 00-.5-.5zm2 0a.5.5 0 00-.5.5v2a.5.5 0 001 0v-2a.5.5 0 00-.5-.5zm-4 4a.5.5 0 00-.5.5v2a.5.5 0 001 0v-2a.5.5 0 00-.5-.5zm2 0a.5.5 0 00-.5.5v2a.5.5 0 001 0v-2a.5.5 0 00-.5-.5zm2 0a.5.5 0 00-.5.5v2a.5.5 0 001 0v-2a.5.5 0 00-.5-.5zm-4 4a.5.5 0 00-.5.5v2a.5.5 0 001 0v-2a.5.5 0 00-.5-.5zm2 0a.5.5 0 00-.5.5v2a.5.5 0 001 0v-2a.5.5 0 00-.5-.5zm2 0a.5.5 0 00-.5.5v2a.5.5 0 001 0v-2a.so_5.5 0 00-.5-.5z"/></svg>,
    loading: <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
};

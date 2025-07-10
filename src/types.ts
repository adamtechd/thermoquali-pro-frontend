// types.ts

export interface User {
    _id: string; 
    username: string;
    name: string;
    isActive: boolean;
    isAdmin: boolean; 
    // permissions: { ... }  <-- REMOVIDO para a arquitetura atual
    // email?: string;       <-- REMOVIDO para a arquitetura atual
}

export interface ArkmedsMeasure {
    timestamp: number;
    values: {
        [key: string]: number;
    };
}

export interface ArkmedsCycle {
    begin: number;
    end: number;
    numberOfSensors: number;
    measures: ArkmedsMeasure[];
    numberOfPoints: number;
    sensors: string[];
}

export interface ArkmedsConfiguration {
    duration: number;
    material: string; 
    cycles: ArkmedsCycle[];
    temperature: string;
}

export interface RawArkmedsData {
    status: string;
    serial_number: string;
    configurations: ArkmedsConfiguration[];
}

export interface SensorDataRow {
  [key: string]: string | number;
  timestamp: number;
  Data: string;
  Tempo: string;
  Máxima: number;
  Mínima: number;
  Média: number;
}

export interface ReportConfig {
  clientName: string;
  cnpj: string;
  address: string;
  equipmentType: 'Câmara de Conservação' | 'Autoclave';
  equipmentDescription: string;
  serialNumber: string;
  assetNumber: string;
  model: string;
  manufacturer: string;
  reportDate: string;
  city: string;
  technicalManager: string;
  executingTechnician: string;
  reportReviewer: string;
  targetTemperature: string;
  qualificationPhase: 'QI' | 'QO' | 'QP';
  chainType: 'Fria' | 'Quente';
}

export interface TestSummary {
  chamber: number;
  max: number;
  min: number;
  maxVariation: number;
  maxAmplitude: number;
  status: 'Conforme' | 'Não Conforme';
  f0?: number;
}

export interface TestResult {
  id?: string; 
  name: string;
  summary: TestSummary;
  rawData: SensorDataRow[];
  chartData: any[];
  description: string;
  cycleInfo: string;
  acceptanceCriteria: string;
  results: string;
  methodology: string;
  f0Results?: { sensor: string; f0: number }[];
}

export interface ReportTextBlocks {
  introduction: string;
  objectives: string;
  responsibilities: string;
  termDefinitions: string;
  cycleConfig: string;
  instrumentation: string;
  conclusion:string;
}

export enum QualificationType {
  CHAMBER = 'chamber',
  AUTOCLAVE = 'autoclave',
}

export interface AppState {
  currentUser: User | null;
  currentStep: 'login' | 'upload' | 'config' | 'editor' | 'admin'; // 'payment' removido
  qualificationType: QualificationType;
  config: ReportConfig;
  textBlocks: ReportTextBlocks;
  tests: TestResult[];
  equipmentImage: string | null;
  technicalDrawingImage: string | null;
  companyLogo: string | null;
  watermarkImage: string | null;
  calibrationCertificate: File | null;
  isGeneratingPdf: boolean;
  isGeneratingWord: boolean;
  users: User[]; 
}

export type AppAction =
  | { type: 'LOGIN'; payload: { user: User; token: string } } 
  | { type: 'LOGOUT' }
  | { type: 'SET_STEP'; payload: AppState['currentStep'] } 
  | { type: 'SET_QUALIFICATION_TYPE'; payload: QualificationType }
  | { type: 'SET_CONFIG'; payload: Partial<ReportConfig> }
  | { type: 'SET_TEXT_BLOCK'; payload: { key: keyof ReportTextBlocks, value: string } }
  | { type: 'LOAD_DATA'; payload: { rawJsonDataArray: RawArkmedsData[] } }
  | { type: 'UPDATE_CELL'; payload: { testIndex: number; rowIndex: number; columnId: string; value: string } }
  | { type: 'UPDATE_TEST_DETAILS'; payload: { testIndex: number; key: keyof TestResult; value: string } }
  | { type: 'SET_EQUIPMENT_IMAGE'; payload: string | null }
  | { type: 'SET_TECHNICAL_DRAWING_IMAGE'; payload: string | null }
  | { type: 'SET_COMPANY_LOGO'; payload: string | null }
  | { type: 'SET_WATERMARK_IMAGE'; payload: string | null }
  | { type: 'SET_CALIBRATION_CERTIFICATE'; payload: File | null }
  | { type: 'SET_GENERATING_PDF'; payload: boolean }
  | { type: 'SET_GENERATING_WORD'; payload: boolean };

// Tipos de componentes antigos (podem ser removidos se não forem mais usados)
export interface ClientInfo { name: string; cnpj: string; address: string; }
export interface EquipmentInfo { name: string; manufacturer: string; model: string; serialNumber: string; identification: string; temperatureRange: string; }
export interface ReportMetadata { responsible: string; executor: string; reviewer: string; qualification: string; coldChain: boolean; }
export interface SensorReading { time: number; temperatures: { [sensorId: string]: number | null }; }
export interface TestStats { stability: { [sensorId: string]: number | null }; uniformity: number | null; minTemp: number | null; maxTemp: number | null; avgTemp: number | null; lethalityF0?: { [sensorId: string]: number | null }; minF0?: number | null; }
export interface TestOld { id: string; name: string; data: SensorReading[]; status: 'Conforme' | 'Não Conforme' | 'N/A'; stats: TestStats; chartId: string; startTimestamp: number; }
export interface ReportData { qualificationType: QualificationType | null; client: ClientInfo; equipment: EquipmentInfo; metadata: ReportMetadata; tests: TestOld[]; sections: { introduction: string; objectives: string; responsibilities: string; definitions: string; instrumentation: string; methodology: string; conclusion: string; }; images: { companyLogo: string | null; sensorLayout: string | null; equipmentPhoto: string | null; watermark: string | null; }; calibrationCertificate: File | null; }
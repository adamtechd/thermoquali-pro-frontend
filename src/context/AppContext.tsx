import React, { createContext, useReducer, Dispatch, useContext, useEffect } from 'react';
import type { 
    AppState, AppAction, SensorDataRow, TestResult, RawArkmedsData, 
    ReportTextBlocks, ReportConfig, User 
} from '../types';
import { QualificationType } from '../types';

// ... (constantes de configuração, textos padrão, etc. - sem alterações) ...
// [O CONTEÚDO INICIAL LONGO DO ARQUIVO FOI OMITIDO POR BREVIDADE, POIS NÃO FOI ALTERADO]
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
const chamberTextBlocks: ReportTextBlocks = { /* ... sem alterações ... */ };
const autoclaveTextBlocks: ReportTextBlocks = { /* ... sem alterações ... */ };

const initialState: AppState = {
  currentUser: null,
  qualificationType: QualificationType.CHAMBER,
  currentStep: 'login', // Inicia no login por padrão
  config: { /* ... sem alterações ... */ },
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

// ... (funções normalizeTestName, getDefaultTextsForTest, calculateF0 - sem alterações) ...

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    // ... (cases 'LOGIN', 'LOGOUT', 'SET_STEP', etc. - sem alterações) ...
    case 'LOGIN':
        localStorage.setItem('token', action.payload.token); 
        return { ...state, currentUser: action.payload.user, currentStep: 'upload' };
    case 'LOGOUT':
        localStorage.removeItem('token'); 
        return { ...initialState, currentUser: null, currentStep: 'login', users: [] }; 
    
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    
    // ...

    case 'LOAD_DATA': {
        const { rawJsonDataArray } = action.payload;

        // Lógica para dados vazios (sem alterações)
        if (rawJsonDataArray.length === 0) {
           // ...
        }
        
        const allConfigurations = rawJsonDataArray.flatMap(data => data.configurations);

        const newTests: TestResult[] = allConfigurations.map(config => {
            const cycle = config.cycles[0];
            if (!cycle) return null;

            // ... (lógica de processamento de dados - sem alterações até a parte do F0)

            const rawData: SensorDataRow[] = cycle.measures.map(measure => {
                // ... (criação da linha de dados)
                return row;
            });
            
            // ... (criação do chartData e summary)

            const testResult: TestResult = {
                name: normalizedName,
                summary,
                rawData,
                chartData,
                ...defaultTexts,
            };

            if (state.qualificationType === QualificationType.AUTOCLAVE) {
                // ==========================================================
                //  INÍCIO DA CORREÇÃO DO BUG
                // ==========================================================
                // ANTES (com erro): const { f0Results, minF0 } = calculateF0(testToUpdate.rawData);
                // CORRIGIDO: usa 'testResult.rawData' que existe neste escopo.
                const { f0Results, minF0 } = calculateF0(testResult.rawData);
                testResult.f0Results = f0Results;
                if (testResult.summary) { // Garante que summary exista
                  testResult.summary.f0 = minF0;
                  if (minF0 < 15) {
                      testResult.summary.status = 'Não Conforme';
                  }
                }
                // ==========================================================
                //  FIM DA CORREÇÃO DO BUG
                // ==========================================================
            }
            
            return testResult;

        }).filter((t): t is TestResult => t !== null);

        // ... (resto da função LOAD_DATA - sem alterações)

        return {
            ...state,
            config: updatedConfig,
            tests: newTests,
        };
    }

    // ... (cases 'UPDATE_CELL', 'UPDATE_TEST_DETAILS', etc. - sem alterações) ...
     case 'UPDATE_CELL': {
        const { testIndex, rowIndex, columnId, value } = action.payload;
        const newTests = JSON.parse(JSON.stringify(state.tests));
        const testToUpdate = newTests[testIndex];

        testToUpdate.rawData[rowIndex][columnId] = value;

        // ... (resto da função sem alterações) ...

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
    
    // ... (resto do reducer) ...
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Este useEffect é a fonte única da verdade para restaurar a sessão do usuário.
  // Ele executa apenas uma vez quando o provider é montado.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
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
            // Token inválido ou expirado
            dispatch({ type: 'LOGOUT' }); 
          }
        } catch (error) {
          console.error("Erro ao validar token:", error);
          dispatch({ type: 'LOGOUT' });
        }
      };
      fetchUserFromBackend();
    }
  }, []); // O array de dependências vazio garante que isso rode apenas uma vez.

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
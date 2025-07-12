import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import UploadScreen from './screens/UploadScreen';
import ConfigScreen from './screens/ConfigScreen';
import ReportEditorScreen from './screens/ReportEditorScreen';
import LoginScreen from './screens/LoginScreen';
import AdminScreen from './screens/AdminScreen';
import PaymentScreen from './screens/PaymentScreen';
import { ChamberIcon, AutoclaveIcon, LogoutIcon, AdminIcon } from './components/icons';
import { QualificationType } from './types';

const AppContent = () => {
  const { state, dispatch } = useAppContext();

  // O useEffect para validar o token foi removido daqui,
  // pois a lógica já existe e é executada no AppProvider (AppContext.tsx),
  // que é o local correto para gerenciar o estado global do usuário.
  // Isso evita redundância e possíveis requisições duplicadas.

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };
  
  const handleGoToAdmin = () => {
    dispatch({ type: 'SET_STEP', payload: 'admin' });
  };

  const handleGoToApp = () => {
    // Redireciona para a tela de upload, que é a tela inicial da aplicação logada
    dispatch({ type: 'SET_STEP', payload: 'upload' });
  }

  // Se não houver usuário e o passo atual não for 'login', renderiza a tela de login.
  if (!state.currentUser) {
    return <LoginScreen />;
  }
  
  const isAdmin = state.currentUser?.isAdmin;

  const renderContent = () => {
    switch (state.currentStep) {
        case 'upload':
            return <UploadScreen />;
        case 'config':
            return <ConfigScreen />;
        case 'editor':
            return <ReportEditorScreen />;
        case 'admin':
            return isAdmin ? <AdminScreen /> : <p className="text-red-600 text-center text-lg mt-10">Acesso negado. Você não tem permissão para acessar esta página.</p>;
        case 'payment': 
           return <PaymentScreen />; 
        // Se o usuário estiver logado mas nenhum passo for correspondente, vai para a tela de upload.
        default:
            return <UploadScreen />;
    }
  }

  return (
    <div className="min-h-screen bg-brand-background text-brand-text-primary">
      <header className="bg-brand-primary text-white shadow-md">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {state.currentStep !== 'admin' && state.currentStep !== 'payment' && (
                state.qualificationType === QualificationType.CHAMBER ? <ChamberIcon className="w-8 h-8" /> : <AutoclaveIcon className="w-8 h-8" />
            )}
            <button onClick={handleGoToApp} disabled={state.currentStep === 'upload'}>
              <h1 className="text-xl font-bold tracking-tight">ThermoCert Pro</h1>
            </button>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm hidden sm:inline">Bem-vindo, {state.currentUser?.name}</span>
             {isAdmin && state.currentStep !== 'admin' && (
                <button onClick={handleGoToAdmin} className="flex items-center gap-2 px-3 py-1.5 border border-white/50 rounded-md text-sm hover:bg-white/10 transition-colors">
                    <AdminIcon className="w-4 h-4" />
                    <span>Admin</span>
                </button>
             )}
             {state.currentUser && ( 
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 border border-white/50 rounded-md text-sm hover:bg-white/10 transition-colors">
                    <span>Sair</span>
                    <LogoutIcon className="w-4 h-4" />
                </button>
             )}
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}

const App = () => {
  return (
    // StrictMode já engloba a aplicação
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
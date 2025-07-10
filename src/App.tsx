
import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import UploadScreen from './screens/UploadScreen';
import ConfigScreen from './screens/ConfigScreen';
import ReportEditorScreen from './screens/ReportEditorScreen';
import LoginScreen from './screens/LoginScreen';
import AdminScreen from './screens/AdminScreen'; // Import AdminScreen
import { ChamberIcon, AutoclaveIcon, LogoutIcon, AdminIcon } from './components/icons';
import { QualificationType } from './types';

const AppContent = () => {
  const { state, dispatch } = useAppContext();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };
  
  const handleGoToAdmin = () => {
    dispatch({ type: 'SET_STEP', payload: 'admin' });
  };

  const handleGoToApp = () => {
    dispatch({ type: 'SET_STEP', payload: 'upload' });
  }

  if (!state.currentUser) {
    return <LoginScreen />;
  }
  
  const isAdmin = state.currentUser.username === 'adam';

  const renderContent = () => {
    switch (state.currentStep) {
        case 'upload':
            return <UploadScreen />;
        case 'config':
            return <ConfigScreen />;
        case 'editor':
            return <ReportEditorScreen />;
        case 'admin':
            return isAdmin ? <AdminScreen /> : <UploadScreen />; // Safety check
        default:
            return <UploadScreen />;
    }
  }


  return (
    <div className="min-h-screen bg-brand-background text-brand-text-primary">
      <header className="bg-brand-primary text-white shadow-md">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {state.currentStep !== 'admin' && (
                state.qualificationType === QualificationType.CHAMBER ? <ChamberIcon className="w-8 h-8" /> : <AutoclaveIcon className="w-8 h-8" />
            )}
            <button onClick={handleGoToApp} disabled={state.currentStep !== 'admin'}>
              <h1 className="text-xl font-bold tracking-tight">ThermoCert Pro</h1>
            </button>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm hidden sm:inline">Bem-vindo, {state.currentUser.name}</span>
             {isAdmin && state.currentStep !== 'admin' && (
                <button onClick={handleGoToAdmin} className="flex items-center gap-2 px-3 py-1.5 border border-white/50 rounded-md text-sm hover:bg-white/10 transition-colors">
                    <AdminIcon className="w-4 h-4" />
                    <span>Admin</span>
                </button>
             )}
             <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 border border-white/50 rounded-md text-sm hover:bg-white/10 transition-colors">
                <span>Sair</span>
                <LogoutIcon className="w-4 h-4" />
             </button>
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
    <React.StrictMode>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </React.StrictMode>
  );
};

export default App;

import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import UploadScreen from './screens/UploadScreen';
import ConfigScreen from './screens/ConfigScreen';
import ReportEditorScreen from './screens/ReportEditorScreen';
import LoginScreen from './screens/LoginScreen';
import AdminScreen from './screens/AdminScreen'; 
import PaymentScreen from './screens/PaymentScreen'; // Importa PaymentScreen

import { ChamberIcon, AutoclaveIcon, LogoutIcon, AdminIcon } from './components/icons'; // Caminho de importação
import { QualificationType } from './types';

// Importa o auth e db do Firebase
import { auth, db } from './services/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 

const AppContent = () => {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        let userData = {
          _id: firebaseUser.uid,
          username: firebaseUser.email || '', 
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email || '',
          isActive: true, 
          isAdmin: false, 
          permissions: { 
            canEdit: false,
            canGeneratePdf: false,
            canGenerateDocx: false,
            canGenerateExcel: false,
            canAccessAdmin: false, 
            isTestMode: true, 
          }
        };

        if (userDocSnap.exists()) {
          const firestoreData = userDocSnap.data();
          userData = { ...userData, ...firestoreData };
        } 
        
        dispatch({ type: 'LOGIN', payload: { user: userData as any, token: 'firebase-token' } }); 
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => unsubscribe(); 
  }, [dispatch]);

  const handleLogout = () => {
    auth.signOut(); 
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
  
  const canAccessAdmin = state.currentUser?.permissions?.canAccessAdmin;

  const renderContent = () => {
    switch (state.currentStep) {
        case 'upload':
            return <UploadScreen />;
        case 'config':
            return <ConfigScreen />;
        case 'editor':
            return <ReportEditorScreen />;
        case 'admin':
            return canAccessAdmin ? <AdminScreen /> : <p className="text-red-600 text-center text-lg mt-10">Acesso negado. Você não tem permissão para acessar esta página.</p>;
        case 'payment': 
            return <PaymentScreen />;
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
             <span className="text-sm hidden sm:inline">Bem-vindo, {state.currentUser.name}</span>
             {canAccessAdmin && state.currentStep !== 'admin' && (
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
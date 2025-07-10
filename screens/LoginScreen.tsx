import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChamberIcon } from '../components/icons';
// Importa auth e db do Firebase
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const LoginScreen: React.FC = () => {
    const { dispatch } = useAppContext();
    const [email, setEmail] = useState(''); // Email para login/cadastro
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Nome para cadastro
    const [isRegistering, setIsRegistering] = useState(false); // Alternar entre login e cadastro
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (isRegistering) {
                // Lógica de Cadastro com Firebase
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const firebaseUser = userCredential.user;

                // Salva informações adicionais do usuário no Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                await setDoc(userDocRef, {
                    username: email, // Usar email como username no Firestore
                    email: email,
                    name: name,
                    isActive: true,
                    isAdmin: false, // Novos usuários são clientes normais por padrão
                    permissions: {
                        canEdit: false,
                        canGeneratePdf: false,
                        canGenerateDocx: false,
                        canGenerateExcel: false,
                        canAccessAdmin: false,
                        isTestMode: true, // Todos novos usuários começam no modo de teste
                    }
                });
                alert('Cadastro realizado com sucesso! Você está no modo de teste.');
                // O onAuthStateChanged em App.tsx irá lidar com o LOGIN do AppContext
            } else {
                // Lógica de Login com Firebase
                await signInWithEmailAndPassword(auth, email, password);
                // O onAuthStateChanged em App.tsx irá lidar com o LOGIN do AppContext
            }
        } catch (err: any) {
            console.error('Erro de autenticação:', err.code, err.message);
            switch (err.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential': // Novo erro para credenciais inválidas
                    setError('E-mail ou senha inválidos.');
                    break;
                case 'auth/email-already-in-use':
                    setError('Este e-mail já está em uso.');
                    break;
                case 'auth/weak-password':
                    setError('A senha deve ter pelo menos 6 caracteres.');
                    break;
                case 'auth/invalid-email':
                    setError('E-mail inválido.');
                    break;
                default:
                    setError('Erro na autenticação. Tente novamente mais tarde.');
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-brand-background p-4">
            <div className="w-full max-w-md">
                <div className="bg-brand-surface rounded-xl shadow-2xl p-8">
                    <div className="flex flex-col items-center mb-6">
                        <div className="bg-brand-primary p-3 rounded-full text-white mb-4">
                            <ChamberIcon className="w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-bold text-brand-text-primary">ThermoCert Pro</h1>
                        <p className="text-brand-text-secondary">{isRegistering ? 'Crie sua conta de teste' : 'Acesse sua conta para continuar'}</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-6">
                        {isRegistering && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary mb-1">
                                    Seu Nome / Nome da Empresa
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-50 border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    placeholder="Nome completo ou da empresa"
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">
                                E-mail
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-1">
                                Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
                            >
                                {isRegistering ? 'Cadastrar' : 'Entrar'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-sm text-brand-primary hover:underline"
                        >
                            {isRegistering ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se para testar'}
                        </button>
                    </div>

                </div>
                <p className="mt-6 text-center text-sm text-brand-text-secondary">
                    Sistema criado por <span className="font-semibold">Adam Saldanha</span>
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;
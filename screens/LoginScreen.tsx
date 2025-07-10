import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChamberIcon } from '../components/icons';

const LoginScreen: React.FC = () => {
    const { dispatch } = useAppContext();
    const [username, setUsername] = useState(''); // Usado como loginIdentifier (email ou username)
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Para cadastro
    const [isRegistering, setIsRegistering] = useState(false); 
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (isRegistering) {
                // Lógica de Cadastro com Backend Node.js/MongoDB
                const response = await fetch('https://thermocert-api-backend.onrender.com/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username: username, password: password, name: name, email: username }), // Usando username como email para cadastro
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Cadastro realizado com sucesso! Faça login.');
                    setIsRegistering(false); // Volta para tela de login
                    setUsername('');
                    setPassword('');
                    setName('');
                } else {
                    setError(data.message || 'Erro ao cadastrar. Tente novamente.');
                }

            } else {
                // Lógica de Login com Backend Node.js/MongoDB
                const response = await fetch('https://thermocert-api-backend.onrender.com/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ loginIdentifier: username, password: password }), // Envia 'username' como 'loginIdentifier'
                });

                const data = await response.json();

                if (response.ok) {
                    dispatch({ type: 'LOGIN', payload: { user: data.user, token: data.token } });
                } else {
                    setError(data.message || 'Credenciais inválidas.');
                }
            }
        } catch (err: any) {
            console.error('Erro de rede ou servidor:', err);
            setError('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
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
                        <p className="text-brand-text-secondary">{isRegistering ? 'Crie sua conta' : 'Acesse sua conta para continuar'}</p>
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
                            <label htmlFor="username" className="block text-sm font-medium text-brand-text-secondary mb-1">
                                E-mail ou Usuário
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text" // Pode ser text ou email, dependendo se aceita username ou email para login
                                autoComplete="username" // ou "email"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                placeholder="ex: seu@email.com ou seu_usuario"
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
                            {isRegistering ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
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
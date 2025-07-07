import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChamberIcon } from '../components/icons';

const LoginScreen: React.FC = () => {
    const { dispatch } = useAppContext(); // 'state' não é usado aqui, pode ser removido
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Requisição POST para o endpoint de login do backend no Render
            const response = await fetch('https://thermocert-api-backend.onrender.com/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                dispatch({ type: 'LOGIN', payload: { user: data.user, token: data.token } });
            } else {
                setError(data.message || 'Erro ao fazer login. Verifique suas credenciais.');
            }
        } catch (err) {
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
                        <p className="text-brand-text-secondary">Acesse sua conta para continuar</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-brand-text-secondary mb-1">
                                Usuário
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                placeholder="ex: adam"
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
                                Entrar
                            </button>
                        </div>
                    </form>
                </div>
                <p className="mt-6 text-center text-sm text-brand-text-secondary">
                    Sistema criado por <span className="font-semibold">Adam Saldanha</span>
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;
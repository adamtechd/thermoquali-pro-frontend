import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChamberIcon } from '../components/icons';
// Não precisamos mais importar 'User' aqui, pois o AppContext já o lida.

const LoginScreen: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => { // Adicione 'async' aqui
        e.preventDefault();
        setError('');

        try {
            // Requisição POST para o endpoint de login do backend
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Se a resposta for bem-sucedida (status 2xx)
                // O backend deve retornar o token e os dados do usuário.
                // Exemplo de payload esperado: { token: '...', user: { _id: '...', username: '...', name: '...', isActive: true, isAdmin: true } }
                dispatch({ type: 'LOGIN', payload: { user: data.user, token: data.token } }); // Dispara a ação LOGIN com o usuário e o token
            } else {
                // Se a resposta não for ok (ex: 401 Unauthorized, 400 Bad Request)
                setError(data.message || 'Erro ao fazer login. Verifique suas credenciais.');
            }
        } catch (err) {
            // Erros de rede ou do servidor
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
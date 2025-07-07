import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { User } from '../types';

const AdminScreen: React.FC = () => {
    const { state } = useAppContext();
    const [newUser, setNewUser] = useState({ username: '', password: '', name: '' });
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Função para buscar usuários do backend
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Token de autenticação não encontrado. Faça login novamente.');
                return;
            }

            const response = await fetch('https://thermocert-api-backend.onrender.com/api/users', { // ALterado!
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                setUsers(data);
            } else {
                setError(data.message || 'Falha ao buscar usuários.');
            }
        } catch (err) {
            console.error('Erro ao buscar usuários:', err);
            setError('Não foi possível conectar ao servidor para buscar usuários.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!newUser.username || !newUser.password || !newUser.name) {
            setError('Por favor, preencha todos os campos para adicionar um novo usuário.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Token de autenticação não encontrado. Faça login novamente.');
                return;
            }

            const response = await fetch('https://thermocert-api-backend.onrender.com/api/users', { // ALterado!
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...newUser, isAdmin: false })
            });
            const data = await response.json();

            if (response.ok) {
                alert('Usuário adicionado com sucesso!');
                setNewUser({ username: '', password: '', name: '' });
                fetchUsers();
            } else {
                setError(data.message || 'Falha ao adicionar usuário.');
            }
        } catch (err) {
            console.error('Erro ao adicionar usuário:', err);
            setError('Não foi possível conectar ao servidor para adicionar usuário.');
        }
    };
    
    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        setError(null);

        if (state.currentUser?._id === userId && state.currentUser?.isAdmin) {
             alert("Não é possível desativar o seu próprio usuário administrador.");
             return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Token de autenticação não encontrado. Faça login novamente.');
                return;
            }

            const response = await fetch(`https://thermocert-api-backend.onrender.com/api/users/${userId}/status`, { // ALterado!
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            const data = await response.json();

            if (response.ok) {
                alert(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
                fetchUsers();
            } else {
                setError(data.message || 'Falha ao atualizar status do usuário.');
            }
        } catch (err) {
            console.error('Erro ao atualizar status do usuário:', err);
            setError('Não foi possível conectar ao servidor para atualizar o status.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 bg-brand-surface rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-brand-text-primary mb-6 border-b border-brand-border pb-4">
                Administração de Usuários
            </h2>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <h3 className="text-lg font-semibold text-brand-primary mb-4">Criar Novo Usuário</h3>
                    <form onSubmit={handleAddUser} className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1" htmlFor="name">Nome (Empresa/Cliente)</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={newUser.name}
                                onChange={handleInputChange}
                                required
                                className="w-full bg-white border border-brand-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1" htmlFor="username">Login de Acesso</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={newUser.username}
                                onChange={handleInputChange}
                                required
                                className="w-full bg-white border border-brand-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1" htmlFor="password">Senha</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={newUser.password}
                                onChange={handleInputChange}
                                required
                                className="w-full bg-white border border-brand-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-brand-primary text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 transition-colors"
                        >
                            Adicionar Usuário
                        </button>
                    </form>
                </div>

                <div className="md:col-span-2">
                     <h3 className="text-lg font-semibold text-brand-primary mb-4">Lista de Usuários</h3>
                     {loading ? (
                         <p className="text-center text-brand-text-secondary">Carregando usuários...</p>
                     ) : users.length === 0 ? (
                         <p className="text-center text-brand-text-secondary">Nenhum usuário encontrado.</p>
                     ) : (
                        <div className="overflow-x-auto rounded-lg border border-brand-border">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-slate-100 text-xs text-brand-text-primary uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Nome</th>
                                        <th className="px-4 py-3 font-semibold">Login</th>
                                        <th className="px-4 py-3 font-semibold text-center">Status do Acesso</th>
                                        <th className="px-4 py-3 font-semibold text-center">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-brand-surface divide-y divide-brand-border">
                                    {users.map(user => (
                                        <tr key={user._id}>
                                            <td className="px-4 py-3 font-medium text-brand-text-primary">{user.name}</td>
                                            <td className="px-4 py-3 text-brand-text-secondary">{user.username}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {user.isActive ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(user._id, user.isActive)}
                                                    disabled={user.isAdmin && state.currentUser?._id === user._id}
                                                    className={`py-1 px-3 text-xs font-medium rounded-md transition-colors ${
                                                        (user.isAdmin && state.currentUser?._id === user._id) ? 'cursor-not-allowed opacity-50 bg-slate-200' 
                                                        : user.isActive ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
                                                    }`}
                                                >
                                                    {user.isActive ? 'Desativar' : 'Ativar'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default AdminScreen;
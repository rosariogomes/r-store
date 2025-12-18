import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Store, User as UserIcon, Shield, Save, Users, Lock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
  const { storeConfig, updateStoreConfig, user, usersList, updateUserRole, logout } = useStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'STORE' | 'USERS'>('STORE');
  
  // Estado local para config da loja
  const [config, setConfig] = useState(storeConfig);

  // Verifica permissão para ver a aba Usuários
  const canManageUsers = user?.role === 'GESTOR' || user?.role === 'ADMIN';

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreConfig(config);
    alert('Configurações salvas com sucesso!');
  };

  const handleRoleChange = async (targetId: string, newRole: any) => {
      // Regra de Ouro: Admin não pode promover ninguém a GESTOR
      if (user?.role === 'ADMIN' && newRole === 'GESTOR') {
          return alert("Apenas Gestores podem promover outros usuários a Gestor.");
      }
      
      if (window.confirm(`Deseja alterar o cargo deste usuário para ${newRole}?`)) {
          await updateUserRole(targetId, newRole);
      }
  };

  return (
    <div className="pb-20 p-6 animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
      <p className="text-zinc-400 mb-8">Gerencie os dados da sua loja e equipe.</p>

      {/* Navegação de Abas */}
      <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-1">
          <button 
            onClick={() => setActiveTab('STORE')}
            className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-all ${
                activeTab === 'STORE' 
                ? 'border-brand-500 text-brand-500 font-bold' 
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
              <Store size={20} />
              Dados da Loja
          </button>

          {canManageUsers && (
              <button 
                onClick={() => setActiveTab('USERS')}
                className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-all ${
                    activeTab === 'USERS' 
                    ? 'border-brand-500 text-brand-500 font-bold' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                  <Users size={20} />
                  Gerenciar Usuários
              </button>
          )}
      </div>

      {/* --- ABA LOJA --- */}
      {activeTab === 'STORE' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSaveStore} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Nome da Loja</label>
                        <input
                            type="text"
                            value={config.name}
                            onChange={e => setConfig({...config, name: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Subtítulo / Slogan</label>
                        <input
                            type="text"
                            value={config.subtitle}
                            onChange={e => setConfig({...config, subtitle: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">CNPJ</label>
                        <input
                            type="text"
                            value={config.cnpj}
                            onChange={e => setConfig({...config, cnpj: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Telefone</label>
                        <input
                            type="text"
                            value={config.phone}
                            onChange={e => setConfig({...config, phone: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Endereço Completo</label>
                        <input
                            type="text"
                            value={config.address}
                            onChange={e => setConfig({...config, address: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Mensagem do Rodapé (Cupom)</label>
                        <input
                            type="text"
                            value={config.receiptFooter}
                            onChange={e => setConfig({...config, receiptFooter: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800">
                    <button type="submit" className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors">
                        <Save size={20} /> Salvar Alterações
                    </button>
                </div>
            </form>
          </div>
      )}

      {/* --- ABA USUÁRIOS --- */}
      {activeTab === 'USERS' && canManageUsers && (
          <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
                      <h3 className="font-bold text-white flex items-center gap-2">
                          <Shield size={18} className="text-brand-500"/> Membros da Equipe
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">Total: {usersList.length}</span>
                  </div>
                  
                  <div className="divide-y divide-zinc-800">
                      {usersList.map((u) => (
                          <div key={u.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
                                      {u.avatar_url ? (
                                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                          <UserIcon size={20} className="text-zinc-500" />
                                      )}
                                  </div>
                                  <div>
                                      <p className="font-bold text-white text-sm">{u.name} {u.id === user?.id && <span className="text-brand-500 text-xs">(Você)</span>}</p>
                                      <p className="text-zinc-500 text-xs">{u.email}</p>
                                  </div>
                              </div>

                              <div className="flex items-center gap-4">
                                  {/* Seletor de Cargo */}
                                  <div className="relative">
                                      <select 
                                        value={u.role}
                                        disabled={u.id === user?.id} // Não pode mudar o próprio cargo
                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        className={`appearance-none bg-zinc-950 border border-zinc-800 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer focus:border-brand-500 outline-none pr-8 ${
                                            u.role === 'GESTOR' ? 'text-red-400 border-red-900/30 bg-red-900/10' :
                                            u.role === 'ADMIN' ? 'text-blue-400 border-blue-900/30 bg-blue-900/10' :
                                            'text-zinc-400'
                                        }`}
                                      >
                                          <option value="COMMON">Vendedor (Comum)</option>
                                          <option value="ADMIN">Administrador</option>
                                          {/* Só mostra a opção Gestor se quem está vendo for Gestor */}
                                          {/* Se for Admin, a opção existe mas a lógica handleRoleChange bloqueia a seleção, mas para UX melhor, podemos desabilitar ou ocultar */}
                                          {(user?.role === 'GESTOR' || u.role === 'GESTOR') && (
                                              <option value="GESTOR">Gestor (Dono)</option>
                                          )}
                                      </select>
                                      <Lock size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                  <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2"><Shield size={16}/> Níveis de Acesso</h4>
                  <ul className="text-xs text-blue-200 space-y-1 ml-6 list-disc">
                      <li><strong>Gestor:</strong> Acesso total. Pode criar outros Gestores, apagar dados críticos e configurar a loja.</li>
                      <li><strong>Admin:</strong> Pode gerenciar estoque, clientes e ver relatórios. Pode criar outros Admins ou Vendedores.</li>
                      <li><strong>Comum:</strong> Focado em vendas. Pode vender, ver estoque e abrir/fechar seu caixa. Não apaga produtos nem clientes.</li>
                  </ul>
              </div>
          </div>
      )}

      {/* Botão de Sair (Mobile/Desktop) */}
      <div className="mt-12 pt-6 border-t border-zinc-800 md:hidden">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-red-500 font-bold p-4 bg-zinc-900 rounded-xl">
              <LogOut size={20} /> Sair do Aplicativo
          </button>
      </div>
    </div>
  );
};
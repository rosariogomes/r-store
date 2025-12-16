import React, { useState } from 'react';
import { ICONS } from '../../constants';
import { Client } from '../types';
import { useStore } from '../context/StoreContext';

export const Clients = () => {
  const { clients, addClient, updateClient, deleteClient } = useStore(); // Global State
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    whatsapp: '',
    trust_score: 3,
    credit_limit: 0,
    current_debt: 0,
    image_url: ''
  });

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // -- Handlers --

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setSelectedClient(client);
      setFormData({ ...client });
    } else {
      setSelectedClient(null);
      setFormData({
        name: '',
        whatsapp: '',
        trust_score: 3,
        credit_limit: 1000,
        current_debt: 0,
        image_url: ''
      });
    }
    setIsFormModalOpen(true);
  };

  const handleSaveClient = () => {
    if (!formData.name || !formData.whatsapp) {
      alert("Nome e WhatsApp são obrigatórios.");
      return;
    }

    if (selectedClient) {
      // Edit Global
      updateClient({ ...selectedClient, ...formData } as Client);
    } else {
      // Create Global
      const newClient: Client = {
        ...formData as Client,
        id: Date.now().toString(),
      };
      addClient(newClient);
    }
    setIsFormModalOpen(false);
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este cliente?")) {
      deleteClient(id);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${finalPhone}`, '_blank');
  };

  return (
    <div className="animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Carteira de Clientes</h1>
          <p className="text-zinc-400">Gerencie perfis, confiança e canais de contato.</p>
        </div>
        <button 
            onClick={() => handleOpenForm()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-900/20 transition-all active:scale-[0.98]"
        >
            <ICONS.Plus size={20} />
            Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md mb-6">
        <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input 
        type="text" 
        placeholder="Buscar por nome..." 
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-600"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid/Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs uppercase tracking-wider">
                <th className="p-6 font-semibold">Perfil</th>
                <th className="p-6 font-semibold">Contato</th>
                <th className="p-6 font-semibold">Confiabilidade</th>
                <th className="p-6 font-semibold">Financeiro</th>
                <th className="p-6 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map(client => (
                <tr key={client.id} className="group hover:bg-zinc-800/30 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-lg overflow-hidden border border-zinc-700 relative shrink-0">
                        {client.image_url ? (
                            <img src={client.image_url} alt={client.name} className="w-full h-full object-cover" />
                        ) : (
                            <span>{client.name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="text-white font-semibold text-base">{client.name}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                        <span className="text-zinc-300 font-mono text-sm">{client.whatsapp}</span>
                        <button 
                            onClick={() => openWhatsApp(client.whatsapp)}
                            className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-full transition-all"
                            title="Abrir WhatsApp Web"
                        >
                            <ICONS.WhatsApp size={16} />
                        </button>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 bg-zinc-950 w-fit px-3 py-1.5 rounded-lg border border-zinc-800">
                      <span className="text-sm font-bold text-white">{client.trust_score}.0</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <ICONS.Star 
                            key={i} 
                            size={12} 
                            className={i < client.trust_score ? "fill-yellow-500 text-yellow-500" : "text-zinc-700"} 
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1">
                        <div className="text-xs text-zinc-500">Limite: <span className="text-zinc-300">R$ {client.credit_limit}</span></div>
                        {client.current_debt > 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="text-red-500 font-bold">Devendo R$ {client.current_debt.toFixed(2)}</span>
                            <button 
                                onClick={() => { setSelectedClient(client); setIsPaymentModalOpen(true); }}
                                className="text-[10px] bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                            >
                                Receber
                            </button>
                        </div>
                        ) : (
                        <span className="text-green-500 font-medium text-sm flex items-center gap-1">
                            <ICONS.Check size={14} /> Em dia
                        </span>
                        )}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => handleOpenForm(client)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                            <ICONS.Edit size={18} />
                        </button>
                        <button 
                            onClick={() => handleDeleteClient(client.id)}
                            className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <ICONS.Delete size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                  <tr>
                      <td colSpan={5} className="p-12 text-center text-zinc-500">
                          Nenhum cliente encontrado.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Client Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
              <button 
                  onClick={() => setIsFormModalOpen(false)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                  <ICONS.Close size={24} />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-6">
                {selectedClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>

              <div className="space-y-5">
                 {/* Photo Input */}
                 <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 group relative">
                         {formData.image_url ? (
                             <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                         ) : (
                             <ICONS.Camera className="text-zinc-600" size={24} />
                         )}
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Foto do Perfil (URL)</label>
                        <input 
                            type="text" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-white text-sm focus:border-brand-600 focus:outline-none"
                            placeholder="https://..."
                            value={formData.image_url}
                            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Nome Completo *</label>
                    <input 
                        type="text" 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-brand-600 focus:outline-none"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">WhatsApp *</label>
                        <input 
                            type="text" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-brand-600 focus:outline-none"
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                            placeholder="(11) 99999-9999"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Limite de Crédito</label>
                        <input 
                            type="number" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-brand-600 focus:outline-none"
                            value={formData.credit_limit}
                            onChange={(e) => setFormData({...formData, credit_limit: parseFloat(e.target.value)})}
                        />
                    </div>
                 </div>

                 <div>
                     <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Nível de Confiança</label>
                     <div className="flex gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                         {[1, 2, 3, 4, 5].map((score) => (
                             <button
                                key={score}
                                onClick={() => setFormData({...formData, trust_score: score})}
                                className="hover:scale-110 transition-transform"
                             >
                                 <ICONS.Star 
                                    size={24} 
                                    className={(formData.trust_score || 0) >= score ? "fill-yellow-500 text-yellow-500" : "text-zinc-700"}
                                 />
                             </button>
                         ))}
                     </div>
                 </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-zinc-800">
                <button 
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveClient}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-900/20"
                >
                  Salvar
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
                  <ICONS.Close size={24} />
            </button>
            <h3 className="text-xl font-bold text-white mb-1">Registrar Pagamento</h3>
            <p className="text-zinc-400 text-sm mb-6">Cliente: <span className="text-white">{selectedClient.name}</span></p>
            
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-6">
              <span className="text-zinc-500 text-xs uppercase block mb-1">Dívida Atual</span>
              <span className="text-2xl font-bold text-red-500">R$ {selectedClient.current_debt.toFixed(2)}</span>
            </div>

            <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Valor Recebido</label>
            <input 
              type="number" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-600 mb-6"
              placeholder="0.00"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  alert(`Pagamento registrado para ${selectedClient.name}`);
                  setIsPaymentModalOpen(false);
                }}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

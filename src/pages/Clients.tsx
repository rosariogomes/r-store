import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { 
    Search, UserPlus, Phone, AlertCircle, CheckCircle, Wallet, 
    X, Save, MessageCircle, Megaphone, CheckSquare, Square, Send,
    Edit, Trash2 // Novos ícones
} from 'lucide-react';
import { Client } from '../types';

export const Clients = () => {
  const { clients, sales, addClient, updateClient, deleteClient, storeConfig } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  
  // Estado do Formulário (Novo ou Edição)
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', birthDate: '' });
  const [editingId, setEditingId] = useState<string | null>(null); // Guarda o ID se estiver editando

  // Estado da Promoção
  const [selectedClientsForPromo, setSelectedClientsForPromo] = useState<string[]>([]);

  // --- Lógica de Dívidas e Filtros ---
  const clientsData = useMemo(() => {
    if (!clients) return [];

    return clients.map(client => {
      const currentSales = sales || [];
      const pendingSales = currentSales.filter(s => 
        (s.client_id === client.id) && s.status !== 'PAID' && s.status !== 'CANCELLED'
      );
      const totalDebt = pendingSales.reduce((acc, s) => {
        const total = s.total_amount || 0;
        const paid = s.paid_amount || 0;
        return acc + (total - paid);
      }, 0);
      const lastSale = currentSales
        .filter(s => s.client_id === client.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      return { ...client, calculatedDebt: totalDebt, lastPurchaseDate: lastSale ? lastSale.created_at : null };
    });
  }, [clients, sales]);

  const filteredClients = clientsData.filter(c => {
    const name = (c.name || '').toLowerCase();
    const phone = (c.phone || '');
    const search = searchTerm.toLowerCase();
    return name.includes(search) || phone.includes(search);
  });

  const totalReceivable = clientsData.reduce((acc, c) => acc + c.calculatedDebt, 0);

  // --- Funções CRUD ---

  const handleOpenModal = (client?: Client) => {
      if (client) {
          // Modo Edição
          setEditingId(client.id);
          setFormData({
              name: client.name,
              phone: client.phone || client.whatsapp || '',
              address: client.address || '',
              birthDate: client.birthDate || ''
          });
      } else {
          // Modo Criação
          setEditingId(null);
          setFormData({ name: '', phone: '', address: '', birthDate: '' });
      }
      setIsModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('O nome é obrigatório!');

    const clientData = {
      name: formData.name,
      phone: formData.phone,
      whatsapp: formData.phone, // Mantém compatibilidade
      address: formData.address,
      birthDate: formData.birthDate
    };

    if (editingId) {
        // Atualizar
        await updateClient({ id: editingId, ...clientData } as Client);
    } else {
        // Criar Novo
        await addClient({ id: Date.now().toString(), ...clientData, current_debt: 0 } as Client);
    }

    setFormData({ name: '', phone: '', address: '', birthDate: '' });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleDeleteClient = (id: string) => {
      // Primeira confirmação
      if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
          // Segunda confirmação
          if (window.confirm("ATENÇÃO: Essa ação apagará o histórico e é irreversível. Confirmar exclusão?")) {
              deleteClient(id);
          }
      }
  };

  // --- Funções Utilitárias ---

  const openWhatsApp = (phone: string, messageTemplate: string = '', clientName: string = '') => {
    if (!phone) return alert('Cliente sem telefone.');
    const cleanNumber = phone.replace(/\D/g, '');
    const finalNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    const message = messageTemplate.replace('{nome}', clientName);
    window.open(`https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const toggleSelectClient = (id: string) => {
      if (selectedClientsForPromo.includes(id)) {
          setSelectedClientsForPromo(prev => prev.filter(cId => cId !== id));
      } else {
          setSelectedClientsForPromo(prev => [...prev, id]);
      }
  };

  const selectAllFiltered = () => {
      if (selectedClientsForPromo.length === filteredClients.length) {
          setSelectedClientsForPromo([]);
      } else {
          setSelectedClientsForPromo(filteredClients.map(c => c.id));
      }
  };

  return (
    <div className="pb-20 p-6 animate-fade-in relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Clientes</h1>
          <p className="text-zinc-400">Gerencie clientes e visualize pendências.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => { setIsPromoModalOpen(true); setSelectedClientsForPromo([]); }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-900/20"
            >
                <Megaphone size={20} />
                Enviar Promoção
            </button>
            <button 
                onClick={() => handleOpenModal()}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-900/20"
            >
                <UserPlus size={20} />
                Novo Cliente
            </button>
        </div>
      </div>

      {/* Busca e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 relative">
          <input 
            type="text" 
            placeholder="Buscar por nome ou telefone..." 
            className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl pl-12 focus:outline-none focus:border-brand-500 transition-colors"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
           <div>
             <p className="text-zinc-400 text-xs font-bold uppercase mb-1">Total a Receber</p>
             <p className="text-xl font-bold text-orange-500">
               R$ {totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </p>
           </div>
           <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500">
             <Wallet size={24} />
           </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all group relative overflow-hidden">
            {client.calculatedDebt > 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />}
            
            {/* Header do Card com Ações */}
            <div className="flex justify-between items-start mb-4 pl-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold shrink-0 text-lg border border-zinc-700">
                  {client.name ? client.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-white text-lg truncate pr-2">{client.name || 'Sem Nome'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <button 
                        onClick={() => openWhatsApp(client.phone)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all text-xs font-bold"
                    >
                        <MessageCircle size={14} /> WhatsApp
                    </button>
                    <span className="text-zinc-500 text-xs flex items-center gap-1">
                        <Phone size={12} /> {client.phone || '-'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Botões de Ação (Editar / Excluir) */}
              <div className="flex gap-1">
                  <button 
                    onClick={() => handleOpenModal(client)}
                    className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Editar Cliente"
                  >
                      <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteClient(client.id)}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Excluir Cliente"
                  >
                      <Trash2 size={18} />
                  </button>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 flex justify-between items-center pl-2">
              <div>
                 <p className="text-[10px] text-zinc-500 uppercase font-bold">Saldo Devedor</p>
                 {client.calculatedDebt > 0 ? (
                    <div className="flex items-center gap-1 text-orange-500 font-bold text-lg"><AlertCircle size={16} /> R$ {client.calculatedDebt.toFixed(2)}</div>
                  ) : (
                    <div className="flex items-center gap-1 text-green-500 font-bold text-lg"><CheckCircle size={16} /> Em dia</div>
                  )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Aniversário</p>
                <p className="text-zinc-300 text-sm">
                    {client.birthDate ? new Date(client.birthDate).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) : '-'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL NOVO/EDITAR CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">
                        {editingId ? 'Editar Cliente' : 'Novo Cliente'}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white"><X size={24} /></button>
                </div>
                <form onSubmit={handleSaveClient} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Nome Completo</label>
                        <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl focus:border-brand-500 outline-none"
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">WhatsApp</label>
                            <input type="text" required placeholder="(82) 99999-9999" className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl focus:border-brand-500 outline-none"
                                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Nascimento</label>
                            <input type="date" className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl focus:border-brand-500 outline-none"
                                value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Endereço</label>
                        <input type="text" className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl focus:border-brand-500 outline-none"
                            value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4">
                        <Save size={20} /> 
                        {editingId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* MODAL DISPARO DE PROMOÇÃO */}
      {isPromoModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center mb-4">
                      <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Megaphone size={20} className="text-purple-500"/> Disparar Promoção</h2>
                          <p className="text-zinc-400 text-sm">Selecione os clientes para enviar a mensagem padrão.</p>
                      </div>
                      <button onClick={() => setIsPromoModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800 mb-4">
                      <button onClick={selectAllFiltered} className="flex items-center gap-2 text-sm font-bold text-zinc-300 hover:text-white">
                          {selectedClientsForPromo.length === filteredClients.length ? <CheckSquare size={18} className="text-brand-500"/> : <Square size={18}/>}
                          Selecionar Todos ({filteredClients.length})
                      </button>
                      <span className="text-sm text-purple-400 font-bold">{selectedClientsForPromo.length} selecionados</span>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                      {filteredClients.map(client => (
                          <div key={client.id} 
                               onClick={() => toggleSelectClient(client.id)}
                               className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                   selectedClientsForPromo.includes(client.id) ? 'bg-purple-600/10 border-purple-600' : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-900'
                               }`}
                          >
                              <div className="flex items-center gap-3">
                                  {selectedClientsForPromo.includes(client.id) ? <CheckSquare size={20} className="text-purple-500"/> : <Square size={20} className="text-zinc-600"/>}
                                  <div>
                                      <p className="text-white font-bold text-sm">{client.name}</p>
                                      <p className="text-zinc-500 text-xs">{client.phone}</p>
                                  </div>
                              </div>
                              {selectedClientsForPromo.includes(client.id) && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); openWhatsApp(client.phone, storeConfig.promo_message || 'Olá!', client.name); }}
                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600" title="Enviar agora"
                                  >
                                      <Send size={16} />
                                  </button>
                              )}
                          </div>
                      ))}
                  </div>

                  <div className="bg-zinc-800 p-4 rounded-xl">
                      <p className="text-xs text-zinc-400 mb-1 uppercase font-bold">Mensagem que será enviada:</p>
                      <p className="text-sm text-white italic">"{storeConfig.promo_message?.replace('{nome}', 'Nome do Cliente')}"</p>
                      <p className="text-[10px] text-zinc-500 mt-2">* Clique no ícone de avião ao lado de cada cliente selecionado para abrir o WhatsApp.</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
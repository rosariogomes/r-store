import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Save, Settings as SettingsIcon, MessageCircle } from 'lucide-react';

export const Settings = () => {
  const { storeConfig, updateStoreConfig } = useStore();
  
  const [config, setConfig] = useState(storeConfig);

  const handleSave = () => {
    updateStoreConfig(config);
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="animate-fade-in pb-20 p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-zinc-800 rounded-xl">
            <SettingsIcon className="text-brand-500" size={24} />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-white">Configurações</h1>
            <p className="text-zinc-400">Personalize as mensagens e dados da loja.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dados da Loja */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Dados da Loja</h3>
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nome da Loja</label>
                <input 
                    type="text" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-600 outline-none"
                    value={config.name}
                    onChange={e => setConfig({...config, name: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Rodapé do Recibo</label>
                <input 
                    type="text" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-600 outline-none"
                    value={config.receiptFooter}
                    onChange={e => setConfig({...config, receiptFooter: e.target.value})}
                />
            </div>
        </div>

        {/* Mensagens Automáticas */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MessageCircle size={20} className="text-green-500" /> 
                Mensagens WhatsApp
            </h3>
            
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Mensagem de Aniversário</label>
                <p className="text-xs text-zinc-600 mb-2">Use <strong>{'{nome}'}</strong> onde quiser que apareça o nome do cliente.</p>
                <textarea 
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-green-600 outline-none resize-none"
                    value={config.birthday_message}
                    onChange={e => setConfig({...config, birthday_message: e.target.value})}
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Mensagem de Promoção</label>
                <p className="text-xs text-zinc-600 mb-2">Use <strong>{'{nome}'}</strong> para o nome.</p>
                <textarea 
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-green-600 outline-none resize-none"
                    value={config.promo_message}
                    onChange={e => setConfig({...config, promo_message: e.target.value})}
                />
            </div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="mt-6 flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-900/20 transition-all"
      >
        <Save size={20} />
        Salvar Alterações
      </button>
    </div>
  );
};
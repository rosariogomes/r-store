import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { useStore } from '../context/StoreContext';

export const Settings = () => {
  const { storeConfig, updateStoreConfig } = useStore();
  const [formData, setFormData] = useState(storeConfig);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData(storeConfig);
  }, [storeConfig]);

  const handleSave = () => {
    updateStoreConfig(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in pb-20 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Configurações da Loja</h1>
        <p className="text-zinc-400">Personalize os dados que aparecem nos recibos e relatórios.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Logo Section */}
              <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-6 p-4 border border-zinc-800 rounded-xl bg-zinc-950/50">
                   <div className="w-24 h-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                       {formData.logo_url ? (
                           <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                       ) : (
                           <span className="text-3xl font-bold text-zinc-700">{formData.name.charAt(0)}</span>
                       )}
                   </div>
                   <div className="flex-1 w-full">
                       <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Logo da Loja (URL)</label>
                       <div className="relative">
                            <ICONS.Camera className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input 
                                type="text" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-600 text-sm"
                                placeholder="https://exemplo.com/logo.png"
                                value={formData.logo_url || ''}
                                onChange={e => setFormData({...formData, logo_url: e.target.value})}
                            />
                       </div>
                       <p className="text-[10px] text-zinc-500 mt-2">Recomendado: Imagem quadrada (PNG/JPG).</p>
                   </div>
              </div>

              <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Nome Fantasia</label>
                  <input 
                      type="text" 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-600"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Subtítulo / Slogan</label>
                  <input 
                      type="text" 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-600"
                      value={formData.subtitle}
                      onChange={e => setFormData({...formData, subtitle: e.target.value})}
                  />
              </div>
              
              <div className="md:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Endereço Completo</label>
                  <input 
                      type="text" 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-600"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                  />
              </div>

              <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">CNPJ / CPF</label>
                  <input 
                      type="text" 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-600"
                      value={formData.cnpj}
                      onChange={e => setFormData({...formData, cnpj: e.target.value})}
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Telefone / WhatsApp</label>
                  <input 
                      type="text" 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-600"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
              </div>

              <div className="md:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Rodapé do Recibo (Termos e Condições)</label>
                  <textarea 
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-600 resize-none"
                      value={formData.receiptFooter}
                      onChange={e => setFormData({...formData, receiptFooter: e.target.value})}
                  />
              </div>
          </div>

          <div className="pt-6 border-t border-zinc-800 flex justify-end">
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-900/20 transition-all active:scale-[0.98]"
              >
                  {isSaved ? <ICONS.Check size={20} /> : <ICONS.Check size={20} />}
                  <span>{isSaved ? 'Salvo com Sucesso!' : 'Salvar Alterações'}</span>
              </button>
          </div>
      </div>
    </div>
  );
};
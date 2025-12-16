import React, { useState, useMemo } from 'react';
import { ICONS } from '../constants';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

export const Inventory = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useStore(); // Global State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    cost_price: 0,
    sale_price: 0,
    stock_quantity: 0,
    on_bag_quantity: 0,
    size: '',
    color: '',
    image_url: ''
  });

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.size.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // KPIs
  const totalItems = products.reduce((acc, p) => acc + p.stock_quantity, 0);
  const totalCost = products.reduce((acc, p) => acc + (p.cost_price * p.stock_quantity), 0);
  const totalSaleValue = products.reduce((acc, p) => acc + (p.sale_price * p.stock_quantity), 0);
  const lowStockItems = products.filter(p => (p.stock_quantity - p.on_bag_quantity) < 5).length;
  const totalOnBags = products.reduce((acc, p) => acc + p.on_bag_quantity, 0);

  // Handlers
  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        cost_price: 0,
        sale_price: 0,
        stock_quantity: 0,
        on_bag_quantity: 0,
        size: '',
        color: '',
        image_url: 'https://picsum.photos/200/300' // Default placeholder
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(id);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.sale_price) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    if (editingProduct) {
      // Update Global
      updateProduct({ ...editingProduct, ...formData } as Product);
    } else {
      // Create Global
      const newProduct: Product = {
        ...formData as Product,
        id: Date.now().toString(),
        on_bag_quantity: 0 // Default new product has 0 on bag
      };
      addProduct(newProduct);
    }
    setIsModalOpen(false);
  };

  const getStockStatus = (total: number, onBag: number) => {
    const available = total - onBag;
    if (available === 0) return { label: 'Indisponível', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
    if (available < 5) return { label: 'Baixo', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
    return { label: 'Normal', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
  };

  return (
    <div className="animate-fade-in pb-20">
      {/* Header & KPIs */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestão de Estoque</h1>
            <p className="text-zinc-400">Controle total de produtos, custos e margens.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-900/20 transition-all active:scale-[0.98]"
          >
            <ICONS.Plus size={20} />
            Novo Produto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400"><ICONS.Inventory size={20} /></div>
              <span className="text-sm text-zinc-500 font-medium">Total de Peças</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalItems}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><ICONS.Sales size={20} /></div>
                <span className="text-sm text-zinc-500 font-medium">Em Malinhas</span>
             </div>
             <p className="text-2xl font-bold text-purple-400">{totalOnBags} <span className="text-sm font-normal text-zinc-500">peças</span></p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400"><ICONS.Trending size={20} /></div>
              <span className="text-sm text-zinc-500 font-medium">Potencial de Venda</span>
            </div>
            <p className="text-2xl font-bold text-green-500">R$ {totalSaleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className={`bg-zinc-900 border p-5 rounded-xl ${lowStockItems > 0 ? 'border-red-900/50 bg-red-900/10' : 'border-zinc-800'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${lowStockItems > 0 ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}><ICONS.Alert size={20} /></div>
              <span className={`text-sm font-medium ${lowStockItems > 0 ? 'text-red-400' : 'text-zinc-500'}`}>Disp. Baixa</span>
            </div>
            <p className={`text-2xl font-bold ${lowStockItems > 0 ? 'text-red-500' : 'text-white'}`}>{lowStockItems} itens</p>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-4">
           <div className="relative flex-1 max-w-md">
              <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome, cor ou tamanho..." 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="ml-auto text-xs text-zinc-500">
             Mostrando {filteredProducts.length} produtos
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                <th className="p-4 border-b border-zinc-800">Produto</th>
                <th className="p-4 border-b border-zinc-800">Detalhes</th>
                <th className="p-4 border-b border-zinc-800">Financeiro</th>
                <th className="p-4 border-b border-zinc-800 text-center">Status Estoque</th>
                <th className="p-4 border-b border-zinc-800 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredProducts.map(product => {
                const status = getStockStatus(product.stock_quantity, product.on_bag_quantity);
                const margin = ((product.sale_price - product.cost_price) / product.sale_price) * 100;
                const available = product.stock_quantity - product.on_bag_quantity;

                return (
                  <tr key={product.id} className="group hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-16 rounded-lg bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-medium text-white text-sm">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span className="bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">Tam: {product.size}</span>
                          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-zinc-500" /> {product.color}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">R$ {product.sale_price.toFixed(2)}</span>
                        <span className="text-xs text-zinc-500">Custo: R$ {product.cost_price.toFixed(2)}</span>
                        <span className="text-[10px] text-green-500 mt-0.5">Margem: {margin.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-white" title="Disponível">{available}</span>
                            <span className="text-zinc-600">/</span>
                            <span className="text-zinc-500" title="Total Físico">{product.stock_quantity}</span>
                        </div>
                        {product.on_bag_quantity > 0 && (
                            <span className="text-[10px] text-purple-400 font-medium bg-purple-900/20 px-1.5 py-0.5 rounded">
                                {product.on_bag_quantity} na malinha
                            </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${status.color} mt-1`}>
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(product)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <ICONS.Search size={16} className="rotate-90" /> {/* Simulating Edit Icon */}
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <ICONS.Logout size={16} /> {/* Simulating Delete/Trash */}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="p-12 text-center text-zinc-500">
              <ICONS.Inventory size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhum produto encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                  <ICONS.Plus className="rotate-45" size={24} />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-6">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Image Preview Side */}
                 <div className="space-y-4">
                    <div className="w-full aspect-[3/4] bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden relative group">
                        {formData.image_url ? (
                          <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center text-zinc-600">
                            <ICONS.Inventory size={40} className="mx-auto mb-2" />
                            <span className="text-xs">Preview da Imagem</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white text-xs font-medium">URL da Imagem</p>
                        </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">URL da Imagem</label>
                      <input 
                        type="text" 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-white text-sm focus:border-brand-600 focus:outline-none"
                        placeholder="https://..."
                        value={formData.image_url}
                        onChange={e => setFormData({...formData, image_url: e.target.value})}
                      />
                    </div>
                 </div>

                 {/* Form Fields Side */}
                 <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Nome do Produto *</label>
                      <input 
                        type="text" 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-white focus:border-brand-600 focus:outline-none"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Tamanho</label>
                        <select 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-white focus:border-brand-600 focus:outline-none"
                          value={formData.size}
                          onChange={e => setFormData({...formData, size: e.target.value})}
                        >
                          <option value="">Selecione</option>
                          <option value="PP">PP</option>
                          <option value="P">P</option>
                          <option value="M">M</option>
                          <option value="G">G</option>
                          <option value="GG">GG</option>
                          <option value="U">Único</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Cor</label>
                        <input 
                          type="text" 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-white focus:border-brand-600 focus:outline-none"
                          value={formData.color}
                          onChange={e => setFormData({...formData, color: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Preço de Custo (R$)</label>
                        <input 
                          type="number" 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-white focus:border-brand-600 focus:outline-none"
                          value={formData.cost_price}
                          onChange={e => setFormData({...formData, cost_price: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Preço de Venda (R$) *</label>
                        <input 
                          type="number" 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-white focus:border-brand-600 focus:outline-none font-bold text-brand-500"
                          value={formData.sale_price}
                          onChange={e => setFormData({...formData, sale_price: parseFloat(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Quantidade em Estoque</label>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setFormData({...formData, stock_quantity: Math.max(0, (formData.stock_quantity || 0) - 1)})}
                          className="w-10 h-10 rounded-lg bg-zinc-800 text-white hover:bg-brand-600 transition-colors"
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          className="w-full text-center bg-transparent border-none text-2xl font-bold text-white focus:ring-0"
                          value={formData.stock_quantity}
                          onChange={e => setFormData({...formData, stock_quantity: parseInt(e.target.value)})}
                        />
                        <button 
                          onClick={() => setFormData({...formData, stock_quantity: (formData.stock_quantity || 0) + 1})}
                          className="w-10 h-10 rounded-lg bg-zinc-800 text-white hover:bg-brand-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-zinc-800">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-900/20"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
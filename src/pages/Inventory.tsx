import React, { useState } from 'react';
import { ICONS } from '../constants';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

// Opções pré-definidas para facilitar o cadastro
const CATEGORIES = ['Vestidos', 'Blusas', 'Calças', 'Saias', 'Calçados', 'Bolsas', 'Cintos', 'Acessórios'];
const SIZES = ['PP', 'P', 'M', 'G', 'GG', '34', '35', '36', '37', '38', '39', '40', 'U'];

export const Inventory = () => {
  const { products, addProduct, deleteProduct } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados do Formulário
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'Vestidos',
    gender: 'FEMALE',
    size: 'M',
    color: '',
    cost_price: 0,
    sale_price: 0,
    stock_quantity: 1,
    image_url: ''
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sale_price) return;

    const newProduct: Product = {
        id: '', // Supabase gera
        name: formData.name!,
        category: formData.category || 'Outros',
        gender: formData.gender as 'MALE' | 'FEMALE' | 'UNISEX',
        size: formData.size || 'U',
        color: formData.color || '',
        cost_price: Number(formData.cost_price),
        sale_price: Number(formData.sale_price),
        stock_quantity: Number(formData.stock_quantity),
        on_bag_quantity: 0,
        image_url: formData.image_url || 'https://via.placeholder.com/150'
    };

    await addProduct(newProduct);
    setIsModalOpen(false);
    
    // Reset form
    setFormData({
        name: '', category: 'Vestidos', gender: 'FEMALE', 
        size: 'M', color: '', cost_price: 0, sale_price: 0, stock_quantity: 1, image_url: ''
    });
  };

  const handleDelete = (id: string) => {
    if(confirm('Tem certeza que deseja excluir este produto?')) {
        deleteProduct(id);
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Controle de Estoque</h1>
          <p className="text-zinc-400">Gerencie seus produtos, categorias e preços.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar produto..." 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-600"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-900/20 whitespace-nowrap"
            >
                <ICONS.Plus size={20} /> Novo Produto
            </button>
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
            <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-zinc-700 transition-all">
                <div className="aspect-square relative overflow-hidden bg-zinc-950">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white uppercase">
                        {product.category}
                    </div>
                    {product.stock_quantity <= 3 && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">
                            Restam {product.stock_quantity}
                        </div>
                    )}
                </div>
                <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-white line-clamp-1">{product.name}</h3>
                            <p className="text-xs text-zinc-400">{product.gender === 'FEMALE' ? 'Feminino' : product.gender === 'MALE' ? 'Masculino' : 'Unissex'} • {product.color} • {product.size}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-end justify-between mt-4">
                        <div>
                            <p className="text-xs text-zinc-500 mb-0.5">Preço de Venda</p>
                            <p className="text-xl font-bold text-brand-500">R$ {product.sale_price.toFixed(2)}</p>
                        </div>
                        <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <ICONS.Delete size={18} />
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Cadastrar Novo Produto</h3>
                    <button onClick={() => setIsModalOpen(false)}><ICONS.Close className="text-zinc-500 hover:text-white" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Linha 1: Nome e Imagem */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Nome do Produto</label>
                            <input type="text" required className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-600 outline-none" 
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Vestido Longo" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">URL da Imagem</label>
                            <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-600 outline-none" 
                                value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
                        </div>
                    </div>

                    {/* Linha 2: Categoria, Gênero e Tamanho */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Categoria</label>
                            <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-600 outline-none appearance-none"
                                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Gênero</label>
                            <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-600 outline-none appearance-none"
                                value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                                <option value="FEMALE">Feminino</option>
                                <option value="MALE">Masculino</option>
                                <option value="UNISEX">Unissex</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Tamanho</label>
                            <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-600 outline-none appearance-none"
                                value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})}>
                                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Cor</label>
                            <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-600 outline-none" 
                                value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="Ex: Azul" />
                        </div>
                    </div>

                    {/* Linha 3: Preços e Estoque */}
                    <div className="grid grid-cols-3 gap-4 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Custo (R$)</label>
                            <input type="number" step="0.01" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-600 outline-none" 
                                value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-brand-600 uppercase mb-1 block">Venda (R$)</label>
                            <input type="number" step="0.01" className="w-full bg-zinc-900 border border-brand-900/50 rounded-xl p-3 text-white focus:border-brand-600 outline-none font-bold" 
                                value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Estoque</label>
                            <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-brand-600 outline-none" 
                                value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: Number(e.target.value)})} />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-900/20 transition-colors">Salvar Produto</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
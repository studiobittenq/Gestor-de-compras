
import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Package, History, TrendingUp, Camera, Plus, Search, 
  ChevronRight, AlertCircle, BarChart3, MapPin, Smartphone, X, ExternalLink
} from 'lucide-react';
import { Category, Product, PurchaseLog, PriceAlert } from './types';
import { geminiService } from './services/geminiService';

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Café Melitta 500g', category: Category.ESSENTIALS, currentPrice: 18.50, lastPurchased: '2024-05-01', recurrenceDays: 15 },
  { id: '2', name: 'Leite Integral 1L', category: Category.ESSENTIALS, currentPrice: 4.80, lastPurchased: '2024-05-10', recurrenceDays: 7 },
  { id: '3', name: 'Papel Higiênico 12un', category: Category.PERSONAL_HYGIENE, currentPrice: 22.90, lastPurchased: '2024-04-25', recurrenceDays: 30 },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shopping' | 'stock' | 'history' | 'intelligence'>('shopping');
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [history, setHistory] = useState<PurchaseLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [routeReport, setRouteReport] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('domus_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const savePurchase = (log: PurchaseLog) => {
    const newHistory = [log, ...history];
    setHistory(newHistory);
    localStorage.setItem('domus_history', JSON.stringify(newHistory));
    
    // Alerta de Inflação (10% de aumento)
    log.items.forEach(item => {
      const oldProd = products.find(p => p.name.toLowerCase().includes(item.name.toLowerCase()));
      if (oldProd?.currentPrice && item.price > oldProd.currentPrice * 1.1) {
        setAlerts(prev => [...prev, {
          productName: item.name,
          oldPrice: oldProd.currentPrice!,
          newPrice: item.price,
          increasePercentage: Math.round(((item.price / oldProd.currentPrice!) - 1) * 100)
        }]);
      }
    });
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await geminiService.analyzeReceipt(base64);
        const newLog: PurchaseLog = {
          id: Date.now().toString(),
          date: result.date || new Date().toISOString(),
          storeName: result.storeName,
          total: result.total,
          items: result.items
        };
        savePurchase(newLog);
        alert(`Sucesso! Nota de ${result.storeName} processada.`);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Erro ao processar imagem.');
    } finally {
      setLoading(false);
    }
  };

  const getRouteIntelligence = async () => {
    setLoading(true);
    try {
      const report = await geminiService.generateRouteReport(history);
      setRouteReport(report);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar */}
      <nav className="w-20 md:w-72 bg-white border-r border-slate-200 flex flex-col py-8 px-4">
        <div className="flex items-center gap-3 px-4 mb-12">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Smartphone size={28} />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-black text-indigo-950 leading-none">DomusAI</h1>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">Smart Home Hub</p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <NavItem active={activeTab === 'shopping'} onClick={() => setActiveTab('shopping')} icon={<ShoppingCart size={22} />} label="Lista de Compras" />
          <NavItem active={activeTab === 'stock'} onClick={() => setActiveTab('stock')} icon={<Package size={22} />} label="Estoque Preditivo" />
          <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={22} />} label="Log de Gastos" />
          <NavItem active={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')} icon={<TrendingUp size={22} />} label="Inteligência" />
        </div>

        <div className="mt-auto px-2">
          <label className="cursor-pointer group flex items-center gap-3 p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
            <Camera size={22} />
            <span className="hidden md:block font-bold">Escanear Nota</span>
            <input type="file" accept="image/*" onChange={handleScan} className="hidden" />
          </label>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === 'shopping' && 'Lista de Compras'}
              {activeTab === 'stock' && 'Estoque & Predição'}
              {activeTab === 'history' && 'Balanço Financeiro'}
              {activeTab === 'intelligence' && 'Price Intelligence'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">Sincronizado em tempo real</p>
          </div>

          <div className="flex items-center gap-6">
            {alerts.length > 0 && (
              <button onClick={() => setAlerts([])} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-xs font-bold animate-pulse hover:bg-rose-100">
                <AlertCircle size={16} />
                {alerts.length} Alertas Críticos
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 cursor-pointer">
              <Search size={20} />
            </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto space-y-8">
          {loading && (
            <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-4">
                <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-bold text-slate-700">Processando Inteligência...</p>
              </div>
            </div>
          )}

          {activeTab === 'shopping' && <ShoppingListView products={products} />}
          {activeTab === 'stock' && (
            <StockView 
              products={products} 
              predictions={predictions} 
              onRun={() => geminiService.getPredictions(history).then(setPredictions)} 
            />
          )}
          {activeTab === 'history' && <HistoryView history={history} />}
          {activeTab === 'intelligence' && (
            <IntelligenceView 
              history={history} 
              routeReport={routeReport} 
              onGenRoute={getRouteIntelligence} 
              alerts={alerts}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// --- Subcomponents ---

const NavItem: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
    <div className={`${active ? 'text-indigo-600' : ''}`}>{icon}</div>
    <span className="hidden md:block font-bold text-sm tracking-tight">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 hidden md:block"></div>}
  </button>
);

const ShoppingListView: React.FC<{ products: Product[] }> = ({ products }) => {
  const categories = Object.values(Category);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map(cat => {
        const catProducts = products.filter(p => p.category === cat);
        return (
          <div key={cat} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 tracking-tight">{cat}</h3>
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                <Plus size={16} />
              </div>
            </div>
            <div className="space-y-3">
              {catProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl group cursor-pointer hover:bg-indigo-50 transition-colors">
                  <div className="w-6 h-6 rounded-lg border-2 border-slate-200 flex items-center justify-center group-hover:border-indigo-400 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 scale-0 group-hover:scale-100 transition-transform"></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">{p.name}</span>
                  <span className="ml-auto text-xs font-black text-indigo-600">R$ {p.currentPrice?.toFixed(2)}</span>
                </div>
              ))}
              {catProducts.length === 0 && <p className="text-xs text-slate-300 italic py-4 text-center">Nenhum item nesta lista</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const StockView: React.FC<{ products: Product[], predictions: any[], onRun: () => void }> = ({ products, predictions, onRun }) => (
  <div className="space-y-8">
    <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-indigo-200 overflow-hidden relative">
      <div className="z-10 text-center md:text-left">
        <h3 className="text-3xl font-black mb-3">Estoque Preditivo</h3>
        <p className="text-indigo-200 text-sm max-w-md font-medium leading-relaxed">
          Nossa IA analisa o tempo médio de consumo dos seus produtos para que você nunca fique sem o essencial.
        </p>
      </div>
      <button onClick={onRun} className="z-10 bg-white text-indigo-950 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-lg">
        <BarChart3 size={20} /> Calcular Necessidades
      </button>
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
        <h4 className="text-rose-600 font-black flex items-center gap-3 mb-6">
          <AlertCircle size={22} /> Itens em Alerta
        </h4>
        <div className="space-y-4">
          {predictions.map((p, i) => (
            <div key={i} className="flex items-center gap-4 p-5 bg-rose-50/50 rounded-2xl border border-rose-100/50">
              <div className={`w-3 h-3 rounded-full ${p.status === 'Acabou' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
              <div className="flex-1">
                <p className="font-black text-slate-800 text-sm">{p.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{p.reason}</p>
              </div>
              <button className="p-2 bg-white rounded-xl shadow-sm hover:text-indigo-600 transition-colors">
                <Plus size={18} />
              </button>
            </div>
          ))}
          {predictions.length === 0 && <p className="text-slate-400 text-sm italic text-center py-10">Inicie a análise para ver predições.</p>}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
        <h4 className="text-slate-800 font-black flex items-center gap-3 mb-6">
          <Package size={22} className="text-indigo-600" /> Ciclo de Reposição
        </h4>
        <div className="divide-y divide-slate-50">
          {products.filter(p => p.recurrenceDays).map(p => (
            <div key={p.id} className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-700">{p.name}</p>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">A cada {p.recurrenceDays} dias</p>
              </div>
              <div className="px-3 py-1 bg-indigo-50 rounded-lg text-indigo-600 font-black text-[10px]">
                PRÓXIMA: 25/05
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const HistoryView: React.FC<{ history: PurchaseLog[] }> = ({ history }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard label="Gastos Totais (Mês)" value={`R$ ${history.reduce((a, b) => a + b.total, 0).toFixed(2)}`} color="indigo" />
      <StatCard label="Média por Nota" value={`R$ ${(history.reduce((a, b) => a + b.total, 0) / (history.length || 1)).toFixed(2)}`} color="slate" />
      <StatCard label="Itens no Carrinho" value={history.reduce((a, b) => a + b.items.length, 0).toString()} color="slate" />
    </div>

    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loja</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
            <th className="px-8 py-5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {history.map(log => (
            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
              <td className="px-8 py-5 text-sm font-bold text-slate-500">{new Date(log.date).toLocaleDateString('pt-BR')}</td>
              <td className="px-8 py-5 text-sm font-black text-slate-800">{log.storeName}</td>
              <td className="px-8 py-5 text-sm font-bold text-slate-400">{log.items.length} produtos</td>
              <td className="px-8 py-5 text-sm font-black text-indigo-600">R$ {log.total.toFixed(2)}</td>
              <td className="px-8 py-5 text-right">
                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-colors inline" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const IntelligenceView: React.FC<{ history: PurchaseLog[], routeReport: string | null, onGenRoute: () => void, alerts: PriceAlert[] }> = ({ history, routeReport, onGenRoute, alerts }) => {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await geminiService.compareAppliancePrice(search);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Route Intelligence */}
      <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-emerald-100 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center md:text-left">
              <h3 className="text-3xl font-black mb-3">Melhor Rota de Compra</h3>
              <p className="text-emerald-100 text-sm font-medium leading-relaxed">
                Nossa IA cruza os preços de todos os estabelecimentos registrados para sugerir onde comprar cada categoria hoje.
              </p>
            </div>
            <button onClick={onGenRoute} className="bg-white text-emerald-700 px-8 py-4 rounded-2xl font-black hover:bg-emerald-50 transition-all flex items-center gap-3">
              <MapPin size={20} /> Otimizar Rota
            </button>
          </div>
          {routeReport && (
            <div className="mt-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-sm font-medium leading-relaxed whitespace-pre-wrap">
              {routeReport}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Price Tracker */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <h4 className="text-slate-800 font-black flex items-center gap-3">
            <Smartphone size={22} className="text-indigo-600" /> Comparador Online vs Físico
          </h4>
          <div className="flex gap-3">
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Ex: Air Fryer Philips Walita" 
              className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
            />
            <button onClick={handleSearch} disabled={loading} className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50">
              <Search size={22} />
            </button>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 min-h-[150px]">
            {loading ? (
              <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : result ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{result.text}</p>
                {result.sources?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {result.sources.map((s: any, i: number) => (
                      <a key={i} href={s.web?.uri} target="_blank" className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-indigo-600 hover:bg-indigo-50">
                        <ExternalLink size={12} /> VER LOJA
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-10 leading-relaxed">Pesquise um produto para comparar preços em tempo real nos grandes varejistas brasileiros.</p>
            )}
          </div>
        </div>

        {/* Inflation Radar */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <h4 className="text-slate-800 font-black flex items-center gap-3">
            <TrendingUp size={22} className="text-rose-500" /> Radar de Inflação Doméstica
          </h4>
          <div className="space-y-4">
            {alerts.map((a, i) => (
              <div key={i} className="p-5 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-800 text-sm">{a.productName}</p>
                  <p className="text-[10px] text-rose-600 font-bold uppercase mt-1">Alta de {a.increasePercentage}% detectada</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold">ANTERIOR</p>
                  <p className="text-sm font-black text-slate-400 line-through">R$ {a.oldPrice.toFixed(2)}</p>
                  <p className="text-sm font-black text-rose-600">R$ {a.newPrice.toFixed(2)}</p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && <p className="text-xs text-slate-400 italic text-center py-10">Nenhuma variação atípica detectada até o momento.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string, color: 'indigo' | 'slate' }> = ({ label, value, color }) => (
  <div className={`p-8 rounded-[2rem] border shadow-sm ${color === 'indigo' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-800 border-slate-100'}`}>
    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${color === 'indigo' ? 'text-indigo-200' : 'text-slate-400'}`}>{label}</p>
    <p className="text-3xl font-black tracking-tight">{value}</p>
  </div>
);

export default App;

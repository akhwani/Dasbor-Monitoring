/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ReactNode, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  History, 
  Search, 
  User, 
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  FileCheck,
  TrendingUp,
  Filter,
  MoreHorizontal,
  Download,
  ExternalLink,
  Eye,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
  Menu,
  Link2,
  RefreshCw,
  Table
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MOCK_REGULATIONS, MOCK_HISTORY, fetchGoogleSheetData, Regulation, HistoryItem } from './data';

export default function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'All'>('All');
  const [selectedUnit, setSelectedUnit] = useState<string | 'All'>('All');
  const [selectedReg, setSelectedReg] = useState<Regulation | null>(null);
  const [selectedRegForUpdate, setSelectedRegForUpdate] = useState<Regulation | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('');
  const [modalProgress, setModalProgress] = useState(0);
  const [historyToDelete, setHistoryToDelete] = useState<HistoryItem | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Regulation | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const handleSort = (key: keyof Regulation) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Update modal states when selected regulation changes
  useEffect(() => {
    if (selectedRegForUpdate) {
      setModalStatus(selectedRegForUpdate.status);
      setModalProgress(selectedRegForUpdate.progress);
    }
  }, [selectedRegForUpdate]);

  const handleModalStatusChange = (status: string) => {
    setModalStatus(status);
    let progress = 0;
    const s = status.toLowerCase();
    if (s === 'pengusulan') progress = 25;
    else if (s === 'pembahasan') progress = 50;
    else if (s === 'harmonisasi') progress = 75;
    else if (s === 'pengundangan' || s === 'selesai') progress = 100;
    setModalProgress(progress);
  };
  const targetSheetUrl = 'https://docs.google.com/spreadsheets/d/173hx5iqe4RbdaG9k2uNM_KTELMC7w3khJvDMucNYBAk/edit?gid=0#gid=0';
  const [sheetUrl, setSheetUrl] = useState(() => {
    const saved = localStorage.getItem('sheetUrl');
    return saved === targetSheetUrl ? saved : targetSheetUrl;
  });
  const [historyGid, setHistoryGid] = useState(() => localStorage.getItem('historyGid') || '1585102885');
  const [scriptUrl, setScriptUrl] = useState(() => localStorage.getItem('scriptUrl') || '');
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false); // Force re-connect
  
  const [regulations, setRegulations] = useState<Regulation[]>(MOCK_REGULATIONS);
  const [historyData, setHistoryData] = useState<HistoryItem[]>(MOCK_HISTORY);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('regulations', JSON.stringify(regulations));
  }, [regulations]);

  useEffect(() => {
    localStorage.setItem('historyData', JSON.stringify(historyData));
  }, [historyData]);

  useEffect(() => {
    localStorage.setItem('sheetUrl', sheetUrl);
    localStorage.setItem('historyGid', historyGid);
    localStorage.setItem('scriptUrl', scriptUrl);
    localStorage.setItem('isConnected', isConnected.toString());
  }, [sheetUrl, historyGid, scriptUrl, isConnected]);

  const loadData = async () => {
    setIsConnecting(true);
    try {
      const { regulations: regs, history } = await fetchGoogleSheetData(sheetUrl, historyGid);
      setRegulations(regs);
      setHistoryData(Array.isArray(history) ? [...history].reverse() : []);
      setIsConnected(true);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear, selectedUnit]);

  const filteredRegulations = regulations.filter(reg => {
    const matchesSearch = reg.judul.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = selectedYear === 'All' || reg.tahun === selectedYear;
    const matchesUnit = selectedUnit === 'All' || reg.pengusul === selectedUnit;
    return matchesSearch && matchesYear && matchesUnit;
  }).sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === bValue) return 0;
    
    const comparison = aValue < bValue ? -1 : 1;
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  const totalRegulasi = filteredRegulations.length;
  const avgProgress = totalRegulasi > 0 
    ? (filteredRegulations.reduce((acc, reg) => acc + reg.progress, 0) / totalRegulasi).toFixed(1)
    : 0;

  const statusCounts = {
    pengusulan: filteredRegulations.filter(r => r.status.includes('usul')).length,
    pembahasan: filteredRegulations.filter(r => r.status.includes('bahas')).length,
    harmonisasi: filteredRegulations.filter(r => r.status.includes('harmon')).length,
    pengundangan: filteredRegulations.filter(r => r.status.includes('undang')).length,
    selesai: filteredRegulations.filter(r => r.status.includes('selesai')).length,
  };

  const years = Array.from(new Set(regulations.map(reg => reg.tahun))).filter(y => y !== null && y !== undefined).sort((a: number, b: number) => a - b);
  const units = Array.from(new Set(regulations.map(reg => reg.pengusul))).filter(u => u && (u as string).trim() !== '').sort() as string[];

  const getStatusColorClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('usul')) return 'bg-red-500';
    if (s.includes('bahas')) return 'bg-amber-500';
    if (s.includes('harmon')) return 'bg-indigo-500';
    if (s.includes('undang') || s.includes('selesai')) return 'bg-emerald-500';
    return 'bg-slate-400';
  };

  const getStatCardColors = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-50';
      case 'emerald': return 'bg-emerald-50';
      case 'indigo': return 'bg-indigo-50';
      default: return 'bg-slate-50';
    }
  };

  const totalPages = Math.ceil(filteredRegulations.length / itemsPerPage);
  const paginatedRegulations = filteredRegulations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const barData = [
    { name: 'pengusulan', count: statusCounts.pengusulan, color: '#ef4444' },
    { name: 'pembahasan', count: statusCounts.pembahasan, color: '#f59e0b' },
    { name: 'harmonisasi', count: statusCounts.harmonisasi, color: '#6366f1' },
    { name: 'pengundangan', count: statusCounts.pengundangan, color: '#10b981' },
  ];

  const handleUpdateReg = async (updatedReg: Regulation & { customTanggal?: string }) => {
    setIsSyncing(true);
    
    // Optimistic update
    setRegulations(prev => prev.map(r => r.id === updatedReg.id ? updatedReg : r));
    
    const displayDate = updatedReg.customTanggal 
      ? new Date(updatedReg.customTanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    const newHistoryItem: HistoryItem = {
      kode_reg: updatedReg.kode_reg,
      nama_regulasi: updatedReg.judul,
      tanggal: displayDate,
      status: updatedReg.status,
      keterangan: updatedReg.keterangan || 'Update status regulasi'
    };

    setHistoryData(prev => [newHistoryItem, ...prev]);

    // Sync to Google Sheets if Script URL is provided
    if (scriptUrl) {
      try {
        const sheetDate = updatedReg.customTanggal 
          ? new Date(updatedReg.customTanggal).toLocaleDateString('id-ID', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : new Date().toLocaleDateString('id-ID', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'addHistory',
            history: newHistoryItem,
            update: {
              kode_reg: updatedReg.kode_reg,
              nama_regulasi: updatedReg.judul,
              status: updatedReg.status,
              progress: updatedReg.progress,
              keterangan: updatedReg.keterangan
            },
            keterangan_sheet: {
              nama_regulasi: updatedReg.judul,
              status: updatedReg.status,
              progress: updatedReg.progress,
              keterangan: updatedReg.keterangan,
              tanggal_perubahan: sheetDate
            }
          }),
        });
        console.log('Synced to Google Sheets successfully');
        
        // Optional: Re-fetch after a short delay to ensure consistency
        // Note: Google Sheets CSV export can be cached, so this might not show immediate changes
        setTimeout(loadData, 5000);
      } catch (error) {
        console.error('Failed to sync to Google Sheets:', error);
      } finally {
        setIsSyncing(false);
      }
    } else {
      setIsSyncing(false);
    }

    setIsUpdateModalOpen(false);
    setSelectedRegForUpdate(null);
  };

  const handleDeleteHistory = (itemToDelete: HistoryItem) => {
    setHistoryToDelete(itemToDelete);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteHistory = async () => {
    if (historyToDelete) {
      setIsSyncing(true);
      
      // Optimistic delete with robust comparison
      setHistoryData(prev => prev.filter(h => 
        !(h.kode_reg.trim().toLowerCase() === historyToDelete.kode_reg.trim().toLowerCase() && 
          h.tanggal.trim() === historyToDelete.tanggal.trim() && 
          h.keterangan.trim() === historyToDelete.keterangan.trim() && 
          h.status.trim().toLowerCase() === historyToDelete.status.trim().toLowerCase())
      ));

      if (scriptUrl) {
        try {
          await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'deleteHistory',
              history: historyToDelete
            }),
          });
          console.log('Delete synced to Google Sheets');
          // Increase delay to 5 seconds as Google Sheets CSV export can be very slow to update
          setTimeout(loadData, 5000);
        } catch (error) {
          console.error('Failed to sync delete:', error);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setIsSyncing(false);
      }

      setIsDeleteConfirmOpen(false);
      setHistoryToDelete(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Modern Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] lg:relative lg:flex
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'} 
        w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300
      `}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-10 bg-emerald-500 text-white p-1 rounded-full shadow-lg border-2 border-slate-900 hover:scale-110 transition-all z-20"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-6 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-white text-2xl">BSKJI</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className={`p-8 flex flex-col items-center justify-center gap-3 ${isSidebarCollapsed ? 'lg:px-0' : ''} ${isMobileMenuOpen ? 'pt-0' : ''}`}>
          <div className={`flex flex-col items-center justify-center transition-all duration-300 ${isSidebarCollapsed ? 'lg:gap-0' : 'gap-1'}`}>
            <span className={`font-display font-black text-white leading-none tracking-tighter ${isSidebarCollapsed ? 'lg:text-xl text-4xl' : 'text-5xl'}`}>
              BSKJI
            </span>
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em] text-center mt-2"
              >
                Kementerian Perindustrian
              </motion.p>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
          )}
          
          <SidebarLink 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeMenu === 'dashboard'} 
            onClick={() => {
              setActiveMenu('dashboard');
              setIsMobileMenuOpen(false);
            }} 
            collapsed={isSidebarCollapsed && !isMobileMenuOpen}
          />
          <SidebarLink 
            icon={<Table size={20} />} 
            label="Dataset" 
            active={activeMenu === 'dataset'} 
            onClick={() => {
              setActiveMenu('dataset');
              setIsMobileMenuOpen(false);
            }} 
            collapsed={isSidebarCollapsed && !isMobileMenuOpen}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Modern Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="font-display text-lg lg:text-xl font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
              Program Penyusunan Prioritas
            </h2>
            <div className="hidden sm:block h-4 w-px bg-slate-200" />
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors relative">
              <User size={16} />
              <select 
                className="bg-transparent border-none focus:ring-0 cursor-pointer appearance-none pr-6"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="All">Semua Unit Kerja</option>
                {units.map((unit, index) => (
                  <option key={`unit-header-${unit}-${index}`} value={unit}>{unit}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 pointer-events-none" />
            </div>
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 lg:px-4 py-2 text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors relative">
              <Calendar size={16} />
              <select 
                className="bg-transparent border-none focus:ring-0 cursor-pointer appearance-none pr-6"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
              >
                <option value="All">Semua Tahun</option>
                {years.map((year, index) => (
                  <option key={`year-header-${year}-${index}`} value={year}>{year}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 pointer-events-none" />
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto relative scrollbar-thin">
          {/* Background Theme */}
          <div 
            className="absolute inset-0 z-0 opacity-5 pointer-events-none bg-gradient-to-br from-slate-100 to-white"
          />
          
          <div className="relative z-10 p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[1600px] mx-auto">
            {activeMenu === 'dashboard' ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <StatCard 
                  label="Total Regulasi" 
                  value={totalRegulasi.toString()} 
                  trend={selectedYear === 'All' ? "Total" : `Tahun ${selectedYear}`}
                  icon={<FileText className="text-red-500" />} 
                  color="red"
                  getStatCardColors={getStatCardColors}
                />
                <StatCard 
                  label="Regulasi Selesai" 
                  value={(statusCounts.selesai + statusCounts.pengundangan).toString()} 
                  trend={`${(((statusCounts.selesai + statusCounts.pengundangan) / (totalRegulasi || 1)) * 100).toFixed(0)}%`}
                  icon={<CheckCircle2 className="text-emerald-500" />} 
                  color="emerald"
                  getStatCardColors={getStatCardColors}
                />
                <StatCard 
                  label="Progress Rata-rata" 
                  value={`${avgProgress}%`} 
                  trend="Overall" 
                  icon={<TrendingUp className="text-indigo-500" />} 
                  color="indigo"
                  getStatCardColors={getStatCardColors}
                />
              </div>

              {/* Main Dashboard Section */}
              <div className="flex flex-col gap-8">
                {/* Status Distribution */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-display font-bold text-slate-800 text-lg">Status Progres</h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {selectedYear === 'All' ? 'Semua Tahun' : `Tahun ${selectedYear}`} • {selectedUnit === 'All' ? 'Semua Unit' : selectedUnit}
                      </p>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
                  </div>

                  {/* Chart Section */}
                  <div className="h-64 w-full mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar 
                          dataKey="count" 
                          radius={[4, 4, 0, 0]} 
                          barSize={30}
                        >
                          {barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* List Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex flex-col gap-6 bg-white sticky top-0 z-[5]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 p-2 rounded-xl">
                          <Table className="text-indigo-600" size={20} />
                        </div>
                        <h3 className="font-display font-bold text-slate-800 text-lg">Daftar Regulasi Prioritas</h3>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 md:flex-none">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text" 
                            placeholder="Cari regulasi..." 
                            className="pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-full md:w-64 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>

                        {/* Filter Toggle */}
                        <button 
                          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                          className={`p-2.5 rounded-xl transition-all flex items-center gap-2 border ${
                            isFilterPanelOpen 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Filter size={18} />
                          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Filter</span>
                        </button>

                        {/* Reset Button */}
                        {(searchQuery || selectedYear !== 'All' || selectedUnit !== 'All') && (
                          <button 
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedYear('All');
                              setSelectedUnit('All');
                            }}
                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors border border-red-100"
                            title="Hapus semua filter"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Advanced Filter Panel */}
                    <AnimatePresence>
                      {isFilterPanelOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 pb-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 mt-2">
                            {/* Unit Kerja Filter */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Unit Kerja</label>
                              <div className="flex flex-wrap gap-2">
                                <button 
                                  onClick={() => setSelectedUnit('All')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    selectedUnit === 'All' 
                                      ? 'bg-slate-900 text-white' 
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                                >
                                  Semua Unit
                                </button>
                                {units.map((unit, index) => (
                                  <button 
                                    key={`unit-filter-${unit}-${index}`}
                                    onClick={() => setSelectedUnit(unit)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      selectedUnit === unit 
                                        ? 'bg-indigo-500 text-white' 
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                  >
                                    {unit}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Year Picker (Calendar Style) */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Tahun Anggaran</label>
                              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                <button 
                                  onClick={() => setSelectedYear('All')}
                                  className={`px-2 py-2 rounded-lg text-xs font-bold transition-all border ${
                                    selectedYear === 'All' 
                                      ? 'bg-slate-900 text-white border-slate-900' 
                                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  Semua
                                </button>
                                {years.map((year, index) => (
                                  <button 
                                    key={`year-picker-${year}-${index}`}
                                    onClick={() => setSelectedYear(year)}
                                    className={`px-2 py-2 rounded-lg text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
                                      selectedYear === year 
                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' 
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    <Calendar size={12} className={selectedYear === year ? 'text-white' : 'text-slate-300'} />
                                    {year}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Active Filters Summary */}
                    {(selectedYear !== 'All' || selectedUnit !== 'All' || searchQuery) && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter Aktif:</span>
                        {searchQuery && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100">
                            Search: "{searchQuery}"
                            <X size={10} className="cursor-pointer" onClick={() => setSearchQuery('')} />
                          </div>
                        )}
                        {selectedUnit !== 'All' && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100">
                            Unit: {selectedUnit}
                            <X size={10} className="cursor-pointer" onClick={() => setSelectedUnit('All')} />
                          </div>
                        )}
                        {selectedYear !== 'All' && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold border border-emerald-100">
                            Tahun: {selectedYear}
                            <X size={10} className="cursor-pointer" onClick={() => setSelectedYear('All')} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12">No</th>
                          <th 
                            className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => handleSort('judul')}
                          >
                            <div className="flex items-center gap-1">
                              Nama Regulasi
                              {sortConfig.key === 'judul' && (
                                sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => handleSort('pengusul')}
                          >
                            <div className="flex items-center gap-1">
                              Unit Kerja
                              {sortConfig.key === 'pengusul' && (
                                sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => handleSort('tahun')}
                          >
                            <div className="flex items-center gap-1">
                              Tahun
                              {sortConfig.key === 'tahun' && (
                                sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center gap-1">
                              Status
                              {sortConfig.key === 'status' && (
                                sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                              )}
                            </div>
                          </th>
                          <th 
                            className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => handleSort('progress')}
                          >
                            <div className="flex items-center gap-1">
                              Progress
                              {sortConfig.key === 'progress' && (
                                sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                              )}
                            </div>
                          </th>
                          <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keterangan</th>
                          <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Edit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedRegulations.length > 0 ? (
                          paginatedRegulations.map((reg, index) => (
                            <tr key={`${reg.id}-${index}`} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="py-5 px-6">
                                <span className="text-xs font-bold text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                              </td>
                              <td className="py-5 px-6">
                                <p 
                                  onClick={() => setSelectedReg(reg)}
                                  className="text-sm font-semibold text-slate-700 leading-relaxed line-clamp-2 max-w-md cursor-pointer hover:text-emerald-600 transition-colors"
                                  title={reg.judul}
                                >
                                  {reg.judul}
                                </p>
                              </td>
                              <td className="py-5 px-6">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                  {reg.pengusul}
                                </span>
                              </td>
                              <td className="py-5 px-6">
                                <span className="text-xs font-bold text-slate-600">{reg.tahun}</span>
                              </td>
                              <td className="py-5 px-6">
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${getStatusColorClass(reg.status)}`} />
                                  <span className="text-xs font-medium text-slate-600 capitalize">{reg.status}</span>
                                </div>
                              </td>
                              <td className="py-5 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-20">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${reg.progress}%` }}
                                      className={`h-full ${getStatusColorClass(reg.status)}`}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-slate-700">{reg.progress}%</span>
                                </div>
                              </td>
                              <td className="py-5 px-6">
                                <button 
                                  onClick={() => setSelectedReg(reg)}
                                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all inline-block"
                                  title="Lihat Detail"
                                >
                                  <Eye size={16} />
                                </button>
                              </td>
                              <td className="py-5 px-6">
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => {
                                      setSelectedRegForUpdate(reg);
                                      setIsUpdateModalOpen(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all inline-block"
                                    title="Update Status"
                                  >
                                    <RefreshCw size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr key="no-data-row">
                            <td colSpan={8} className="py-20 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                                  <Search size={32} />
                                </div>
                                <p className="text-sm font-bold text-slate-400">Tidak ada regulasi ditemukan</p>
                                <button 
                                  onClick={() => {
                                    setSearchQuery('');
                                    setSelectedYear('All');
                                    setSelectedUnit('All');
                                  }}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                >
                                  Reset Filter
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-6 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Menampilkan {paginatedRegulations.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredRegulations.length)} dari {filteredRegulations.length} usulan</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">Halaman {currentPage} dari {totalPages || 1}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                          Sebelumnya
                        </button>
                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages || totalPages === 0}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-emerald-100 p-3 rounded-2xl">
                    <Table className="text-emerald-600" size={28} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-2xl">Konfigurasi Dataset</h3>
                    <p className="text-slate-500 font-medium">Hubungkan sistem monitoring dengan Google Sheets</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">URL Google Sheet (Utama)</label>
                      <div className="relative">
                        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          value={sheetUrl}
                          onChange={(e) => setSheetUrl(e.target.value)}
                          placeholder="Tempel link Google Sheet Anda di sini..."
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">GID Sheet History</label>
                      <div className="relative">
                        <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          value={historyGid}
                          onChange={(e) => setHistoryGid(e.target.value)}
                          placeholder="Contoh: 1585102885"
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Google Apps Script URL (Untuk Write/Update)</label>
                    <div className="relative">
                      <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={scriptUrl}
                        onChange={(e) => setScriptUrl(e.target.value)}
                        placeholder="Tempel URL Web App Google Apps Script Anda di sini..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-600"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 italic">
                      Digunakan untuk mengirim data update kembali ke Google Sheets secara otomatis.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setIsResetConfirmOpen(true)}
                      className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                      <X size={18} />
                      Reset Cache
                    </button>
                    <button 
                      onClick={loadData}
                      disabled={isConnecting}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isConnecting ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                      {isConnected ? 'Sinkronisasi Sekarang' : 'Hubungkan'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className={`p-6 rounded-2xl border transition-all ${isConnected ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {isConnected ? 'Terhubung' : 'Offline'}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-800 mb-1">Status Koneksi</p>
                      <p className="text-xs text-slate-500">
                        {isConnected ? 'Berhasil terhubung ke Google Sheets API' : 'Tidak ada koneksi aktif ditemukan'}
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sinkronisasi Terakhir</span>
                        <span className="text-[10px] font-bold text-slate-500">2 menit yang lalu</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 mb-1">Penyegaran Otomatis</p>
                      <p className="text-xs text-slate-500">Data disinkronkan setiap 5 menit secara otomatis</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
                    <div className="bg-amber-100 p-2 rounded-xl h-fit">
                      <Info className="text-amber-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-900 mb-1">Catatan Penting</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Pastikan Google Sheet Anda dibagikan ke "Siapa saja yang memiliki link" sebagai "Pengakses Lihat-saja" atau Anda telah memberikan izin akses ke sheet pribadi Anda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Minimal Footer */}
        <footer className="px-4 lg:px-8 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>BSKJI Kementerian Perindustrian</span>
          <span className="hidden sm:inline">•</span>
          <span>© 2024 Sistem Monitoring Prioritas</span>
        </footer>
      </main>
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReg && (
          <div key="detail-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              key="detail-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-100 p-1.5 rounded-lg">
                    <FileText className="text-emerald-600" size={18} />
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-sm">Detail Regulasi</h3>
                </div>
                <button 
                  onClick={() => setSelectedReg(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nama Regulasi</label>
                  <p className="text-base font-semibold text-slate-800 leading-snug">
                    {selectedReg.judul}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Unit Pengusul</label>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider inline-block">
                      {selectedReg.pengusul}
                    </span>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tahun</label>
                    <span className="text-xs font-bold text-slate-700">{selectedReg.tahun}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColorClass(selectedReg.status)}`} />
                      <span className="text-xs font-bold text-slate-700 capitalize">{selectedReg.status}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Progress</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getStatusColorClass(selectedReg.status)}`}
                          style={{ width: `${selectedReg.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-800">{selectedReg.progress}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Keterangan</label>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    {(() => {
                      const latestHistory = historyData.find(h => h.kode_reg.trim().toLowerCase() === selectedReg.kode_reg.trim().toLowerCase());
                      const displayKeterangan = latestHistory ? latestHistory.keterangan : selectedReg.keterangan;
                      
                      return displayKeterangan ? (
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          "{displayKeterangan}"
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Tidak ada keterangan.</p>
                      );
                    })()}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">History Perubahan</label>
                    <div className="flex items-center gap-2">
                      {lastSyncTime && (
                        <span className="text-[8px] text-slate-400 font-medium">Terakhir sinkron: {lastSyncTime}</span>
                      )}
                      <button 
                        onClick={loadData}
                        disabled={isConnecting}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-all flex items-center gap-1"
                        title="Refresh dari Database"
                      >
                        <RefreshCw size={10} className={isConnecting ? 'animate-spin' : ''} />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">Refresh</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[100px_100px_1fr] gap-4 px-4 py-2 bg-slate-50 rounded-t-xl border-x border-t border-slate-200">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Tanggal Perubahan</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Status</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Keterangan</span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto border border-slate-200 rounded-b-xl scrollbar-thin bg-white">
                    {historyData.filter(h => h.kode_reg.trim().toLowerCase() === selectedReg.kode_reg.trim().toLowerCase()).length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {historyData
                          .filter(h => h.kode_reg.trim().toLowerCase() === selectedReg.kode_reg.trim().toLowerCase())
                          .map((item, idx) => (
                            <div key={`history-${item.kode_reg}-${item.tanggal}-${idx}`} className="grid grid-cols-[100px_100px_1fr] gap-4 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                              <span className="text-[10px] font-bold text-slate-700">{item.tanggal}</span>
                              <div>
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-bold uppercase tracking-wider inline-block">
                                  {item.status}
                                </span>
                              </div>
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[11px] text-slate-600 leading-relaxed">{item.keterangan}</p>
                                <button 
                                  onClick={() => handleDeleteHistory(item)}
                                  className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                                  title="Hapus Progress"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-[10px] text-slate-400 font-medium">Belum ada history perubahan</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Update Modal */}
      <AnimatePresence>
        {isUpdateModalOpen && selectedRegForUpdate && (
          <div key="update-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              key="update-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-100 p-1.5 rounded-lg">
                    <RefreshCw className="text-indigo-600" size={18} />
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-sm">Update Progress Regulasi</h3>
                </div>
                <button 
                  onClick={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedRegForUpdate(null);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const status = formData.get('status') as string;
                  const keterangan = formData.get('keterangan') as string;
                  const progress = parseInt(formData.get('progress') as string);
                  const customTanggal = formData.get('tanggal') as string;
                  
                  handleUpdateReg({
                    ...selectedRegForUpdate!,
                    status,
                    keterangan,
                    progress,
                    customTanggal
                  });
                }}
                className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)]"
              >
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Nama Regulasi</label>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedRegForUpdate.judul}
                  </p>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Update Status</label>
                  <select 
                    name="status"
                    value={modalStatus}
                    onChange={(e) => handleModalStatusChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-600"
                  >
                    <option value="Pengusulan">Pengusulan</option>
                    <option value="Pembahasan">Pembahasan</option>
                    <option value="Harmonisasi">Harmonisasi</option>
                    <option value="Pengundangan">Pengundangan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Perubahan Tanggal</label>
                  <input 
                    type="date" 
                    name="tanggal"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Progress (%)</label>
                  <select 
                    name="progress"
                    value={modalProgress}
                    onChange={(e) => setModalProgress(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-600"
                  >
                    <option value="0">0%</option>
                    <option value="25">25%</option>
                    <option value="50">50%</option>
                    <option value="75">75%</option>
                    <option value="100">100%</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Keterangan / Progress Detail</label>
                  <textarea 
                    name="keterangan"
                    rows={3}
                    placeholder="Masukkan detail progress atau keterangan terbaru..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-600 resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsUpdateModalOpen(false);
                      setSelectedRegForUpdate(null);
                    }}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isSyncing}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div key="delete-confirm-overlay" className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              key="delete-confirm-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center"
            >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Riwayat?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Apakah Anda yakin ingin menghapus riwayat progress ini? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setIsDeleteConfirmOpen(false);
                      setHistoryToDelete(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmDeleteHistory}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      <AnimatePresence>
        {isResetConfirmOpen && (
          <div key="reset-confirm-overlay" className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              key="reset-confirm-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center"
            >
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Reset Cache?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Hapus cache lokal dan muat ulang data dari Google Sheets?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20"
                  >
                    Ya, Reset
                  </button>
                </div>
              </motion.div>
            </div>
          )}
      </AnimatePresence>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick, collapsed }: { icon: ReactNode, label: string, active: boolean, onClick: () => void, collapsed?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
        active 
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      } ${collapsed ? 'justify-center px-0' : ''}`}
      title={collapsed ? label : ''}
    >
      <div className="shrink-0">{icon}</div>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {label}
        </motion.span>
      )}
    </button>
  );
}

function StatCard({ label, value, trend, icon, color, getStatCardColors }: { label: string, value: string, trend: string, icon: ReactNode, color: string, getStatCardColors: (c: string) => string }) {
  const isPositive = trend.startsWith('+');
  
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-5 lg:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${getStatCardColors(color)}`}>
          {icon}
        </div>
        <span className={`text-[10px] lg:text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-2xl lg:text-3xl font-display font-bold text-slate-800 tracking-tight">{value}</h4>
      </div>
    </motion.div>
  );
}


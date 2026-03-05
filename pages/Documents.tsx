import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Plus, Calendar, Upload, Trash2, AlertTriangle, CheckCircle, Shield, CreditCard, FileCheck } from 'lucide-react';
import { Document, Vehicle } from '../types';
import { fetchVehicles, fetchDocuments, addDocument, deleteDocument } from '../services/firestoreService';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

export const Documents: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [newDoc, setNewDoc] = useState<Partial<Document>>({
    type: 'License',
    title: '',
    expiryDate: '',
    notes: ''
  });

  useEffect(() => {
    const loadVehicles = async () => {
      const v = await fetchVehicles();
      setVehicles(v);
      if (v.length > 0) setSelectedVehicleId(v[0].id);
    };
    loadVehicles();
  }, []);

  // Gerçek Firestore'dan belgeler yükle
  useEffect(() => {
    if (!selectedVehicleId) return;
    const load = async () => {
      const docs = await fetchDocuments(selectedVehicleId);
      setDocuments(docs);
    };
    load();
  }, [selectedVehicleId]);

  const handleAddDocument = async () => {
    if (!newDoc.title || !newDoc.type) return;
    setLoading(true);
    try {
      const id = await addDocument({
        vehicleId: selectedVehicleId,
        type: newDoc.type as any,
        title: newDoc.title!,
        expiryDate: newDoc.expiryDate,
        notes: newDoc.notes,
      });
      setDocuments(prev => [{ id, vehicleId: selectedVehicleId, type: newDoc.type as any, title: newDoc.title!, expiryDate: newDoc.expiryDate, notes: newDoc.notes }, ...prev]);
      setShowAddModal(false);
      setNewDoc({ type: 'License', title: '', expiryDate: '', notes: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    await deleteDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return { color: 'text-slate-500', bg: 'bg-slate-100', text: 'Süresiz' };
    const days = differenceInDays(new Date(dateStr), new Date());
    if (days < 0) return { color: 'text-red-600', bg: 'bg-red-100', text: 'Süresi Dolmuş' };
    if (days < 30) return { color: 'text-amber-600', bg: 'bg-amber-100', text: `${days} gün kaldı` };
    return { color: 'text-emerald-600', bg: 'bg-emerald-100', text: 'Geçerli' };
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'License': return <FileText size={24} className="text-blue-500" />;
      case 'Insurance': return <Shield size={24} className="text-purple-500" />;
      case 'Inspection': return <FileCheck size={24} className="text-emerald-500" />;
      default: return <FileText size={24} className="text-slate-500" />;
    }
  };

  return (
    <>
      <div className="p-5 space-y-6 animate-fadeIn pb-24">
        <header className="flex justify-between items-center pt-2">
          <div className="flex items-center space-x-3">
              <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
                  <ChevronLeft size={24} className="text-white" />
              </button>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dijital Torpido</h1>
          </div>
          <button 
              onClick={() => setShowAddModal(true)}
              className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition shadow-lg shadow-blue-500/30 text-white"
          >
              <Plus size={24} />
          </button>
        </header>

        {/* Vehicle Selector */}
        <div className="flex space-x-3 overflow-x-auto pb-2 hide-scrollbar">
          {vehicles.map(v => (
              <button
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      selectedVehicleId === v.id 
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
              >
                  {v.plate}
              </button>
          ))}
        </div>

        {/* Documents List */}
        <div className="grid gap-4">
          {documents.map(doc => {
              const status = getExpiryStatus(doc.expiryDate);
              return (
                  <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                      <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                  {getIcon(doc.type)}
                              </div>
                              <div>
                                  <h3 className="font-bold text-slate-900 dark:text-white">{doc.title}</h3>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{doc.type === 'License' ? 'Ruhsat' : doc.type === 'Insurance' ? 'Sigorta' : 'Diğer'}</p>
                              </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
                              {status.text}
                          </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
                          <div className="flex items-center space-x-2">
                              <Calendar size={16} />
                              <span>Bitiş: {doc.expiryDate ? format(new Date(doc.expiryDate), 'd MMM yyyy', { locale: tr }) : '-'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                              {doc.notes && <span className="text-xs truncate max-w-[120px]">{doc.notes}</span>}
                              <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition"
                              >
                                  <Trash2 size={14} />
                              </button>
                          </div>
                      </div>
                  </div>
              );
          })}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <div 
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 space-y-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Yeni Belge Ekle</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Belge Tipi</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['License', 'Insurance', 'Inspection'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setNewDoc({ ...newDoc, type: type as any })}
                                    className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                                        newDoc.type === type 
                                        ? 'bg-blue-600 text-white border-blue-600' 
                                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                    }`}
                                >
                                    {type === 'License' ? 'Ruhsat' : type === 'Insurance' ? 'Sigorta' : 'Muayene'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Başlık</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition text-slate-900 dark:text-white"
                            placeholder="Örn: Trafik Sigortası"
                            value={newDoc.title}
                            onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bitiş Tarihi</label>
                        <input 
                            type="date" 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition text-slate-900 dark:text-white"
                            value={newDoc.expiryDate}
                            onChange={e => setNewDoc({ ...newDoc, expiryDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Notlar</label>
                        <textarea 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition text-slate-900 dark:text-white h-20 resize-none"
                            placeholder="Poliçe no, detaylar..."
                            value={newDoc.notes}
                            onChange={e => setNewDoc({ ...newDoc, notes: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex space-x-3 pt-2">
                    <button 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        İptal
                    </button>
                    <button 
                        onClick={handleAddDocument}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition disabled:opacity-50"
                    >
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

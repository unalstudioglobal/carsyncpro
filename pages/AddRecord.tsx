import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Camera, Upload, X, Bell, Calendar as CalIcon, DollarSign, Fuel, Droplet, Disc, Wrench, ClipboardCheck, Sparkles, RotateCw, Battery, Scan, MousePointerClick } from 'lucide-react';
import { analyzeInvoiceImage } from '../services/geminiService';
import { addLog, addAppointment } from '../services/firestoreService';
import { OnboardingGuide } from '../components/OnboardingGuide';
import { toast } from '../services/toast';

import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

export const AddRecord: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  
  // Check for navigation state
  const navState = location.state as { serviceType?: string; date?: string; vehicleId?: string } | null;

  const [formData, setFormData] = useState({
    vehicleId: navState?.vehicleId || '',
    serviceType: navState?.serviceType || 'Yağ Değişimi',
    mileage: '',
    date: navState?.date ? new Date(navState.date) : new Date(),
    cost: '',
    notes: '',
    reminder: true,
    reminderKm: 5000,
    customReminder: false,
    isPaid: true,
    paymentMethod: 'Credit Card'
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const dateLocale = i18n.language === 'en' ? enUS : tr;

  const QUICK_ACTIONS = [
    { label: t('add_record.action_fuel'), value: 'Yakıt Alımı', icon: Fuel },
    { label: t('add_record.action_oil'), value: 'Yağ Değişimi', icon: Droplet },
    { label: t('add_record.action_maint'), value: 'Periyodik Bakım', icon: Wrench },
    { label: t('add_record.action_tire'), value: 'Lastik Değişimi', icon: Disc },
    { label: t('add_record.action_rotation'), value: 'Lastik Rotasyonu', icon: RotateCw },
    { label: t('add_record.action_inspection'), value: 'Muayene', icon: ClipboardCheck },
    { label: t('add_record.action_battery'), value: 'Akü Değişimi', icon: Battery },
    { label: t('add_record.action_wash'), value: 'Yıkama & Detay', icon: Sparkles }
  ];

  const onboardingSteps = [
    {
      title: t('add_record.tour_quick_title'),
      description: t('add_record.tour_quick_desc'),
      icon: MousePointerClick
    },
    {
      title: t('add_record.tour_ai_title'),
      description: t('add_record.tour_ai_desc'),
      icon: Scan
    },
    {
      title: t('add_record.tour_remind_title'),
      description: t('add_record.tour_remind_desc'),
      icon: Bell
    }
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        
        // Trigger Gemini Analysis
        setLoading(true);
        const data = await analyzeInvoiceImage(base64.split(',')[1], file.type);
        setLoading(false);

        if (!data.error) {
           setFormData(prev => ({
             ...prev,
             cost: data.totalCost ? String(data.totalCost) : prev.cost,
             date: data.date ? new Date(data.date) : prev.date,
             notes: data.notes || prev.notes,
             mileage: data.mileage ? String(data.mileage) : prev.mileage,
             serviceType: data.serviceType || prev.serviceType
           }));
           toast.success(t('add_record.ai_success'));
        } else {
            toast.error(data.error || t('add_record.ai_error'));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.mileage && !formData.cost) {
      toast.error(t('add_record.err_req'));
      return;
    }
    setSaving(true);
    try {
      await addLog({
        vehicleId: formData.vehicleId || 'unknown',
        type: formData.serviceType,
        date: format(formData.date, 'yyyy-MM-dd'),
        cost: parseFloat(formData.cost) || 0,
        mileage: parseInt(formData.mileage) || 0,
        notes: formData.notes,
        icon: formData.serviceType.includes('Yakıt') ? 'fuel' : 'maintenance',
        imageUrl: imagePreview || undefined,
        paymentStatus: formData.isPaid ? 'Paid' : 'Pending',
        paymentMethod: formData.isPaid ? formData.paymentMethod as any : undefined
      });

      if (formData.reminder) {
          const reminderDate = new Date(formData.date);
          reminderDate.setMonth(reminderDate.getMonth() + 6); // Default 6 months

          await addAppointment({
              vehicleId: formData.vehicleId || 'unknown',
              serviceType: 'Periyodik Bakım',
              date: format(reminderDate, 'yyyy-MM-dd'),
              status: 'Pending',
              notes: t('add_record.reminder_note', { km: formData.reminderKm })
          });
      }

      toast.success(t('add_record.success_save'));
      navigate(-1);
    } catch (err) {
      console.error('Log kaydetme hatası:', err);
      toast.error(t('add_record.err_save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 space-y-6">
      <OnboardingGuide tourKey="tour_add_record_v1" steps={onboardingSteps} />

      <header className="flex justify-between items-center pt-2">
        <button onClick={() => navigate(-1)} className="text-blue-500 font-medium text-base p-2 -ml-2">{t('add_record.cancel')}</button>
        <h1 className="text-lg font-bold">{t('add_record.title')}</h1>
        <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 px-5 py-2 rounded-full text-sm font-semibold active:scale-95 transition disabled:opacity-50"
        >
            {saving ? t('add_record.saving') : t('add_record.save')}
        </button>
      </header>

      <div className="space-y-6">
        
        {/* Service Type */}
        <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 tracking-wider ml-1">{t('add_record.service_type')}</label>
            
            {/* Quick Select Chips */}
            <div className="flex space-x-3 overflow-x-auto pb-3 -mx-1 px-1 hide-scrollbar">
                {QUICK_ACTIONS.map((action) => (
                    <button
                        key={action.value}
                        onClick={() => setFormData({...formData, serviceType: action.value})}
                        className={`flex-shrink-0 px-5 py-3 rounded-full text-sm font-bold border transition-all flex items-center space-x-2 ${
                            formData.serviceType === action.value
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40 scale-105'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                    >
                        <action.icon size={16} />
                        <span>{action.label}</span>
                    </button>
                ))}
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 flex justify-between items-center">
                <select 
                    value={formData.serviceType}
                    onChange={e => setFormData({...formData, serviceType: e.target.value})}
                    className="bg-transparent w-full outline-none text-white appearance-none text-base"
                >
                    <option value="Yağ Değişimi">{t('add_record.type_oil')}</option>
                    <option value="Yakıt Alımı">{t('add_record.type_fuel')}</option>
                    <option value="Periyodik Bakım">{t('add_record.type_maint')}</option>
                    <option value="Lastik Değişimi">{t('add_record.type_tire')}</option>
                    <option value="Lastik Rotasyonu">{t('add_record.type_rotation')}</option>
                    <option value="Fren Servisi">{t('add_record.type_brake')}</option>
                    <option value="Akü Değişimi">{t('add_record.type_battery')}</option>
                    <option value="Muayene">{t('add_record.type_inspection')}</option>
                    <option value="Yıkama & Detay">{t('add_record.type_wash')}</option>
                    <option value="Diğer">{t('add_record.type_other')}</option>
                </select>
            </div>
        </div>

        {/* Odometer */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 tracking-wider ml-1">{t('add_record.odometer')}</label>
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 flex items-center">
                <input 
                    type="number" 
                    placeholder={t('add_record.odometer_ph')}
                    value={formData.mileage}
                    onChange={e => setFormData({...formData, mileage: e.target.value})}
                    className="bg-transparent w-full outline-none text-white placeholder-slate-500 text-base"
                />
                <span className="text-slate-500 text-sm">{t('add_record.km')}</span>
            </div>
        </div>

        {/* Date — React Day Picker */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 tracking-wider ml-1">{t('add_record.date')}</label>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div 
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="flex items-center justify-between cursor-pointer"
                >
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500">
                            <CalIcon size={20} />
                        </div>
                        <span className="text-white font-medium">
                            {format(formData.date, 'd MMMM yyyy', { locale: dateLocale })}
                        </span>
                    </div>
                    <ChevronRight size={20} className={`text-slate-500 transition-transform ${isCalendarOpen ? 'rotate-90' : ''}`} />
                </div>

                {isCalendarOpen && (
                    <div className="mt-4 pt-4 border-t border-slate-700 flex justify-center animate-fadeIn">
                        <DayPicker
                            mode="single"
                            selected={formData.date}
                            onSelect={(date) => {
                                if (date) {
                                    setFormData({ ...formData, date });
                                    setIsCalendarOpen(false);
                                }
                            }}
                            locale={dateLocale}
                            modifiersClassNames={{
                                selected: 'bg-blue-600 text-white rounded-full',
                                today: 'text-blue-400 font-bold'
                            }}
                            styles={{
                                caption: { color: 'white' },
                                head_cell: { color: '#94a3b8' },
                                cell: { color: 'white' },
                                nav_button_previous: { color: 'white' },
                                nav_button_next: { color: 'white' },
                            }}
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Cost */}
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 tracking-wider ml-1">{t('add_record.cost')}</label>
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 flex items-center">
                <span className="text-slate-500 mr-2 text-lg">₺</span>
                <input 
                    type="number" 
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={e => setFormData({...formData, cost: e.target.value})}
                    className="bg-transparent w-full outline-none text-white placeholder-slate-500 text-lg font-medium"
                />
                <DollarSign size={20} className="text-slate-500" />
            </div>
        </div>
        
        {/* Notes */}
        <div className="space-y-2">
             <label className="text-xs font-bold text-slate-400 tracking-wider ml-1">{t('add_record.notes')}</label>
             <textarea 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none text-white placeholder-slate-500 min-h-[120px] text-base"
                placeholder={t('add_record.notes_ph')}
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
             ></textarea>
        </div>

        {/* Upload */}
        <div className="space-y-2">
             <label className="text-xs font-bold text-slate-400 tracking-wider ml-1">{t('add_record.upload_title')}</label>
             
             {!imagePreview ? (
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:bg-slate-800/50 transition cursor-pointer group"
                 >
                    {loading ? (
                        <div className="flex flex-col items-center animate-pulse">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
                            <span className="text-sm font-bold text-blue-400">{t('add_record.upload_ai_loading')}</span>
                        </div>
                    ) : (
                        <>
                            <div className="bg-slate-700/50 p-4 rounded-full mb-3 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                <Upload size={32} />
                            </div>
                            <span className="text-sm font-bold text-slate-300">{t('add_record.upload_btn')}</span>
                            <span className="text-xs text-slate-500 mt-1">{t('add_record.upload_ai_desc')}</span>
                        </>
                    )}
                 </div>
             ) : (
                 <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-600 group flex items-center justify-center bg-slate-800">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                        <Camera size={32} className="text-slate-600" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-2 hover:bg-red-600 transition"
                        >
                            <X size={16} />
                            <span>{t('add_record.upload_remove')}</span>
                        </button>
                    </div>
                    {loading && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
                             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3"></div>
                             <span className="text-white font-bold text-sm">{t('add_record.analyzing')}</span>
                        </div>
                    )}
                 </div>
             )}
             
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>

        {/* Payment Status */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                    <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-500">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-base">{t('add_record.payment_title')}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{t('add_record.payment_desc')}</div>
                    </div>
                </div>
                <div 
                    onClick={() => setFormData({...formData, isPaid: !formData.isPaid})}
                    className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${formData.isPaid ? 'bg-emerald-600' : 'bg-slate-600'}`}
                >
                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${formData.isPaid ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
            </div>

            {formData.isPaid && (
                <div className="grid grid-cols-3 gap-3 animate-fadeIn">
                    {['Credit Card', 'Cash', 'Other'].map(method => (
                        <button
                            key={method}
                            onClick={() => setFormData({...formData, paymentMethod: method})}
                            className={`text-xs py-2.5 rounded-lg font-medium border transition-colors ${
                                formData.paymentMethod === method 
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                                : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                            }`}
                        >
                            {method === 'Credit Card' ? t('add_record.pay_card') : method === 'Cash' ? t('add_record.pay_cash') : t('add_record.pay_other')}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Reminder */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="bg-blue-500/20 p-3 rounded-xl text-blue-500">
                    <Bell size={24} />
                </div>
                <div>
                    <div className="font-bold text-base">{t('add_record.reminder_title')}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t('add_record.reminder_desc')}</div>
                </div>
            </div>
            <div 
                onClick={() => setFormData({...formData, reminder: !formData.reminder})}
                className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${formData.reminder ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${formData.reminder ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
        </div>

        {formData.reminder && (
            <div className="border border-dashed border-slate-700 rounded-xl p-5">
                <p className="text-xs text-slate-400 mb-4 italic">{t('add_record.reminder_info')}</p>
                <div className="flex space-x-3 mb-3">
                    <button 
                        onClick={() => setFormData({...formData, reminderKm: 5000, customReminder: false})}
                        className={`flex-1 text-xs px-2 py-3 rounded-lg font-medium border transition-colors ${!formData.customReminder && formData.reminderKm === 5000 ? 'bg-blue-900/50 border-blue-700 text-blue-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                    >
                        5,000 km
                    </button>
                    <button 
                        onClick={() => setFormData({...formData, reminderKm: 10000, customReminder: false})}
                        className={`flex-1 text-xs px-2 py-3 rounded-lg font-medium border transition-colors ${!formData.customReminder && formData.reminderKm === 10000 ? 'bg-blue-900/50 border-blue-700 text-blue-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                    >
                        10,000 km
                    </button>
                    <button 
                        onClick={() => setFormData({...formData, customReminder: true})}
                        className={`flex-1 text-xs px-2 py-3 rounded-lg font-medium border transition-colors ${formData.customReminder ? 'bg-blue-900/50 border-blue-700 text-blue-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                    >
                        Özel
                    </button>
                </div>
                
                {formData.customReminder && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center animate-fadeIn">
                        <input 
                            type="number" 
                            placeholder={t('add_record.reminder_ph')}
                            value={formData.reminderKm || ''}
                            onChange={e => setFormData({...formData, reminderKm: parseInt(e.target.value) || 0})}
                            className="bg-transparent w-full outline-none text-white placeholder-slate-500 text-sm"
                        />
                        <span className="text-slate-500 text-xs ml-2">{t('add_record.reminder_suffix')}</span>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

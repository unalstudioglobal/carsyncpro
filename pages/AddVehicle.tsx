import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Car, Calendar, Hash, Gauge, Camera, Check, ChevronRight, AlertCircle, Save, LayoutGrid } from 'lucide-react';
import { Vehicle } from '../types';
import { addVehicle, updateVehicle } from '../services/firestoreService';
import { useData } from '../context/DataContext';
import { toast } from '../services/toast';

export const AddVehicle: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we are in edit mode
  const editVehicle = location.state?.vehicle as Vehicle | undefined;
  const { id } = useParams();
  const { t } = useTranslation();
  const { optimisticAddVehicle, optimisticUpdateVehicle } = useData();
  const isEditMode = !!id;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    plate: '',
    mileage: '',
    status: 'Sorun Yok' as Vehicle['status'],
    image: null as string | null,
    images: [] as string[]
  });

  // Initialize form if editing
  useEffect(() => {
    if (editVehicle) {
      setFormData({
        brand: editVehicle.brand,
        model: editVehicle.model,
        year: editVehicle.year.toString(),
        plate: editVehicle.plate,
        mileage: editVehicle.mileage.toString(),
        status: editVehicle.status,
        image: editVehicle.image,
        images: editVehicle.images || [editVehicle.image].filter(Boolean) as string[]
      });
    }
  }, [editVehicle]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const totalSteps = 3;

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.brand.trim()) newErrors.brand = t('add_vehicle.val_brand');

      if (!formData.model.trim()) newErrors.model = t('add_vehicle.val_model');

      const yearNum = parseInt(formData.year);
      const currentYear = new Date().getFullYear();
      if (!formData.year || isNaN(yearNum) || formData.year.length !== 4) {
        newErrors.year = t('add_vehicle.val_year_digit');
      } else if (yearNum < 1900 || yearNum > currentYear + 1) {
        newErrors.year = t('add_vehicle.val_year_range', { max: currentYear + 1 });
      }
    }

    if (currentStep === 2) {
      // Plaka Doğrulaması (TR Formatı - Boşluksuz kontrol)
      const cleanPlate = formData.plate.replace(/[\s\-]/g, '').toUpperCase();
      // Türk plaka formatı: il kodu (01-81) + 1-3 harf + 2-5 rakam. Boşluk ve tire kabul edilir.
      const plateRegex = /^(0[1-9]|[1-7][0-9]|8[01])[A-Z]{1,3}\d{2,5}$/;

      if (!formData.plate.trim()) {
        newErrors.plate = t('add_vehicle.val_plate_req');
      } else if (!plateRegex.test(cleanPlate)) {
        newErrors.plate = t('add_vehicle.val_plate_invalid');
      }

      if (!formData.mileage) {
        newErrors.mileage = t('add_vehicle.val_mileage_req');
      } else if (isNaN(Number(formData.mileage)) || Number(formData.mileage) < 0) {
        newErrors.mileage = t('add_vehicle.val_mileage_invalid');
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    } else {
      setErrors({});
    }

    return isValid;
  };

  const handleNext = async () => {
    if (validateStep(step)) {
      if (step < totalSteps) setStep(step + 1);
      else {
        setIsSaving(true);
        try {
          if (isEditMode && editVehicle) {
            const updateData = {
              brand: formData.brand,
              model: formData.model,
              year: parseInt(formData.year),
              plate: formData.plate.replace(/[\s\-]/g, '').toUpperCase(),
              mileage: parseInt(formData.mileage),
              status: formData.status,
              image: formData.images[0] || formData.image || editVehicle.image,
              images: formData.images,
            };
            optimisticUpdateVehicle(editVehicle.id, updateData);
            await updateVehicle(editVehicle.id, updateData);
          } else {
            const newVehicleData = {
              brand: formData.brand,
              model: formData.model,
              year: parseInt(formData.year),
              plate: formData.plate.replace(/[\s\-]/g, '').toUpperCase(),
              mileage: parseInt(formData.mileage),
              status: formData.status,
              image: formData.images[0] || formData.image || `https://images.unsplash.com/photo-1555215695-3004980adade?auto=format&fit=crop&w=800&q=80`,
              images: formData.images,
              healthScore: 100,
              marketValueMin: 0,
              marketValueMax: 0,
              lastLogDate: new Date().toLocaleDateString('tr-TR'),
            };
            // Optimistik ekleme için geçici bir ID oluştur (Firestore gelince güncellenecek)
            optimisticAddVehicle({ id: 'temp-' + Date.now(), ...newVehicleData } as Vehicle);
            await addVehicle(newVehicleData);
          }
          toast.success(isEditMode ? t('add_vehicle.toast_edit_success') : t('add_vehicle.toast_add_success'));
          navigate('/');
        } catch (err) {
          console.error('Araç kaydetme hatası:', err);
          toast.error(t('add_vehicle.toast_error'));
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  // Helper to clear specific error when user types
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const renderStep1 = () => (
    <div className="space-y-5 animate-fadeIn">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 ml-1">{t('add_vehicle.label_brand')}</label>
        <div className={`flex items-center bg-slate-800 rounded-xl px-4 py-4 border ${errors.brand ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} focus-within:border-blue-500 transition-colors`}>
          <Car size={20} className={errors.brand ? "text-red-500" : "text-slate-500"} style={{ marginRight: '0.75rem' }} />
          <input
            type="text"
            placeholder={t('add_vehicle.ph_brand')}
            value={formData.brand}
            onChange={(e) => {
              setFormData({ ...formData, brand: e.target.value });
              clearError('brand');
            }}
            className="bg-transparent w-full outline-none text-white placeholder-slate-600 text-base"
            autoFocus
          />
          {errors.brand && <AlertCircle size={18} className="text-red-500 ml-2 animate-pulse" />}
        </div>
        {errors.brand && <p className="text-red-500 text-xs ml-1 font-medium animate-fadeIn">{errors.brand}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 ml-1">{t('add_vehicle.label_model')}</label>
        <div className={`flex items-center bg-slate-800 rounded-xl px-4 py-4 border ${errors.model ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} focus-within:border-blue-500 transition-colors`}>
          <Car size={20} className={errors.model ? "text-red-500" : "text-slate-500"} style={{ marginRight: '0.75rem' }} />
          <input
            type="text"
            placeholder={t('add_vehicle.ph_model')}
            value={formData.model}
            onChange={(e) => {
              setFormData({ ...formData, model: e.target.value });
              clearError('model');
            }}
            className="bg-transparent w-full outline-none text-white placeholder-slate-600 text-base"
          />
          {errors.model && <AlertCircle size={18} className="text-red-500 ml-2 animate-pulse" />}
        </div>
        {errors.model && <p className="text-red-500 text-xs ml-1 font-medium animate-fadeIn">{errors.model}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 ml-1">{t('add_vehicle.label_year')}</label>
        <div className={`flex items-center bg-slate-800 rounded-xl px-4 py-4 border ${errors.year ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} focus-within:border-blue-500 transition-colors`}>
          <Calendar size={20} className={errors.year ? "text-red-500" : "text-slate-500"} style={{ marginRight: '0.75rem' }} />
          <input
            type="number"
            placeholder={t('add_vehicle.ph_year')}
            maxLength={4}
            value={formData.year}
            onChange={(e) => {
              // Only allow numbers and max 4 chars
              if (e.target.value.length <= 4) {
                setFormData({ ...formData, year: e.target.value });
                clearError('year');
              }
            }}
            className="bg-transparent w-full outline-none text-white placeholder-slate-600 text-base"
          />
          {errors.year && <AlertCircle size={18} className="text-red-500 ml-2 animate-pulse" />}
        </div>
        {errors.year && <p className="text-red-500 text-xs ml-1 font-medium animate-fadeIn">{errors.year}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5 animate-fadeIn">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 ml-1">{t('add_vehicle.label_plate')}</label>
        <div className={`flex items-center bg-slate-800 rounded-xl px-4 py-4 border ${errors.plate ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} focus-within:border-blue-500 transition-colors`}>
          <Hash size={20} className={errors.plate ? "text-red-500" : "text-slate-500"} style={{ marginRight: '0.75rem' }} />
          <input
            type="text"
            placeholder={t('add_vehicle.ph_plate')}
            value={formData.plate}
            onChange={(e) => {
              setFormData({ ...formData, plate: e.target.value.toUpperCase() });
              clearError('plate');
            }}
            className="bg-transparent w-full outline-none text-white placeholder-slate-600 uppercase text-base"
            autoFocus
          />
          {errors.plate && <AlertCircle size={18} className="text-red-500 ml-2 animate-pulse" />}
        </div>
        {errors.plate && <p className="text-red-500 text-xs ml-1 font-medium animate-fadeIn">{errors.plate}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 ml-1">{t('add_vehicle.label_mileage')}</label>
        <div className={`flex items-center bg-slate-800 rounded-xl px-4 py-4 border ${errors.mileage ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} focus-within:border-blue-500 transition-colors`}>
          <Gauge size={20} className={errors.mileage ? "text-red-500" : "text-slate-500"} style={{ marginRight: '0.75rem' }} />
          <input
            type="number"
            placeholder={t('add_vehicle.ph_mileage')}
            min="0"
            value={formData.mileage}
            onChange={(e) => {
              setFormData({ ...formData, mileage: e.target.value });
              clearError('mileage');
            }}
            className="bg-transparent w-full outline-none text-white placeholder-slate-600 text-base"
          />
          <span className="text-slate-500 text-sm ml-2">km</span>
          {errors.mileage && <AlertCircle size={18} className="text-red-500 ml-2 animate-pulse" />}
        </div>
        {errors.mileage && <p className="text-red-500 text-xs ml-1 font-medium animate-fadeIn">{errors.mileage}</p>}
      </div>
    </div>
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const compressImage = (dataUrl: string, maxWidth = 400, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = (h * maxWidth) / w;
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl); // sıkıştırma başarısızsa orijinali kullan
      img.src = dataUrl;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const currentCount = formData.images.length;
      const newFiles = Array.from(files);

      if (currentCount >= 4) {
        toast.error(t('add_vehicle.toast_max_photos'));
        e.target.value = '';
        return;
      }

      const availableSlots = 4 - currentCount;
      const filesToProcess = newFiles.slice(0, availableSlots);

      if (newFiles.length > availableSlots) {
        toast.warning(t('add_vehicle.toast_partial_photos', { count: availableSlots }));
      }

      filesToProcess.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressed = await compressImage(reader.result as string);
          setFormData(prev => ({ ...prev, images: [...prev.images, compressed] }));
        };
        reader.readAsDataURL(file);
      });
    }
    // input'u sıfırla — aynı dosyayı tekrar seçebilmek için
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const renderStep3 = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 ml-1">{t('add_vehicle.label_photos')}</label>

        {/* Hidden Inputs */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
        />
        <input
          type="file"
          ref={cameraInputRef}
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
        />

        {/* Image Gallery */}
        {formData.images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {formData.images.map((img, idx) => (
              <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 group flex items-center justify-center bg-slate-800">
                {img ? (
                  <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                ) : (
                  <Car size={32} className="text-slate-600" />
                )}
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <AlertCircle size={14} className="rotate-45" />
                </button>
                {idx === 0 && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-600 text-[10px] font-bold text-white rounded uppercase tracking-wider">
                    {t('add_vehicle.badge_cover')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-2xl text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition active:scale-95"
          >
            <Camera size={28} className="mb-2" />
            <span className="text-xs font-bold">{t('add_vehicle.btn_camera')}</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-2xl text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition active:scale-95"
          >
            <LayoutGrid size={28} className="mb-2" />
            <span className="text-xs font-bold">{t('add_vehicle.btn_gallery')}</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 ml-1">{t('add_vehicle.label_status')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['Sorun Yok', 'Servis Gerekli', 'Acil'].map((status) => (
            <button
              key={status}
              onClick={() => setFormData({ ...formData, status: status as any })}
              className={`py-4 px-3 rounded-xl text-sm font-bold border transition active:scale-95 ${formData.status === status
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
            >
              {status === 'Sorun Yok' ? t('vehicle_status.no_issue') : status === 'Servis Gerekli' ? t('vehicle_status.service_required') : t('vehicle_status.urgent')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-5 h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between pt-2 mb-6">
        <button onClick={handleBack} className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 active:bg-slate-600 transition">
          <ChevronLeft size={24} />
        </button>
        <div className="flex space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`}></div>
          ))}
        </div>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </header>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {isEditMode ? t('add_vehicle.edit_title') : (
            <>
              {step === 1 && t('add_vehicle.step1_title')}
              {step === 2 && t('add_vehicle.step2_title')}
              {step === 3 && t('add_vehicle.step3_title')}
            </>
          )}
        </h1>
        <p className="text-slate-400 text-sm">
          {step === 1 && t('add_vehicle.step1_desc')}
          {step === 2 && t('add_vehicle.step2_desc')}
          {step === 3 && t('add_vehicle.step3_desc')}
        </p>
      </div>

      <div className="flex-1">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      <div className="mt-6">
        <button
          onClick={handleNext}
          disabled={isSaving}
          className={`btn-premium-3d w-full py-5 text-lg ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSaving ? (
            <span>{t('common.saving')}</span>
          ) : (
            <>
              <span>{step === totalSteps ? (isEditMode ? t('common.save_changes') : t('common.complete')) : t('common.continue')}</span>
              {step !== totalSteps && <ChevronRight size={20} />}
              {step === totalSteps && (isEditMode ? <Save size={20} /> : <Check size={20} />)}
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

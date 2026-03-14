import { toast } from './toast';

export interface OBDData {
  rpm: number;
  speed: number;
  odometer: number;
  coolantTemp: number;
  voltage: number;
  timestamp: number;
  activeDTCs: string[];
}

class VirtualOBDService {
  private interval: NodeJS.Timeout | null = null;
  private currentData: OBDData = {
    rpm: 0,
    speed: 0,
    odometer: 125430,
    coolantTemp: 20,
    voltage: 12.6,
    timestamp: Date.now(),
    activeDTCs: []
  };

  private listeners: ((data: OBDData) => void)[] = [];

  startSimulation(baseOdometer: number) {
    this.currentData.odometer = baseOdometer;
    if (this.interval) return;

    toast.info('OBD Simülasyonu Başlatıldı');
    
    this.interval = setInterval(() => {
      // Rastgele dalgalanmalar üret
      this.currentData = {
        ...this.currentData,
        rpm: 800 + Math.random() * 2000,
        speed: 40 + Math.random() * 60,
        odometer: this.currentData.odometer + 0.012, // Her saniye 12 metre yol
        coolantTemp: Math.min(90, this.currentData.coolantTemp + 0.5),
        voltage: 13.8 + (Math.random() - 0.5) * 0.4,
        timestamp: Date.now()
      };

      // Kritik durum simülasyonu (Binde 1 olasılıkla hata kodu)
      if (Math.random() > 0.999 && this.currentData.activeDTCs.length === 0) {
        this.currentData.activeDTCs = ['P0300'];
        toast.warning('OBD: Kritik Hata Algılandı (P0300)');
      }

      this.notifyListeners();
    }, 1000);
  }

  stopSimulation() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      toast.info('OBD Bağlantısı Kesildi');
    }
  }

  subscribe(callback: (data: OBDData) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.currentData));
  }

  getCurrentData() {
    return this.currentData;
  }
  
  isConnected() {
    return this.interval !== null;
  }
}

export const virtualOBD = new VirtualOBDService();

import { toast } from './toast';
import { addOBDData } from './firestoreService';
import { OBDData } from '../types';

class VirtualOBDService {
  private interval: NodeJS.Timeout | null = null;
  private currentVehicleId: string | null = null;
  private lastSaveTime: number = 0;
  private currentData: any = {
    rpm: 0,
    speed: 0,
    odometer: 125430,
    coolantTemp: 20,
    voltage: 12.6,
    engineLoad: 15,
    intakeTemp: 25,
    timestamp: Date.now(),
    activeDTCs: []
  };

  private listeners: ((data: OBDData) => void)[] = [];

  startSimulation(vehicleId: string, baseOdometer: number) {
    this.currentVehicleId = vehicleId;
    this.currentData.odometer = baseOdometer;
    if (this.interval) return;

    toast.info('OBD Simülasyonu Başlatıldı');
    
    this.interval = setInterval(() => {
      // Rastgele dalgalanmalar üret
      this.currentData = {
        ...this.currentData,
        rpm: 800 + Math.random() * 2000,
        speed: 40 + Math.random() * 60,
        odometer: this.currentData.odometer + 0.012,
        coolantTemp: Math.min(90, this.currentData.coolantTemp + 0.5),
        voltage: 13.8 + (Math.random() - 0.5) * 0.4,
        engineLoad: 15 + Math.random() * 10,
        intakeTemp: 25 + (Math.random() - 0.5) * 5,
        timestamp: Date.now()
      };

      // Kritik durum simülasyonu (Binde 1 olasılıkla hata kodu)
      if (Math.random() > 0.999 && this.currentData.activeDTCs.length === 0) {
        this.currentData.activeDTCs = ['P0300'];
        toast.warning('OBD: Kritik Hata Algılandı (P0300)');
        this.saveToFirestore(); // Hata oluşunca hemen kaydet
      }

      // Periyodik kayıt (Her 30 saniyede bir)
      if (Date.now() - this.lastSaveTime > 30000) {
        this.saveToFirestore();
      }

      this.notifyListeners();
    }, 1000);
  }

  private async saveToFirestore() {
    if (!this.currentVehicleId) return;
    
    try {
      await addOBDData({
        vehicleId: this.currentVehicleId,
        timestamp: new Date(),
        rpm: Math.round(this.currentData.rpm),
        speed: Math.round(this.currentData.speed),
        coolantTemp: Math.round(this.currentData.coolantTemp),
        engineLoad: Math.round(this.currentData.engineLoad),
        odometer: Math.round(this.currentData.odometer),
        intakeTemp: Math.round(this.currentData.intakeTemp),
        engineTemp: Math.round(this.currentData.coolantTemp),
        fuelRate: 0,
        errorCodes: this.currentData.activeDTCs,
        otherSensors: {
          voltage: Number(this.currentData.voltage.toFixed(2)),
        }
      });
      this.lastSaveTime = Date.now();
    } catch (error) {
      console.error('Error auto-saving OBD data:', error);
    }
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

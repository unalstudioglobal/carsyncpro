export interface DamageReport {
  severity: 'Minor' | 'Moderate' | 'Critical';
  cost: number;
  parts: string[];
  summary: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  image: string;
  images?: string[];
  mileage: number;
  lastLogDate: string;
  status: 'Sorun Yok' | 'Servis Gerekli' | 'Acil' | 'Satıldı';
  healthScore: number;
  marketValueMin: number;
  marketValueMax: number;
  damageReport?: DamageReport;
  userId?: string;
}

export interface ServiceLog {
  id: string;
  vehicleId: string;
  type: string;
  date: string;
  cost: number;
  mileage: number;
  liters?: number;
  notes?: string;
  icon?: string;
  imageUrl?: string;
  paymentStatus?: 'Pending' | 'Paid';
  paymentMethod?: 'Credit Card' | 'Cash' | 'Other';
}

export interface Appointment {
  id: string;
  vehicleId: string;
  serviceType: string;
  date: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  surname?: string;
  email: string;
  phone?: string;
  department?: string;
  avatar?: string;
  isPremium?: boolean;
  role?: 'user' | 'admin';
  createdAt?: any; // Firestore Timestamp
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetId?: string;
  targetName?: string;
  details: string;
  timestamp: any; // Firestore Timestamp
}

export interface ChartData {
  name: string;
  value: number;
}

export interface Document {
  id: string;
  vehicleId: string;
  type: 'License' | 'Insurance' | 'Inspection' | 'Other';
  title: string;
  expiryDate?: string;
  imageUrl?: string;
  notes?: string;
}

export interface TireSet {
  id: string;
  vehicleId: string;
  type: 'Summer' | 'Winter' | 'AllSeason';
  brand: string;
  size: string;
  location: 'OnVehicle' | 'Hotel' | 'Home' | 'Other';
  treadDepthFrontLeft: number;
  treadDepthFrontRight: number;
  treadDepthRearLeft: number;
  treadDepthRearRight: number;
  installationDate?: string;
  storageLocation?: string; // e.g., "Basement", "Tire Hotel X"
}

export interface WidgetConfig {
  id: string;
  enabled: boolean;
  order: number;
}
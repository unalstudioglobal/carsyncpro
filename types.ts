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
  vin?: string;
  engineType?: string;
  image: string;
  images?: string[];
  mileage: number;
  lastLogDate: string;
  status: 'ok' | 'warn' | 'urgent' | 'sold';
  healthScore: number;
  marketValueMin: number;
  marketValueMax: number;
  damageReport?: DamageReport;
  createdAt?: any;
  updatedAt?: any;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  price: number;
  odometer: number;
  fuelType: string;
  location?: string;
  createdAt?: any;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  date: string;
  serviceType: string;
  description: string;
  odometer: number;
  cost: number;
  location?: string;
  createdAt?: any;
}

export interface OBDData {
  id: string;
  vehicleId: string;
  timestamp: any;
  rpm: number;
  speed: number;
  coolantTemp: number;
  engineLoad: number;
  odometer: number;
  intakeTemp: number;
  engineTemp: number;
  fuelRate: number;
  errorCodes: string[];
  otherSensors: Record<string, any>;
}

export interface AIReport {
  id: string;
  vehicleId: string;
  timestamp: any;
  reportType: 'diagnostic' | 'fuel' | 'health' | 'driving';
  summary: string;
  detailedAnalysis: Record<string, any>;
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
  location?: string;
  phone?: string;
  reminderDays?: number;
  estimatedCost?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface GamificationData {
  xp: number;
  level: number;
  achievements: Achievement[];
  lastDailyCheckIn?: string;
  streakDays: number;
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
  gamification?: GamificationData;
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

export interface GarageGroup {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  memberUids: string[];
  vehicleIds: string[];
  createdAt?: any;
}

export type BudgetCategory = 'fuel' | 'maintenance' | 'insurance' | 'other' | 'total';

export interface BudgetGoal {
  id: string;
  vehicleId: string;
  category: BudgetCategory;
  monthlyLimit: number;
  createdAt: any;
}
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
  premiumTier?: 'individual' | 'family' | 'fleet';
  premiumPlan?: 'monthly' | 'yearly';
  premiumSince?: string;
  premiumExpiresAt?: string;
  lastPaymentId?: string;
  role: 'user' | 'admin' | 'editor';
  createdAt: any;
  lastLogin?: any;
  totalPoints?: number;
  coins?: number;
  referralCode?: string;
  fcmToken?: string;
  ipAddress?: string;
  status?: 'active' | 'inactive';
}

export interface SystemConfig {
  announcement: string;
  maintenanceMode: boolean;
  appVersion: {
    android: string;
    ios: string;
  };
  storeLinks: {
    playStore: string;
    appStore: string;
    moreAppsAndroid: string;
    moreAppsIos: string;
  };
  rewards: {
    referralPoints: number;
    dailyLoginPoints: number;
    hintCoinCost: number;
  };
  ads: {
    enabled: boolean;
    provider: 'admob' | 'facebook';
    android: {
      appId: string;
      bannerId: string;
      interstitialId: string;
      rewardedId: string;
      nativeId: string;
      openAppId: string;
    };
    ios: {
      appId: string;
      bannerId: string;
      interstitialId: string;
      rewardedId: string;
      nativeId: string;
      openAppId: string;
    };
  };
  social: {
    instagram: string;
    facebook: string;
    youtube: string;
    website: string;
  };
  features: {
    showCategories: boolean;
    showLearningZone: boolean;
    showDailyQuiz: boolean;
  };
  firebase?: {
    apiKey?: string;
    authDomain?: string;
    databaseURL?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
  auth?: {
    facebookAppId?: string;
    googleClientId?: string;
  };
}

export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  type: string;
  topic?: string | null;
  recipientCount: number | 'topic';
  sentAt: any; // Firestore Timestamp
  status: 'success' | 'failed';
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

export interface WebHomeSection {
  id: string;
  isEnabled: boolean;
  title1: string;
  title2: string;
  heading: string;
  description1: string;
  description2: string;
  image1?: string;
  image2?: string;
}

export interface WebHomeConfig {
  language: string;
  section1: WebHomeSection;
  section2: WebHomeSection;
  section3: WebHomeSection;
}
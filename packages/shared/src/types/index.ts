// ============================================
// USER TYPES
// ============================================

/**
 * User roles in the platform
 * - TENANT: User looking for rental property
 * - LANDLORD: Property owner listing properties
 * - ADMIN: Platform administrator
 */
export enum UserRole {
  TENANT = 'tenant',
  LANDLORD = 'landlord',
  ADMIN = 'admin',
}

/**
 * Tenant search types
 * - FULL_HOME: Looking for entire apartment/house
 * - ROOM_SHARING: Looking for single room in shared accommodation
 */
export enum TenantSearchType {
  FULL_HOME = 'full_home',
  ROOM_SHARING = 'room_sharing',
}

/**
 * Base user interface
 * All users (tenants, landlords, admins) share these fields
 */
export interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  role: UserRole;
  aadhaarHash?: string; // Never store actual Aadhaar, only hash
  aadhaarVerified: boolean;
  panVerified: boolean;
  profileCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tenant-specific preferences for matching algorithm
 */
export interface TenantPreferences {
  nonNegotiables: {
    budget: { min: number; max: number };
    location: string; // Office address for commute calculation
    bhkType: string[]; // e.g., ['1bhk', '2bhk']
    furnishing: Furnishing;
    petFriendly?: boolean;
    moveInDate: string; // ISO date string
  };
  mustHaves: {
    amenities: string[]; // e.g., ['gym', 'parking', 'swimming_pool']
    homeOfficeSpace?: boolean;
    gatedCommunity?: boolean;
    maxCommute?: number; // in minutes
    preferredLocations?: string[]; // neighborhood names
  };
  niceToHaves: {
    aestheticPreference?: 'modern' | 'traditional' | 'minimalist';
    communityVibe?: 'social' | 'private' | 'family-oriented';
    noiseLevel?: 'quiet' | 'normal' | 'lively';
    specialRequests?: string[];
  };
}

/**
 * Extended user profile for tenants
 */
export interface TenantProfile extends User {
  searchType: TenantSearchType;
  budget: {
    min: number;
    max: number;
  };
  preferences: TenantPreferences;
  rating: number; // 0-5 stars from landlords
  ratingCount: number;
  previousLeases: number; // rental history count
}

/**
 * Extended user profile for landlords
 */
export interface LandlordProfile extends User {
  propertyIds: string[];
  rating: number; // 0-5 stars from tenants
  ratingCount: number;
  avgTimeToRent: number; // in days
  totalTenants: number;
  subscription?: 'free' | 'pro' | 'business';
  bankAccount?: string;
  taxId?: string; // PAN for tax purposes
}

// ============================================
// PROPERTY TYPES
// ============================================

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  VILLA = 'villa',
  STUDIO = 'studio',
  PG = 'pg', // Paying Guest accommodation
}

export enum Furnishing {
  UNFURNISHED = 'unfurnished',
  SEMI_FURNISHED = 'semi_furnished',
  FULLY_FURNISHED = 'fully_furnished',
}

export enum PropertyStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  PENDING = 'pending', // Deal in progress
  ARCHIVED = 'archived', // Removed from listings
}

/**
 * Main property entity
 */
export interface Property {
  id: string;
  landlordId: string;
  
  // Location
  address: string;
  coordinates: { lat: number; lng: number };
  neighborhood: string;
  
  // Configuration
  type: PropertyType;
  configuration: string; // e.g., '2bhk', '3bhk'
  sizeInSqft: number;
  floor: number;
  totalFloors: number;
  ageInYears: number;
  facing: string; // 'N', 'E', 'W', 'S', 'NE', etc.
  furnishing: Furnishing;
  
  // Pricing
  rent: number;
  securityDeposit: number;
  maintenanceCharge?: number;
  
  // Utilities
  utilities: {
    water: 'unlimited' | 'metered' | 'combined';
    electricity: 'unlimited' | 'metered';
    wifi: boolean;
    wifiIncluded: boolean;
  };
  
  // Features
  amenities: string[];
  photos: string[]; // Array of photo URLs
  vrTourUrl?: string;
  floorPlan?: string;
  
  features: {
    balcony: boolean;
    parking: 'dedicated' | 'shared' | 'none';
    kitchen: 'modular' | 'standard' | 'basic';
    ac: boolean;
    washingMachine: boolean;
  };
  
  // Tenant preferences set by landlord
  tenantPreferences: {
    familyOrBachelor: 'family' | 'bachelor' | 'both';
    vegetarianOnly: boolean;
    petsAllowed: boolean;
    companyLease: boolean;
    bachelorGirls: boolean;
  };
  
  // Lease terms
  leaseTerms: {
    minDuration: number; // months
    maxDuration?: number;
    noticePeriod: number; // days
  };
  
  // Status
  status: PropertyStatus;
  availableFrom: string; // ISO date
  verificationStatus: 'unverified' | 'verified' | 'premium';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// MATCHING TYPES
// ============================================

export enum MatchStatus {
  PENDING = 'pending', // Algorithm generated
  INTERESTED = 'interested', // Both swiped right
  DECLINED = 'declined', // One or both swiped left
  ACTIVE = 'active', // Deal in progress
}

/**
 * Match between tenant and property
 */
export interface Match {
  id: string;
  tenantId: string;
  propertyId: string;
  matchScore: number; // 0-100
  status: MatchStatus;
  tenantSwiped: boolean;
  landlordSwiped: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DEAL TYPES
// ============================================

export enum DealStatus {
  NEGOTIATING = 'negotiating',
  AGREED = 'agreed', // Terms agreed, pending signatures
  SIGNED = 'signed', // Agreement signed
  ACTIVE = 'active', // Tenant moved in
  COMPLETED = 'completed', // Lease ended
}

/**
 * Deal/transaction between tenant and landlord
 */
export interface Deal {
  id: string;
  matchId: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  
  status: DealStatus;
  
  // Negotiated terms
  negotiations: {
    rent?: number;
    securityDeposit?: number;
    moveInDate?: string;
    leaseEndDate?: string;
    lockinPeriod?: number; // months
    noticePeriod?: number; // days
  };
  
  tenantAccepted: boolean;
  landlordAccepted: boolean;
  
  // Payment
  depositPaymentMethod?: 'full_deposit' | 'insurance' | 'flexible';
  depositInsuranceId?: string;
  
  // Milestones
  agreementSignedAt?: Date;
  moveInAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// ANALYTICS TYPES
// ============================================

/**
 * Event tracking for analytics
 */
export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: string; // e.g., 'property_viewed', 'swipe_right'
  propertyId?: string;
  metadata: Record<string, any>; // Flexible metadata for different events
  timestamp: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================
// AUTHENTICATION TYPES
// ============================================

export interface AuthSession {
  id: string;
  userId: string;
  phone: string;
  otpCode?: string;
  otpAttempts: number;
  otpExpiresAt?: Date;
  sessionToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  phone: string;
  role: UserRole;
  iat: number; // issued at
  exp: number; // expires at
}

// ============================================
// MATCHING TYPES
// ============================================

export interface MatchPreferences {
  nonNegotiables: {
    budget: { min: number; max: number };
    location: string; // Neighborhood name
    bhkType: string[]; // ['1bhk', '2bhk', '3bhk']
    furnishing: 'unfurnished' | 'semi_furnished' | 'fully_furnished' | 'any';
    moveInDate: string; // ISO date string
  };
  mustHaves: {
    amenities: string[]; // ['gym', 'parking', 'swimming_pool']
    homeOfficeSpace?: boolean;
    gatedCommunity?: boolean;
    maxCommute?: number; // minutes to work location
    workLocation?: { lat: number; lng: number };
  };
  niceToHaves: {
    aestheticPreference?: 'modern' | 'traditional' | 'minimalist' | 'cozy';
    communityVibe?: 'social' | 'quiet' | 'family' | 'young_professionals';
    noiseLevel?: 'quiet' | 'moderate' | 'lively';
    petFriendly?: boolean;
    balconyPreference?: boolean;
  };
}

export interface MatchScore {
  totalScore: number; // 0-100
  breakdown: {
    budgetMatch: number; // 0-30 points
    locationMatch: number; // 0-20 points
    amenitiesMatch: number; // 0-20 points
    vibeMatch: number; // 0-15 points
    commuteMatch: number; // 0-15 points
  };
}

export interface MatchPreferences {
  nonNegotiables: {
    budget: { min: number; max: number };
    location: string; // Neighborhood name
    bhkType: string[]; // ['1bhk', '2bhk', '3bhk']
    furnishing: 'unfurnished' | 'semi_furnished' | 'fully_furnished' | 'any';
    moveInDate: string; // ISO date string
  };
  mustHaves: {
    amenities: string[]; // ['gym', 'parking', 'swimming_pool']
    homeOfficeSpace?: boolean;
    gatedCommunity?: boolean;
    maxCommute?: number; // minutes to work location
    workLocation?: { lat: number; lng: number };
  };
  niceToHaves: {
    aestheticPreference?: 'modern' | 'traditional' | 'minimalist' | 'cozy';
    communityVibe?: 'social' | 'quiet' | 'family' | 'young_professionals';
    noiseLevel?: 'quiet' | 'moderate' | 'lively';
    petFriendly?: boolean;
    balconyPreference?: boolean;
  };
}

export interface MatchScore {
  totalScore: number; // 0-100
  breakdown: {
    budgetMatch: number; // 0-30 points
    locationMatch: number; // 0-20 points
    amenitiesMatch: number; // 0-20 points
    vibeMatch: number; // 0-15 points
    commuteMatch: number; // 0-15 points
  };
}

export interface PropertyRecommendation {
  propertyId: string;
  matchScore: number;
  matchReason: string;
  commuteTime?: number; // minutes
}

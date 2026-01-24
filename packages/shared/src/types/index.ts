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
 * Subscription tiers
 * - FREE: Basic tier with limits (20 swipes/day, 3 simultaneous chats)
 * - PREMIUM: Enhanced features (unlimited swipes, 10 chats, priority support)
 * - PRO: Full access (unlimited everything, analytics, verified badge)
 */
export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  PRO = 'pro',
}

/**
 * Commute mode preferences
 */
export enum CommuteMode {
  WALK_METRO = 'walk_metro',
  CAR = 'car',
  BIKE = 'bike',
  BUS = 'bus',
  WFH = 'wfh',
  ANY = 'any',
}

/**
 * Occupation types for matching
 */
export enum OccupationType {
  IT_PROFESSIONAL = 'it_professional',
  STUDENT = 'student',
  HEALTHCARE = 'healthcare',
  FREELANCER = 'freelancer',
  CREATIVE = 'creative',
  CORPORATE = 'corporate',
  STARTUP = 'startup',
  OTHER = 'other',
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
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: Date;
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
 * Lifestyle tags for enhanced matching (tech-1.md Filter Set A)
 */
export type LifestyleTag =
  | 'pet_owner_dog'
  | 'pet_owner_cat'
  | 'musician_guitar'
  | 'musician_drums'
  | 'musician_keyboard'
  | 'sunlight_lover'
  | 'quiet_mornings'
  | 'early_riser'
  | 'night_owl'
  | 'gym_nearby'
  | 'cook_frequently'
  | 'nightlife'
  | 'wfh_heavy'
  | 'social_gatherings'
  | 'yoga_meditation'
  | 'outdoor_activities';

/**
 * Roommate compatibility preferences (for flatmate search)
 */
export interface RoommatePreferences {
  sleepSchedule: 'early_bird' | 'night_owl' | 'flexible';
  cleanlinessLevel: 'strict' | 'moderate' | 'relaxed';
  socialPreference: 'social' | 'private' | 'flexible';
  smoking: 'allowed' | 'outside_only' | 'not_allowed';
  drinking: 'fine' | 'occasional' | 'not_allowed';
  foodPreference: 'veg_only' | 'non_veg_ok' | 'no_preference';
  guestPolicy: 'anytime' | 'weekends_only' | 'rarely' | 'never';
}

/**
 * Noise levels for property (morning/evening/night in dB)
 */
export interface NoiseLevels {
  morning: number | null; // dB reading (6AM-12PM)
  evening: number | null; // dB reading (12PM-8PM)
  night: number | null;   // dB reading (8PM-6AM)
}

/**
 * Sunlight hours by room
 */
export interface SunlightHours {
  [roomName: string]: number; // hours of sunlight per day
}

/**
 * Pet policy details for property
 */
export interface PetDetails {
  dogsAllowed: boolean;
  catsAllowed: boolean;
  maxWeightKg?: number;
  gardenAccess?: boolean;
  petDeposit?: number;
}

/**
 * Commute times to major office hubs (pre-computed)
 */
export interface CommuteMatrix {
  [officeHub: string]: number; // minutes to reach
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
  lifestyleTags: LifestyleTag[];
  roommatePreferences?: RoommatePreferences;
  workLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  maxCommuteMinutes: number;
  commuteMode: CommuteMode;
  gender?: string;
  occupationType?: OccupationType;
  rating: number; // 0-5 stars from landlords
  ratingCount: number;
  previousLeases: number; // rental history count
}

/**
 * Landlord's preferences for ideal tenant (two-sided matching)
 */
export interface LandlordTenantPreferences {
  preferredOccupation?: OccupationType[];
  ageRange?: { min: number; max: number };
  genderPreference?: 'male' | 'female' | 'any';
  incomeMultiplier?: number; // e.g., 3x rent
  petsAllowed: boolean;
  smokingAllowed: boolean;
  familyPreferred?: boolean;
}

/**
 * Extended user profile for landlords
 */
export interface LandlordProfile extends User {
  propertyIds: string[];
  tenantPreferences?: LandlordTenantPreferences;
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
  
  // === NEW: Lifestyle Data Points (tech-1.md) ===
  
  // Noise levels at different times (dB readings)
  noiseLevels?: NoiseLevels;
  
  // Sunlight hours per room
  sunlightHours?: SunlightHours;
  
  // Pre-computed commute times to major tech parks
  commuteMatrix?: CommuteMatrix;
  
  // Nearby points of interest
  neighborhoodPois?: {
    cafes500m?: number;
    metroDistanceM?: number;
    parks1km?: number;
    groceryStores?: number;
    hospitals?: number;
  };
  
  // Detailed pet policy
  petDetails?: PetDetails;
  
  // Soundproofing rating (1-5)
  soundproofRating?: number;
  
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
    lifestyleMatch?: number; // 0-25 points (new from tech-1.md)
  };
}

export interface PropertyRecommendation {
  propertyId: string;
  matchScore: number;
  matchReason: string;
  commuteTime?: number; // minutes
}

// ============================================
// SUBSCRIPTION & LIMITS TYPES
// ============================================

export interface SwipeLimits {
  dailySwipes: number;
  dailySwipesUsed: number;
  superLikesPerMonth: number;
  superLikesUsed: number;
  simultaneousChats: number;
  activeChats: number;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SwipeLimits> = {
  [SubscriptionTier.FREE]: {
    dailySwipes: 20,
    dailySwipesUsed: 0,
    superLikesPerMonth: 3,
    superLikesUsed: 0,
    simultaneousChats: 3,
    activeChats: 0,
  },
  [SubscriptionTier.PREMIUM]: {
    dailySwipes: 100,
    dailySwipesUsed: 0,
    superLikesPerMonth: 10,
    superLikesUsed: 0,
    simultaneousChats: 10,
    activeChats: 0,
  },
  [SubscriptionTier.PRO]: {
    dailySwipes: Infinity,
    dailySwipesUsed: 0,
    superLikesPerMonth: Infinity,
    superLikesUsed: 0,
    simultaneousChats: Infinity,
    activeChats: 0,
  },
};

// ============================================
// VIEWING TYPES
// ============================================

export enum ViewingStatus {
  PROPOSED = 'proposed',
  COUNTER = 'counter',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum DepositStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FORFEITED = 'forfeited',
}

export interface Viewing {
  id: string;
  matchId: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  status: ViewingStatus;
  proposedDatetime: Date;
  alternativeDatetime?: Date;
  confirmedDatetime?: Date;
  proposedBy: 'tenant' | 'landlord';
  notes?: string;
  depositAmount?: number;
  depositStatus: DepositStatus;
  depositTransactionId?: string;
  gpsCheckin?: {
    lat: number;
    lng: number;
    time: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// ROOMMATE LISTING TYPES
// ============================================

export enum RoomType {
  SINGLE = 'single',
  SHARED = 'shared',
  MASTER = 'master',
}

export interface RoommateListing {
  id: string;
  propertyId: string;
  roomType: RoomType;
  roomRent: number;
  roomDeposit: number;
  totalRooms: number;
  availableRooms: number;
  currentFlatmatesCount: number;
  currentFlatmatesInfo: Array<{
    gender?: string;
    occupation?: OccupationType;
    age?: number;
  }>;
  houseRules: {
    noSmoking?: boolean;
    noParties?: boolean;
    quietHoursStart?: string;
    guestsPolicy?: 'anytime' | 'weekends_only' | 'rarely' | 'never';
  };
  status: 'available' | 'full' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CHAT VIOLATION TYPES
// ============================================

export enum ChatViolationType {
  PHONE_NUMBER = 'phone_number',
  EMAIL = 'email',
  SOCIAL_MEDIA = 'social_media',
  EXTERNAL_MEETING = 'external_meeting',
  URL = 'url',
}

export enum ChatViolationAction {
  WARNED = 'warned',
  BLOCKED = 'blocked',
  SUSPENDED = 'suspended',
}

export interface ChatViolation {
  id: string;
  userId: string;
  conversationId?: string;
  violationType: ChatViolationType;
  detectedContent: string;
  actionTaken: ChatViolationAction;
  createdAt: Date;
}
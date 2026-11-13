/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'PLATFORM_STAFF'
  | 'SOCIETY_ADMIN'
  | 'SOCIETY_STAFF'
  | 'SECURITY_GUARD'
  | 'RESIDENT'
  | 'SERVICE_PARTNER';

export type AccountStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'BLOCKED'
  | 'DEACTIVATED';

export type MembershipStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED';

export type OccupantType = 'OWNER' | 'TENANT';

export interface UserProfile {
  uid: string;
  fullName: string;
  displayName?: string; // Compatibility alias
  email?: string;
  phoneNumber: string;
  photoURL?: string;
  preferredLanguage: string;
  accountStatus: AccountStatus;
  rejectionReason?: string;
  suspendedReason?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  onboardingCompleted: boolean;
  primaryRole?: UserRole;
  role?: UserRole; // Compatibility alias
  isSuperAdmin?: boolean;
  societyName?: string; // Compatibility alias
  societyId?: string; // Compatibility alias
  societyCode?: string;
  flatNumber?: string; // Compatibility alias
  block?: string; // Compatibility alias
  buildingName?: string; // Compatibility alias
  partnerCompany?: string; // Compatibility alias
  partnerId?: string; // Compatibility alias
  platformRole?: string;
  platformDepartment?: string;
  platformPermissions?: string[];
  platformStaffId?: string;
  societyStaffId?: string;
  societyStaffRole?: string;
  societyDepartment?: string;
  societyPermissions?: string[];
}

export interface SocietyMembership {
  id?: string;
  uid: string;
  societyId: string;
  societyName: string;
  societyCode: string;
  role: UserRole;
  membershipStatus: MembershipStatus;
  wingId?: string;
  flatId?: string;
  occupantType?: OccupantType;
  employmentId?: string;
  gateAssigned?: string;
  joinedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface PartnerKycDocuments {
  nationalIdType?: string;
  nationalIdNumber?: string;
  nationalIdUrl?: string;
  panNumber?: string;
  panUrl?: string;
  dlNumber?: string;
  dlUrl?: string;
  isPoliceVerified?: boolean;
  policeVerificationDate?: string;
  policeVerificationUrl?: string;
  bankDetails?: {
    accountHolderName?: string;
    accNo?: string;
    ifsc?: string;
    bankName?: string;
    passbookUrl?: string;
  };
  agreementUrls?: string[];
}

export interface ServicePartnerProfile {
  uid: string;
  id?: string;
  name?: string;
  businessName: string;
  email?: string;
  contactNumber: string;
  phone?: string;
  password?: string;
  passwordHash?: string;
  businessAddress: string;
  address?: string;
  serviceCategories: string[];
  serviceDomain?: string[];
  serviceAreas: string[];
  serviceArea?: string;
  assignedSocietyId?: string;
  assignedSocietyName?: string;
  verificationStatus: MembershipStatus;
  status?: 'pending' | 'active' | 'rejected' | 'suspended';
  onboardedBy?: 'super_admin' | 'society_admin' | 'self';
  societyAdminId?: string;
  rejectionReason?: string;
  documents?: PartnerKycDocuments;
  servicesOffered?: any[];
  rateCard?: any[];
  createdAt: string;
  updatedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AccessRequest {
  id: string;
  uid: string;
  applicantName: string;
  phoneNumber: string;
  email?: string;
  requestedRole: UserRole;
  societyId?: string;
  societyName?: string;
  requestData: {
    wingId?: string;
    flatId?: string;
    occupantType?: OccupantType;
    employmentId?: string;
    gateAssigned?: string;
    societyName?: string;
    societyCity?: string;
    societyAddress?: string;
    businessName?: string;
    businessAddress?: string;
    serviceCategories?: string[];
    serviceAreas?: string[];
    contactPhone?: string;
    additionalNotes?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface RoleConfig {
  id: UserRole;
  label: string;
  title: string;
  description: string;
  badgeColor: string;
  defaultPath: string;
  iconName: string;
  capabilities: string[];
}

export interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: any | null;
  currentRole: UserRole | null;
  memberships: SocietyMembership[];
  activeMembership: SocietyMembership | null;
  servicePartnerProfile: ServicePartnerProfile | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  isDevMode: boolean;
  setActiveMembership: (membership: SocietyMembership) => void;
  switchRole: (role: UserRole) => void;
  loginWithDemoRole: (role: UserRole) => void;
  loginWithDemoSession: (profile: UserProfile) => void;
  refreshUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Service registry. Pages import services from here only.
 *
 * Every service currently uses its mock (preview) implementation. When the backend
 * exists, implement the same interfaces with apiRequest() and switch on DATA_MODE.
 */
import { mockAuthService, type AuthService } from './authService';
import { mockBusinessService, type BusinessService } from './businessService';
import { mockMasterclassService, type MasterclassService } from './masterclassService';
import { mockRegistrationService, type RegistrationService } from './registrationService';
import { mockPaymentService, type PaymentService } from './paymentService';
import { mockEligibilityService, type EligibilityService } from './eligibilityService';
import { mockAdminService, type AdminService } from './adminService';
import { mockReportsService, type ReportsService } from './reportsService';

export const IS_DEMO = true;

export const authService: AuthService = mockAuthService;
export const businessService: BusinessService = mockBusinessService;
export const masterclassService: MasterclassService = mockMasterclassService;
export const registrationService: RegistrationService = mockRegistrationService;
export const paymentService: PaymentService = mockPaymentService;
export const eligibilityService: EligibilityService = mockEligibilityService;
export const adminService: AdminService = mockAdminService;
export const reportsService: ReportsService = mockReportsService;

export { registrationAvailability } from './masterclassService';
export { ServiceError } from './errors';

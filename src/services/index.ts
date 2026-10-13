/**
 * Service registry. Pages import services from here only.
 *
 * Automatically switches between real MySQL API services and in-browser mock services
 * based on VITE_DATA_MODE ("api" vs "mock").
 */
import { mockAuthService, type AuthService } from './authService';
import { mockBusinessService, type BusinessService } from './businessService';
import { mockMasterclassService, type MasterclassService } from './masterclassService';
import { mockRegistrationService, type RegistrationService } from './registrationService';
import { mockPaymentService, type PaymentService } from './paymentService';
import { mockEligibilityService, type EligibilityService } from './eligibilityService';
import { mockAdminService, type AdminService } from './adminService';
import { mockReportsService, type ReportsService } from './reportsService';

import { DATA_MODE } from './api/client';
import { apiAuthService } from './api/authApi';
import { apiBusinessService } from './api/businessApi';
import { apiMasterclassService } from './api/masterclassApi';
import { apiRegistrationService } from './api/registrationApi';
import { apiPaymentService } from './api/paymentApi';
import { apiEligibilityService } from './api/eligibilityApi';
import { apiAdminService } from './api/adminApi';

export const IS_DEMO = DATA_MODE !== 'api';

export const authService: AuthService = DATA_MODE === 'api' ? apiAuthService : mockAuthService;
export const businessService: BusinessService = DATA_MODE === 'api' ? apiBusinessService : mockBusinessService;
export const masterclassService: MasterclassService = DATA_MODE === 'api' ? apiMasterclassService : mockMasterclassService;
export const registrationService: RegistrationService = DATA_MODE === 'api' ? apiRegistrationService : mockRegistrationService;
export const paymentService: PaymentService = DATA_MODE === 'api' ? apiPaymentService : mockPaymentService;
export const eligibilityService: EligibilityService = DATA_MODE === 'api' ? apiEligibilityService : mockEligibilityService;
export const adminService: AdminService = DATA_MODE === 'api' ? apiAdminService : mockAdminService;
export const reportsService: ReportsService = mockReportsService;

export { registrationAvailability } from './masterclassService';
export { ServiceError } from './errors';

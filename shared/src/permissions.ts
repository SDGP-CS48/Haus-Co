import type { PortalType, SystemRole } from './types.js';

export type Permission =
  | 'project:create'
  | 'project:read_own'
  | 'plot:edit_own'
  | 'plan:generate_own'
  | 'plan:unlock_3d'
  | 'estimate:compute_own'
  | 'booking:create_own'
  | 'boq:view_own'
  | 'boq:submit'
  | 'boq:rebut'
  | 'engineer:submit_report'
  | 'furniture:place_own'
  | 'furniture:unlock_premium'
  | 'shop:manage_inventory'
  | 'shop:manage_ads'
  | 'worker:manage_jobs'
  | 'worker:create_job'
  | 'worker:review_completed_job'
  | 'admin:manage_kyc'
  | 'admin:manage_rates'
  | 'admin:manage_ads'
  | 'admin:manage_disputes'
  | 'admin:view_audit_logs';

export const ROLE_TO_PORTAL: Record<SystemRole, PortalType> = {
  HOME_BUILDER: 'HOME_BUILDER_PORTAL',
  GENERAL_CONTRACTOR: 'CONTRACTOR_ENGINEER_PORTAL',
  CIVIL_ENGINEER: 'CONTRACTOR_ENGINEER_PORTAL',
  SHOP_OWNER: 'SHOP_OWNER_PORTAL',
  SKILLED_WORKER: 'SHOP_OWNER_PORTAL',
  PLATFORM_ADMIN: 'SYSTEM_OPERATIONS',
};

export const ROLE_PERMISSIONS: Record<SystemRole, ReadonlySet<Permission>> = {
  HOME_BUILDER: new Set([
    'project:create',
    'project:read_own',
    'plot:edit_own',
    'plan:generate_own',
    'plan:unlock_3d',
    'estimate:compute_own',
    'booking:create_own',
    'boq:view_own',
    'furniture:place_own',
    'furniture:unlock_premium',
    'worker:create_job',
    'worker:review_completed_job',
  ]),
  GENERAL_CONTRACTOR: new Set(['boq:submit', 'boq:rebut']),
  CIVIL_ENGINEER: new Set(['engineer:submit_report']),
  SHOP_OWNER: new Set(['shop:manage_inventory', 'shop:manage_ads']),
  SKILLED_WORKER: new Set(['worker:manage_jobs']),
  PLATFORM_ADMIN: new Set([
    'admin:manage_kyc',
    'admin:manage_rates',
    'admin:manage_ads',
    'admin:manage_disputes',
    'admin:view_audit_logs',
  ]),
};

export function hasPermission(role: SystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function getDefaultRouteForRole(role: SystemRole): string {
  switch (role) {
    case 'HOME_BUILDER':
      return '/builder/dashboard';
    case 'GENERAL_CONTRACTOR':
      return '/contractor/dashboard';
    case 'CIVIL_ENGINEER':
      return '/engineer/dashboard';
    case 'SHOP_OWNER':
      return '/shop/dashboard';
    case 'SKILLED_WORKER':
      return '/worker/dashboard';
    case 'PLATFORM_ADMIN':
      return '/admin/dashboard';
  }
}

export interface RoleSummary {
  role: SystemRole;
  portal: PortalType;
  label: string;
  description: string;
  requiresKyc: boolean;
}

export const SYSTEM_ROLES_INFO: RoleSummary[] = [
  {
    role: 'HOME_BUILDER',
    portal: 'HOME_BUILDER_PORTAL',
    label: 'Home Builder',
    description: 'Draw plots, generate 2D/3D concept plans, estimate costs, audit BOQs, furnish rooms and hire tradespeople.',
    requiresKyc: false,
  },
  {
    role: 'GENERAL_CONTRACTOR',
    portal: 'CONTRACTOR_ENGINEER_PORTAL',
    label: 'General Contractor',
    description: 'Receive verified project leads, submit 5-stage turnkey or labour-only BOQs and respond to audit flags.',
    requiresKyc: true,
  },
  {
    role: 'CIVIL_ENGINEER',
    portal: 'CONTRACTOR_ENGINEER_PORTAL',
    label: 'Civil Engineer',
    description: 'Accept paid site visits, publish land suitability & foundation depth reports and verify structural plans.',
    requiresKyc: true,
  },
  {
    role: 'SHOP_OWNER',
    portal: 'SHOP_OWNER_PORTAL',
    label: 'Hardware & Furniture Shop',
    description: 'Manage dimensioned furniture & hardware inventory, receive qualified booking leads and run stage-timed ads.',
    requiresKyc: true,
  },
  {
    role: 'SKILLED_WORKER',
    portal: 'SHOP_OWNER_PORTAL',
    label: 'Skilled Worker',
    description: 'Receive verified micro-task requests in electrical, plumbing, masonry, painting or carpentry trades.',
    requiresKyc: true,
  },
  {
    role: 'PLATFORM_ADMIN',
    portal: 'SYSTEM_OPERATIONS',
    label: 'Platform Administrator',
    description: 'Internal operations for KYC verification, versioned cost rates, audit baselines, ads & dispute resolution.',
    requiresKyc: false,
  },
];

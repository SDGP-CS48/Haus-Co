export function buildOpenApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Haus & Co Platform API',
      version: '1.0.0',
      description:
        'Modular monolith REST API for Haus & Co Sri Lankan home construction platform (Identity, Plots, Concept Plans, Cost Estimator, Professionals, BOQ Auditor, Dimensioned Marketplace, Skilled Workers, Entitlements, Admin).',
    },
    servers: [{ url: '/api/v1' }],
    paths: {
      '/health': { get: { summary: 'Health & runtime mode status' } },
      '/auth/register': { post: { summary: 'Register user with required role selection' } },
      '/auth/login': { post: { summary: 'Credential login' } },
      '/auth/demo-login': { post: { summary: 'Demo-only quick sign-in for evaluator roles' } },
      '/auth/otp/request': { post: { summary: 'Request Sri Lankan Dialog/Mobitel compatible phone OTP' } },
      '/auth/otp/verify': { post: { summary: 'Verify phone OTP code' } },
      '/auth/kyc': { post: { summary: 'Submit NIC & credential KYC for service providers' } },
      '/projects': {
        get: { summary: 'List projects (scoped by user role)' },
        post: { summary: 'Create project (Start from Scratch or Upload Existing Plan)' },
      },
      '/projects/{id}/plot': { put: { summary: 'Save plot vertices & compute m²/perches/setback buildable zone' } },
      '/projects/{id}/plans/generate': { post: { summary: 'Generate Variant A & B 2D concept plans' } },
      '/projects/{id}/plans/ai-edit': { post: { summary: 'Apply controlled server-side plan edit tool & refresh estimate' } },
      '/projects/{id}/plans/{versionId}/3d-model': { get: { summary: 'Fetch 3D scene geometry (server-enforced MODEL_3D_UNLOCK entitlement)' } },
      '/projects/{id}/estimates': { post: { summary: 'Compute & snapshot Method A + Method B rough cost estimate' } },
      '/professionals': { get: { summary: 'List verified/sample CIDA contractors and chartered civil engineers' } },
      '/bookings/voice-consult': { post: { summary: 'Create free WebRTC voice consultation session' } },
      '/bookings/site-visit': { post: { summary: 'Schedule paid civil engineer site visit' } },
      '/engineer/reports': { post: { summary: 'Publish civil engineer land suitability & structural report' } },
      '/projects/{id}/boqs': {
        get: { summary: 'List contractor BOQs, audit flags & rebuttals' },
        post: { summary: 'Submit 5-stage turnkey or labour-only BOQ & run automated audit' },
      },
      '/boqs/{boqId}/rebuttal': { post: { summary: 'Contractor submits audit justification or revised unit rates' } },
      '/marketplace/products': { get: { summary: 'Browse dimensioned furniture & hardware (prices redacted unless premium unlocked)' } },
      '/marketplace/products/{id}/compare': { get: { summary: 'Premium side-by-side price comparison across stores' } },
      '/projects/{id}/furniture/placements': { post: { summary: 'Place furniture to scale & run fit check (Fits/Tight/Does not fit)' } },
      '/marketplace/external-fallback': { post: { summary: 'External Sri Lankan retailer search links for out-of-stock items' } },
      '/workers': { get: { summary: 'Search verified tradespeople' } },
      '/worker-jobs': { post: { summary: 'Book skilled worker micro-task' } },
      '/worker-jobs/{id}/review': { post: { summary: 'Submit review (server-enforced COMPLETED_PAID gate)' } },
      '/payments/checkout': { post: { summary: 'Initiate PayHere or Demo payment checkout' } },
      '/payments/payhere/notify': { post: { summary: 'Idempotent PayHere callback / demo verification' } },
      '/admin/overview': { get: { summary: 'Admin system analytics, KYC queue, rate editor & audit logs' } },
    },
  };
}

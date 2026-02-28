export const APP_ROUTES = {
  root: '/',
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',
  home: '/home',
  dashboard: '/dashboard',
  drafts: '/drafts',
  draftById: (id = ':id') => `/draft/${id}`,
  comparison: '/comparison',
  precedents: '/precedents',
  clauses: '/clauses',
  reports: '/reports',
  settings: '/settings',
  admin: '/admin',
  upload: '/upload'
}

export const SIDEBAR_MENU = [
  { to: APP_ROUTES.home, label: 'Dashboard' },
  { to: APP_ROUTES.drafts, label: 'My Drafts' },
  { to: APP_ROUTES.comparison, label: 'Comparison' },
  { to: APP_ROUTES.precedents, label: 'Precedents' },
  { to: APP_ROUTES.clauses, label: 'Clauses' },
  { to: APP_ROUTES.reports, label: 'Compliance Reports' },
  { to: APP_ROUTES.settings, label: 'Settings' },
  { to: APP_ROUTES.admin, label: 'Admin', roles: ['Admin'] }
]

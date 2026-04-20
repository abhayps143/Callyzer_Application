// ─────────────────────────────────────────
//  Callyzer Design System — Modern Minimal
// ─────────────────────────────────────────

export const C = {
    // Backgrounds
    bg: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F3F7',

    // Brand
    primary: '#4F6EF7',
    primarySoft: '#EEF1FE',

    // Text
    text: '#0F1729',
    textSub: '#6B7A99',
    textMuted: '#A9B4CC',

    // Borders
    border: '#E8ECF4',

    // Status
    green: '#17C964',
    greenSoft: '#E8FBF0',
    red: '#F31260',
    redSoft: '#FEE7EF',
    amber: '#F5A524',
    amberSoft: '#FFF4E0',
    blue: '#006FEE',
    blueSoft: '#E6F1FE',
    purple: '#7828C8',
    purpleSoft: '#F0E6FF',
    cyan: '#06B7DB',
    cyanSoft: '#E6F9FC',
    orange: '#F97316',
    orangeSoft: '#FFF0E6',
};

export const ROLE_COLORS = {
    super_admin: { color: C.purple, soft: C.purpleSoft, label: 'Super Admin' },
    admin: { color: C.blue, soft: C.blueSoft, label: 'Admin' },
    manager: { color: C.primary, soft: C.primarySoft, label: 'Manager' },
    team_leader: { color: C.cyan, soft: C.cyanSoft, label: 'Team Leader' },
    agent: { color: C.green, soft: C.greenSoft, label: 'Agent' },
    hr: { color: C.amber, soft: C.amberSoft, label: 'HR' },
    finance: { color: C.orange, soft: C.orangeSoft, label: 'Finance' },
};

export const STATUS_COLORS = {
    pending: { color: C.amber, soft: C.amberSoft, label: 'Pending' },
    approved: { color: C.green, soft: C.greenSoft, label: 'Approved' },
    rejected: { color: C.red, soft: C.redSoft, label: 'Rejected' },
};

export const shadow = {
    shadowColor: '#1A2B5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
};

export const shadowMd = {
    shadowColor: '#1A2B5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
};

import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Responsive scale helpers ─────────────────────────
const BASE_W = 390; // iPhone 14 reference
export const rs = (size) => Math.round((SCREEN_W / BASE_W) * size);
export const fs = (size) => {
    const scale = SCREEN_W / BASE_W;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
export const SCREEN_WIDTH = SCREEN_W;
export const SCREEN_HEIGHT = SCREEN_H;

// ── Color Tokens ─────────────────────────────────────
export const C = {
    // Backgrounds
    bg: '#F4F6FB',
    surface: '#FFFFFF',
    surfaceAlt: '#F0F3FA',
    surfaceHover: '#EDF0F9',

    // Brand  — indigo-blue
    primary: '#4A68F0',
    primaryDark: '#3550D6',
    primarySoft: '#EBF0FF',
    primaryMid: '#C5D0FB',

    // Text hierarchy
    text: '#0D1426',
    textSub: '#596280',
    textMuted: '#9AA4BF',

    // Dividers / Borders
    border: '#E4E9F4',
    borderFocus: '#4A68F0',

    // Status
    green: '#16BE62',
    greenDark: '#0F9E52',
    greenSoft: '#E5F9EF',
    red: '#F0204E',
    redDark: '#C9153E',
    redSoft: '#FEEBF0',
    amber: '#F0991A',
    amberSoft: '#FEF4E5',
    blue: '#0A6EEA',
    blueSoft: '#E5F1FE',
    purple: '#7322C0',
    purpleSoft: '#F1E8FC',
    cyan: '#0AAECC',
    cyanSoft: '#E5F8FC',
    orange: '#F26A10',
    orangeSoft: '#FEF0E7',
    teal: '#0D9488',
    tealSoft: '#E5F4F3',
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

// ── Shadows ───────────────────────────────────────────
export const shadow = {
    shadowColor: '#1A2B5F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
};

export const shadowMd = {
    shadowColor: '#1A2B5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.11,
    shadowRadius: 14,
    elevation: 5,
};

export const shadowLg = {
    shadowColor: '#1A2B5F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
};

// ── Spacing Scale ─────────────────────────────────────
export const space = {
    xs: rs(4),
    sm: rs(8),
    md: rs(12),
    lg: rs(16),
    xl: rs(20),
    xxl: rs(24),
    '3xl': rs(32),
};

// ── Typography Scale ──────────────────────────────────
export const type = {
    xs: fs(11),
    sm: fs(12),
    base: fs(14),
    md: fs(15),
    lg: fs(17),
    xl: fs(20),
    '2xl': fs(24),
    '3xl': fs(28),
    '4xl': fs(34),
};

// ── Border Radii ──────────────────────────────────────
export const radius = {
    sm: rs(8),
    md: rs(12),
    lg: rs(16),
    xl: rs(20),
    full: rs(100),
};
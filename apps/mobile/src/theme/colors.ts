export const colors = {
  patient: {
    primary: '#1976E9',
    primaryDark: '#135FBE',
    soft: '#EAF4FF',
    softStrong: '#DCEEFF',
  },
  doctor: {
    primary: '#009B70',
    primaryDark: '#007B59',
    soft: '#E7F8F1',
    softStrong: '#D7F2E8',
  },
  navy: '#183B5B',
  text: '#52677D',
  muted: '#8A9AAF',
  canvas: '#F7FAFD',
  surface: '#FFFFFF',
  border: '#DCE7F2',
  success: '#1DAA72',
  successSoft: '#E6F8F0',
  warning: '#F59E0B',
  warningSoft: '#FFF5DE',
  shadow: '#183B5B',
} as const;

export type AppRole = 'patient' | 'doctor';

export function roleColors(role: AppRole) {
  return colors[role];
}

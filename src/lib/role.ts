// Simple front-end role store for mocks (without api)
export type Role = 'family' | 'carer' | 'management';
const KEY = 'mockRole';

export function setMockRole(role: Role) {
  try {
    sessionStorage.setItem(KEY, role);
  } catch {}
}
export function getMockRole(): Role | null {
  try {
    const r = sessionStorage.getItem(KEY);
    if (r === 'family' || r === 'carer' || r === 'management') return r;
  } catch {}
  return null;
}
export function clearMockRole() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

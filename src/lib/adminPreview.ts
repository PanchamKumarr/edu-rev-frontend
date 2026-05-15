/** Lets an admin open the learner/instructor dashboard without being bounced back to `/admin`. */
const KEY = 'edu_rev_admin_user_dashboard_preview';

export function setAdminUserDashboardPreview(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearAdminUserDashboardPreview(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function isAdminUserDashboardPreview(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

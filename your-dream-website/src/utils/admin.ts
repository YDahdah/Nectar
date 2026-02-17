/**
 * Simple admin check utility
 * Admin status is stored in localStorage
 * To enable admin mode, run in browser console:
 * localStorage.setItem('nectar_admin', 'true')
 */
export const isAdmin = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("nectar_admin") === "true";
};

export const setAdmin = (value: boolean): void => {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem("nectar_admin", "true");
  } else {
    localStorage.removeItem("nectar_admin");
  }
};

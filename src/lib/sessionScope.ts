let scope: string | null = null;
export function setOperatorScope(projectId: string, workspaceId: string, uid: string) {
  scope = [projectId, workspaceId, uid].map(encodeURIComponent).join(':');
}
export function clearOperatorScope() { scope = null; }
export function getOperatorScope(): string | null { return scope; }
export function operatorStorageKey(key: string): string {
  if (!scope) throw new Error('Operator session required');
  return `daleel:operator:${scope}:${key.replace(/^qde_/, '')}`;
}
export const scopedOperatorStorage = {
 getItem: (key:string) => localStorage.getItem(operatorStorageKey(key)),
 setItem: (key:string,value:string) => localStorage.setItem(operatorStorageKey(key),value),
 removeItem: (key:string) => localStorage.removeItem(operatorStorageKey(key)),
};

export function isBlueNileOrDemoCompanyId(companyId?: string | null): boolean {
  if (!companyId) return false;
  return (
    companyId === 'comp_bluenile_01' ||
    companyId === 'comp_cairo_dmc_02' ||
    companyId === 'comp_demo_workspace' ||
    companyId === 'ws-default' ||
    companyId === 'ws-demo' ||
    companyId.startsWith('comp_demo')
  );
}

/**
 * Switches the operator localStorage namespace cleanly per company workspace.
 * Existing kamal / Blue Nile workspace data lives in ws-default:user-default and remains intact.
 * Newly registered live companies receive their own isolated storage namespace keyed by companyId.
 * Empty or missing companyId clears scope instead of falling back to ws-default.
 */
export function applyCompanyOperatorScope(companyId?: string | null, uid?: string | null): void {
  if (!companyId) {
    clearOperatorScope();
    return;
  }
  if (companyId === 'comp_bluenile_01' || companyId === 'ws-default' || companyId === 'ws-demo') {
    setOperatorScope('daleel-app', 'ws-default', 'user-default');
    return;
  }
  setOperatorScope('daleel-app', companyId, uid || 'owner');
}


export function deriveNavbarRoleState(user, { isGuest = false } = {}) {
  function normalizeRole(role) {
    if (role === "company-admin" || role === "companyAdmin" || role === "admin") return "company_admin";
    if (role === "publisher") return "broker";
    return role;
  }

  const normalizedPrimaryRole = normalizeRole(user?.role);
  const activeRole = normalizedPrimaryRole === "broker" || normalizedPrimaryRole === "company_admin"
    ? normalizedPrimaryRole
    : "renter";

  const rawRoles = isGuest
    ? ["renter"]
    : Array.from(new Set([
        ...(Array.isArray(user?.roles) ? user.roles : []),
        activeRole
      ].filter(Boolean).map(normalizeRole)));

  const roleSet = new Set(rawRoles.filter((role) => role === "renter" || role === "broker" || role === "company_admin"));
  const hasCompanyAdminRole = roleSet.has("company_admin");
  const hasBrokerAccess = roleSet.has("broker") || hasCompanyAdminRole;

  return {
    activeRole,
    rawRoles,
    roleSet,
    hasCompanyAdminRole,
    hasBrokerAccess
  };
}

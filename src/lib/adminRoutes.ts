const isSetupEnvEnabled = process.env.NEXT_PUBLIC_ENABLE_ADMIN_SETUP === "true";
const hasSetupRiskAck = process.env.NEXT_PUBLIC_ADMIN_SETUP_ACK === "I_UNDERSTAND";

export const isAdminSetupEnabled = isSetupEnvEnabled && hasSetupRiskAck;

export function isPublicAdminRoute(pathname: string) {
  return pathname === "/admin/login";
}

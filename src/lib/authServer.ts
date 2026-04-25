import { adminAuth } from "./firebaseAdmin";
import { headers } from "next/headers";

export async function verifyAdminSession() {
  if (!adminAuth) {
    console.warn("verifyAdminSession called but adminAuth is not initialized.");
    return null;
  }

  const headersList = await headers();
  const authorization = headersList.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authorization.split("Bearer ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null;
  }
}

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "customer_token";
const secret = new TextEncoder().encode(
  process.env.CUSTOMER_JWT_SECRET ?? "dev-customer-secret-change-in-prod"
);

export type CustomerPayload = {
  id: number;
  phone: string;
  name: string;
};

export async function signCustomerToken(payload: CustomerPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyCustomerToken(token: string): Promise<CustomerPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as CustomerPayload;
  } catch {
    return null;
  }
}

export async function getCustomerFromCookie(): Promise<CustomerPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export { COOKIE_NAME };

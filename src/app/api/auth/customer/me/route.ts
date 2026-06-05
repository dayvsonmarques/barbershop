import { NextResponse } from "next/server";
import { getCustomerFromCookie } from "@/lib/customer-jwt";

export async function GET() {
  const customer = await getCustomerFromCookie();
  if (!customer) {
    return NextResponse.json({ customer: null }, { status: 401 });
  }
  return NextResponse.json({ customer });
}

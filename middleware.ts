import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/clerk";

const clerk = clerkMiddleware();

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured()) {
    return NextResponse.next();
  }

  return clerk(request, event);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"]
};

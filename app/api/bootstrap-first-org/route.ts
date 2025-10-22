import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  const h = await nextHeaders();
  const headers = new Headers(h as unknown as Headers);

  // Require authenticated user
  const session = await auth.api.getSession({ headers });
  const userId: string | undefined = (session as any)?.data?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If any organization already exists globally, do nothing
  const orgCount = await prisma.organization.count();
  if (orgCount > 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  // If user is already member of any org (paranoia), do nothing
  const existingMembership = await prisma.member.findFirst({ where: { userId } });
  if (existingMembership) {
    return NextResponse.json({ ok: true, noop: true });
  }

  // Create first organization and assign current user as owner (super-admin equivalent)
  const baseName = (session as any)?.data?.user?.name?.trim() || "Imaginears";
  const baseSlug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const suffix = (userId || Math.random().toString(36).slice(2, 8)).toString().slice(0, 6).toLowerCase();
  const slug = [baseSlug || "imaginears", suffix].join("-");

  const now = new Date();
  const orgId = crypto.randomUUID();

  const defaultRoles = {
    roles: [
      { name: "owner", permissions: ["*"] },
      { name: "admin", permissions: ["manage:all"] },
      { name: "member", permissions: [] },
    ],
  };

  await prisma.organization.create({
    data: {
      id: orgId,
      name: baseName,
      slug,
      createdAt: now,
      metadata: JSON.stringify(defaultRoles),
    },
  });

  await prisma.member.create({
    data: {
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId,
      role: "owner", // super-admin equivalent
      createdAt: now,
    },
  });

  // Try to set it as active organization for this session
  try {
    await auth.api.setActiveOrganization?.({ headers, body: { organizationId: orgId } } as any);
  } catch {
    /* optional */
  }

  return NextResponse.json({ ok: true, organizationId: orgId });
}

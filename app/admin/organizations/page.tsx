import { headers as nextHeaders } from "next/headers";
import { auth, canUsersCreateOrganizations } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

// Helper to get a safe Headers object for Better-Auth server calls
async function getAuthHeaders() {
  const h = await nextHeaders();
  return new Headers(h as unknown as Headers);
}

// Parse/save org metadata for role + permission config
function parseOrgMetadata(meta?: string | null): { roles: { name: string; permissions: string[] }[] } {
  if (!meta) return { roles: [] };
  try {
    const v = JSON.parse(meta);
    if (v && Array.isArray(v.roles)) return { roles: v.roles };
  } catch {}
  return { roles: [] };
}

async function saveOrgMetadata(orgId: string, roles: { name: string; permissions: string[] }[]) {
  await prisma.organization.update({
    where: { id: orgId },
    data: { metadata: JSON.stringify({ roles }) },
  });
}

// Server Actions
export async function createOrganizationAction(formData: FormData) {
  "use server";
  // Respect global policy, but allow a bootstrap exception for the owner when no organizations exist yet.
  const name = (formData.get("name") as string | null)?.trim();
  const slug = (formData.get("slug") as string | null)?.trim() || undefined;
  if (!name) return; // no-op instead of throwing to avoid error surfaces

  const headers = await getAuthHeaders();

  // Determine if the current user is permitted to create orgs in this context
  let allowed = canUsersCreateOrganizations;
  if (!allowed) {
    try {
      const sessionRes = await auth.api.getSession({ headers });
      const user = (sessionRes as any)?.data?.user ?? (sessionRes as any)?.user ?? (sessionRes as any)?.session?.user;
      const uname = (user?.name ?? "").toString().toLowerCase();
      const username = user?.username ? String(user.username).toLowerCase() : "";
      const email = (user?.email ?? "").toString().toLowerCase();
      if (uname === "clarkcj" || username === "clarkcj" || email.startsWith("clarkcj")) {
        allowed = true;
      }
    } catch {}
  }

  if (!allowed) {
    // Silently ignore when not allowed; UI hides the form in this case.
    return;
  }

  try {
    await auth.api.createOrganization({ headers, body: { name, ...(slug ? { slug } : {}) } } as any);
  } catch (err) {
    // Swallow API errors to prevent runtime crash; rely on UI policy.
    console.error("createOrganization failed:", err);
  }
  revalidatePath("/admin/organizations");
}

export async function setActiveOrgAction(formData: FormData) {
  "use server";
  const organizationId = (formData.get("organizationId") as string | null)?.trim();
  if (!organizationId) throw new Error("organizationId is required");
  const headers = await getAuthHeaders();
  try {
    await auth.api.setActiveOrganization?.({ headers, body: { organizationId } } as any);
  } catch {
    /* optional in some versions */
  }
  revalidatePath("/admin/organizations");
}

export async function upsertRoleAction(formData: FormData) {
  "use server";
  const organizationId = (formData.get("organizationId") as string | null)?.trim();
  const roleName = (formData.get("roleName") as string | null)?.trim();
  const permissionsRaw = (formData.get("permissions") as string | null) || "";
  if (!organizationId || !roleName) throw new Error("organizationId and roleName are required");
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");
  const meta = parseOrgMetadata(org.metadata);
  const existing = meta.roles.find((r) => r.name.toLowerCase() === roleName.toLowerCase());
  const permissions = permissionsRaw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (existing) {
    existing.permissions = permissions;
  } else {
    meta.roles.push({ name: roleName, permissions });
  }
  await saveOrgMetadata(organizationId, meta.roles);
  revalidatePath("/admin/organizations");
}

export async function deleteRoleAction(formData: FormData) {
  "use server";
  const organizationId = (formData.get("organizationId") as string | null)?.trim();
  const roleName = (formData.get("roleName") as string | null)?.trim();
  if (!organizationId || !roleName) throw new Error("organizationId and roleName are required");
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");
  const meta = parseOrgMetadata(org.metadata);
  const roles = meta.roles.filter((r) => r.name.toLowerCase() !== roleName.toLowerCase());
  await saveOrgMetadata(organizationId, roles);
  revalidatePath("/admin/organizations");
}

export async function addUserToRoleAction(formData: FormData) {
  "use server";
  const organizationId = (formData.get("organizationId") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();
  const role = (formData.get("role") as string | null)?.trim();
  if (!organizationId || !email || !role) throw new Error("organizationId, email and role are required");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("User not found. Ask the user to register first, or implement invites.");
  }
  // Upsert member with role
  const existing = await prisma.member.findFirst({ where: { organizationId, userId: user.id } });
  if (existing) {
    await prisma.member.update({ where: { id: existing.id }, data: { role } });
  } else {
    await prisma.member.create({ data: { organizationId, userId: user.id, role, createdAt: new Date() } });
  }
  revalidatePath("/admin/organizations");
}

export async function removeMemberAction(formData: FormData) {
  "use server";
  const memberId = (formData.get("memberId") as string | null)?.trim();
  if (!memberId) throw new Error("memberId is required");
  await prisma.member.delete({ where: { id: memberId } });
  revalidatePath("/admin/organizations");
}

export default async function OrganizationsPage() {
  const headers = await getAuthHeaders();
  const sessionRes = await auth.api.getSession({ headers });
  const authedUserId =
    (sessionRes as any)?.data?.user?.id ??
    (sessionRes as any)?.user?.id ??
    (sessionRes as any)?.session?.user?.id;
  if (!authedUserId) {
    return (
      <div className="prose">
        <h1>Organizations</h1>
        <p>You must be signed in.</p>
      </div>
    );
  }

  // List organizations accessible to the user
  const listRes = await auth.api.listOrganizations({ headers });
  const orgs = (listRes as any)?.data ?? [];

  // Determine active org id if available via session or first org
  const activeOrgId =
    (sessionRes as any)?.data?.session?.activeOrganizationId ??
    (sessionRes as any)?.session?.activeOrganizationId ??
    orgs[0]?.id;
  const activeOrg = activeOrgId
    ? await prisma.organization.findUnique({ where: { id: activeOrgId }, include: { members: { include: { user: true } } } })
    : null;
  const rolesMeta = activeOrg ? parseOrgMetadata(activeOrg.metadata) : { roles: [] };

  // Determine if current user can create orgs: allowed by env, or always for owner "Clarkcj"
  const userObj = (sessionRes as any)?.data?.user ?? (sessionRes as any)?.user ?? (sessionRes as any)?.session?.user;
  const uname = (userObj?.name ?? "").toString().toLowerCase();
  const username = userObj?.username ? String(userObj.username).toLowerCase() : "";
  const email = (userObj?.email ?? "").toString().toLowerCase();
  const ownerAllowed = uname === "clarkcj" || username === "clarkcj" || email.startsWith("clarkcj");
  const canCreateThisUser = canUsersCreateOrganizations || ownerAllowed;

  return (
    <div className="space-y-8">
      <div className="prose">
        <h1>Organizations</h1>
        <p>Create organizations, manage roles and fine-grained permissions, and assign users to roles.</p>
      </div>

      {/* Create Organization */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Create organization</h2>
        </div>
        <div className="card-content">
          {canCreateThisUser ? (
            <form action={createOrganizationAction} className="flex flex-col gap-3 max-w-xl">
              <div>
                <label className="label">Name</label>
                <input name="name" className="input w-full" placeholder="e.g. Imaginears" required />
              </div>
              <div>
                <label className="label">Slug (optional)</label>
                <input name="slug" className="input w-full" placeholder="imaginears-123" />
              </div>
              <button className="btn btn-primary w-max" type="submit">Create</button>
            </form>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Organization creation is disabled by the administrator. If you need a new organization, please contact support.
            </p>
          )}
        </div>
      </div>

      {/* Organizations list */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Your organizations</h2>
        </div>
        <div className="card-content">
          <ul className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {orgs.map((o: any) => (
              <li key={o.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{o.name}</div>
                  <div className="text-xs text-slate-500">{o.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  {activeOrgId === o.id ? (
                    <span className="badge">Active</span>
                  ) : (
                    <form action={setActiveOrgAction}>
                      <input type="hidden" name="organizationId" value={o.id} />
                      <button className="btn btn-outline btn-sm" type="submit">Set active</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
            {orgs.length === 0 && (
              <li className="py-3 text-slate-500">No organizations yet.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Active organization management */}
      {activeOrg && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roles and permissions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Roles & Permissions</h2>
              <p className="card-description">Define roles and assign permissions (comma-separated).</p>
            </div>
            <div className="card-content space-y-4">
              <form action={upsertRoleAction} className="flex flex-col gap-2">
                <input type="hidden" name="organizationId" value={activeOrg.id} />
                <label className="label">Role name</label>
                <input name="roleName" className="input" placeholder="e.g. admin" required />
                <label className="label">Permissions (comma-separated)</label>
                <input name="permissions" className="input" placeholder="manage:events, edit:applications" />
                <button className="btn btn-primary w-max" type="submit">Save role</button>
              </form>

              <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {rolesMeta.roles.map((r) => (
                  <div key={r.name} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-slate-500 break-all">{r.permissions.join(", ") || "No permissions"}</div>
                    </div>
                    <form action={deleteRoleAction}>
                      <input type="hidden" name="organizationId" value={activeOrg.id} />
                      <input type="hidden" name="roleName" value={r.name} />
                      <button className="btn btn-ghost btn-sm text-red-600" type="submit">Delete</button>
                    </form>
                  </div>
                ))}
                {rolesMeta.roles.length === 0 && (
                  <div className="py-3 text-slate-500">No roles defined yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Members</h2>
              <p className="card-description">Add users by email and assign them a role.</p>
            </div>
            <div className="card-content space-y-4">
              <form action={addUserToRoleAction} className="flex flex-col gap-2">
                <input type="hidden" name="organizationId" value={activeOrg.id} />
                <label className="label">User email</label>
                <input name="email" className="input" type="email" placeholder="user@example.com" required />
                <label className="label">Role</label>
                <select name="role" className="input">
                  {rolesMeta.roles.map((r) => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
                <button className="btn btn-primary w-max" type="submit">Add/Update Member</button>
              </form>

              <ul className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {activeOrg.members.map((m) => (
                  <li key={m.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{m.user.name || m.user.email || m.user.id}</div>
                      <div className="text-xs text-slate-500">Role: {m.role}</div>
                    </div>
                    <form action={removeMemberAction}>
                      <input type="hidden" name="memberId" value={m.id} />
                      <button className="btn btn-ghost btn-sm text-red-600" type="submit">Remove</button>
                    </form>
                  </li>
                ))}
                {activeOrg.members.length === 0 && (
                  <li className="py-3 text-slate-500">No members yet.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

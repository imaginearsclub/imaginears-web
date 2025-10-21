"use client";

import { auth } from "@/lib/auth";

export default function SignOutButton() {
    return (
        <button className="btn btn-muted btn-sm" onClick={() => auth.client.signOut({ redirectTo: "/login" })}>
            Sign out
        </button>
    );
}

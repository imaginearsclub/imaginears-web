import {getIronSession} from 'iron-session';
import {cookies} from "next/headers";
import {sessionOptions, AppSession} from "@/lib/session";

export async function requireAdminSession(){
    const session = await getIronSession<AppSession>(await cookies(), sessionOptions);
    if (!session.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }
    return session.user;
}

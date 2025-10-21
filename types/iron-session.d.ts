import 'iron-session';

declare module 'iron-session' {
    interface IronSessionData {
        user?: {
            id: string;
            email: string;
            role: 'ADMIN' | 'STAFF';
            name?: string | null;
        };
    }
}

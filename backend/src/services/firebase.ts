import type { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import logger, { logErrorReturnNull } from '@/services/logger';
import axios from 'axios';

// TODO: Replace with just the initializeApp method
// google app engine automatically finds the service account credentials
// export const app = admin.initializeApp();
import serviceAccount from '../../googleAdminKey.json';
export const firebase = admin.initializeApp({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    credential: admin.credential.cert(serviceAccount as any),
});

const auth = firebase.auth();

export const UserRoleArray = ['admin', 'manager', 'scanner', ''] as const;
export type UserRole = (typeof UserRoleArray)[number];

export type UserPermissions = 'modify-all' | 'read-all' | 'scan' | 'unscan';

export async function loadUserDataMiddleware(req: Request, res: Response, next: NextFunction) {
    const idToken = req.headers.authorization;
    if (!idToken) {
        req.user = null;
        return next();
    }

    const user = await verifyIdToken(idToken).catch(() => null);
    if (!user) {
        req.user = null;
        return next();
    }

    logger.http(`User ${user.email} (${user.role}) loaded`);

    req.user = user;
    return next();
}

export async function isUserMiddleware(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized, must be logged in' });
    }
    req.user = user;
    return next();
}

export function userHasPermissionsMiddleware(role: UserPermissions) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!userHasPermissions(req, role)) {
            return res.status(403).json({ message: `Unauthorized, must be ${role}` });
        }
        return next();
    };
}

export function userHasPermissions(req: Request, permissions: UserPermissions) {
    if (!req.user) return false;
    if (req.user.role === 'admin') return true;

    switch (permissions) {
        case 'scan':
            return req.user.role === 'scanner' || req.user.role === 'manager';
        case 'unscan':
            return req.user.role === 'manager';
        case 'read-all':
            return req.user.role === 'manager';
        case 'modify-all':
            return req.user.role === 'admin';
        default:
            return false;
    }
}

// ------- Firebase functions -------

export async function verifyIdToken(idToken: string) {
    return await auth.verifyIdToken(idToken).catch((error) => {
        if (error.message.startsWith('Firebase ID token has expired')) {
            throw new Error('Token expired');
        }
    });
}

export async function getUser(email: string) {
    return await auth.getUserByEmail(email);
}

export async function setUserRole(uid: string, role: UserRole) {
    return await auth.setCustomUserClaims(uid, { role });
}

import { Router, Request, Response } from 'express';
import { set, z } from 'zod';

import logger, { formatZodError, logErrorReturnNull } from '@/services/logger';
import {
    userHasPermissionsMiddleware,
    getUser,
    setUserRole,
    UserRoleArray,
    UserRole,
} from '@/services/firebase';

const router = Router();
router.use(userHasPermissionsMiddleware('modify-all'));
router.post('/setUserRole', setUserRoleHandler);
export default router;

// ------------------------
// POST /admin/setUserRole
// ------------------------

const setUserRoleSchema = z.object({
    email: z.string().email(),
    role: z.enum(UserRoleArray) as z.ZodType<UserRole>,
});

async function setUserRoleHandler(req: Request, res: Response) {
    const parsedData = setUserRoleSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({ message: formatZodError(parsedData.error) });
    }

    const data = parsedData.data;
    const user = await getUser(data.email).catch(logErrorReturnNull);
    if (!user) {
        return res.status(404).json({ message: `User "${data.email}" not found` });
    }

    try {
        await setUserRole(user.uid, data.role);
    } catch (error) {
        logger.error(error);
        return res.sendStatus(500);
    }

    logger.info(`"${data.email}" is now role "${data.role}"`);
    return res.sendStatus(200);
}

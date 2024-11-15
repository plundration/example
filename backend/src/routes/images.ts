import logger, { formatZodError } from '@/services/logger';
import { Router, Request, Response } from 'express';
import fs from 'fs';
import { z } from 'zod';

const baseDir = './uploads/gallery';

const router = Router();

router.get('/:id/list', (req: Request, res: Response) => {
    const parseId = z.coerce.number().safeParse(req.params.id);
    if (!parseId.success) {
        return res.status(400).json({ message: formatZodError(parseId.error) });
    }

    const id = parseId.data;

    let images;
    try {
        images = getImageList(id);
    } catch (error) {
        logger.error(error);
        return res.status(404).json({ message: 'Not found' });
    }

    return res.json({ images });
});

export default router;

function getImageList(id: number) {
    const images = getImageListFromFile(id);
    if (images) {
        return images;
    }

    const imagesFs = getImageListFs(id);
    storeImageListFile(id, imagesFs);
    return imagesFs;
}

function getImageListFromFile(id: number) {
    if (!fs.existsSync(`${baseDir}/${id}/list.json`)) {
        return null;
    }

    const result = fs.readFileSync(`${baseDir}/${id}/list.json`, { encoding: 'utf-8' });
    return JSON.parse(result) as string[];
}

function getImageListFs(id: number) {
    const result = fs.readdirSync(`${baseDir}/${id}`, { recursive: false, withFileTypes: true });
    const files = result.filter((file) => file.isFile());
    return files.map((file) => file.name);
}

function storeImageListFile(id: number, images: string[]) {
    fs.writeFileSync(`${baseDir}/${id}/list.json`, JSON.stringify(images), { encoding: 'utf-8' });
}

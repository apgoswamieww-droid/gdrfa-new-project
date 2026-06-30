const db = require('../../config/dbDirect');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class MediaController {
    static async list(req, res) {
        try {
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            const search = req.query.search || '';

            let whereClause = 'WHERE m.deletedAt IS NULL';
            const params = [];

            if (search) {
                whereClause += ' AND (m.title LIKE ? OR m.title_ar LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            const countResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM Media m ${whereClause}`,
                params
            );
            const total = countResult.total || 0;

            const data = await db.query(
                `SELECT m.* FROM Media m ${whereClause}
                 ORDER BY m.createdAt DESC
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [...params, start, length]
            );

            const baseUrl = `${req.protocol}://${req.get('host')}`;

            const ids = data.map(d => d.id);
            let tagsMap = {};
            if (ids.length > 0) {
                const placeholders = ids.map(() => '?').join(',');
                const tagsData = await db.query(
                    `SELECT mt.mediaId, t.id, t.name FROM media_tags mt
                     INNER JOIN tags t ON mt.tagId = t.id
                     WHERE mt.mediaId IN (${placeholders}) AND t.deletedAt IS NULL`,
                    ids
                );
                tagsData.forEach(t => {
                    if (!tagsMap[t.mediaId]) tagsMap[t.mediaId] = [];
                    tagsMap[t.mediaId].push({ id: t.id, name: t.name });
                });
            }

            const formatted = data.map(d => ({
                ...d,
                status: d.status === "1" ? "1" : "0",
                file_url: d.file
                    ? (d.file.startsWith('http') ? d.file : `${baseUrl}/${d.file}`)
                    : '',
                tags: tagsMap[d.id] || []
            }));

            return res.json({
                status: true,
                message: 'Media retrieved successfully',
                data: { data: formatted, total }
            });
        } catch (error) {
            console.error('Error in list media:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async store(req, res) {
        try {
            const { title, title_ar, description, description_ar } = req.body;

            if (!title || !description) {
                return res.status(400).json({ status: false, message: 'Title and description are required' });
            }

            if (!req.file) {
                return res.status(400).json({ status: false, message: 'Media file is required' });
            }

            const { size, mimetype, path: filePath } = req.file;
            const maxImageSize = 5 * 1024 * 1024;
            const maxVideoSize = 50 * 1024 * 1024;
            const maxDocSize = 10 * 1024 * 1024;

            const cleanup = () => { try { fs.unlinkSync(filePath); } catch {} };

            let fileType = '';
            if (mimetype.startsWith('image/')) {
                fileType = 'image';
                if (size > maxImageSize) { cleanup(); return res.status(400).json({ status: false, message: 'Image file too large. Max 5MB allowed.' }); }
            } else if (mimetype.startsWith('video/')) {
                fileType = 'video';
                if (size > maxVideoSize) { cleanup(); return res.status(400).json({ status: false, message: 'Video file too large. Max 50MB allowed.' }); }
            } else if (['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(mimetype)) {
                fileType = 'document';
                if (size > maxDocSize) { cleanup(); return res.status(400).json({ status: false, message: 'Document file too large. Max 10MB allowed.' }); }
            } else {
                cleanup();
                return res.status(400).json({ status: false, message: 'Invalid file type. Allowed: JPG, PNG, MP4, PDF, DOCX, PPTX' });
            }

            const file = `uploads/media/${req.file.filename}`;

            await db.query(
                `INSERT INTO Media (title, title_ar, description, description_ar, [file], fileType, [status], createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, '1', SYSDATETIME(), SYSDATETIME())`,
                [title.trim(), title_ar || null, description.trim(), description_ar || null, file, fileType]
            );

            const postResult = await db.queryOne(
                `SELECT CAST(IDENT_CURRENT('Media') as INT) as id`
            );
            const mediaId = postResult?.id;

            if (mediaId && req.body.tags) {
                let tags = [];
                try { tags = JSON.parse(req.body.tags); } catch {}
                if (Array.isArray(tags) && tags.length > 0) {
                    for (let tagName of tags) {
                        if (!tagName || !tagName.trim()) continue;
                        let tag = await db.queryOne(
                            `SELECT id FROM tags WHERE LOWER(name) = LOWER(?) AND deletedAt IS NULL`,
                            [tagName.trim()]
                        );
                        if (tag) {
                            await db.query(
                                `INSERT INTO media_tags (mediaId, tagId, createdAt, updatedAt) VALUES (?, ?, SYSDATETIME(), SYSDATETIME())`,
                                [mediaId, tag.id]
                            );
                        } else {
                            await db.query(
                                `INSERT INTO tags (name, status, createdAt, updatedAt) VALUES (?, '1', SYSDATETIME(), SYSDATETIME())`,
                                [tagName.trim()]
                            );
                            const newTag = await db.queryOne(
                                `SELECT CAST(IDENT_CURRENT('tags') as INT) as id`
                            );
                            if (newTag?.id) {
                                await db.query(
                                    `INSERT INTO media_tags (mediaId, tagId, createdAt, updatedAt) VALUES (?, ?, SYSDATETIME(), SYSDATETIME())`,
                                    [mediaId, newTag.id]
                                );
                            }
                        }
                    }
                }
            }

            return res.json({ status: true, message: 'Media created successfully' });
        } catch (error) {
            console.error('Error in store media:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async show(req, res) {
        try {
            const mediaId = req.params.id;
            const media = await db.queryOne(
                `SELECT * FROM Media WHERE id = ? AND deletedAt IS NULL`,
                [mediaId]
            );

            if (!media) {
                return res.status(404).json({ status: false, message: 'Media not found' });
            }

            const baseUrl = `${req.protocol}://${req.get('host')}`;

            const tags = await db.query(
                `SELECT t.id, t.name FROM tags t
                 INNER JOIN media_tags mt ON t.id = mt.tagId
                 WHERE mt.mediaId = ? AND t.deletedAt IS NULL
                 ORDER BY t.name ASC`,
                [mediaId]
            );

            const formatted = {
                ...media,
                status: media.status === "1" ? "1" : "0",
                file_url: media.file
                    ? (media.file.startsWith('http') ? media.file : `${baseUrl}/${media.file}`)
                    : '',
                tags: tags || []
            };

            return res.json({
                status: true,
                message: 'Media retrieved successfully',
                data: formatted
            });
        } catch (error) {
            console.error('Error in show media:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const mediaId = req.params.id;
            const { title, title_ar, description, description_ar } = req.body;

            const media = await db.queryOne(
                `SELECT * FROM Media WHERE id = ? AND deletedAt IS NULL`,
                [mediaId]
            );

            if (!media) {
                return res.status(404).json({ status: false, message: 'Media not found' });
            }

            let filePath = media.file;
            let fileType = media.fileType;

            if (req.file) {
                const { size, mimetype, path: diskPath } = req.file;
                const maxImageSize = 5 * 1024 * 1024;
                const maxVideoSize = 50 * 1024 * 1024;
                const maxDocSize = 10 * 1024 * 1024;

                const cleanup = () => { try { fs.unlinkSync(diskPath); } catch {} };

                if (mimetype.startsWith('image/')) {
                    fileType = 'image';
                    if (size > maxImageSize) { cleanup(); return res.status(400).json({ status: false, message: 'Image file too large. Max 5MB allowed.' }); }
                } else if (mimetype.startsWith('video/')) {
                    fileType = 'video';
                    if (size > maxVideoSize) { cleanup(); return res.status(400).json({ status: false, message: 'Video file too large. Max 50MB allowed.' }); }
                } else if (['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(mimetype)) {
                    fileType = 'document';
                    if (size > maxDocSize) { cleanup(); return res.status(400).json({ status: false, message: 'Document file too large. Max 10MB allowed.' }); }
                } else {
                    cleanup();
                    return res.status(400).json({ status: false, message: 'Invalid file type. Allowed: JPG, PNG, MP4, PDF, DOCX, PPTX' });
                }

                filePath = `uploads/media/${req.file.filename}`;

                if (media.file) {
                    const oldPath = path.join(__dirname, '../../', media.file);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
            }

            await db.query(
                `UPDATE Media SET title = ?, title_ar = ?, description = ?, description_ar = ?, [file] = ?, fileType = ?, updatedAt = SYSDATETIME()
                 WHERE id = ?`,
                [title || media.title, title_ar || media.title_ar, description || media.description, description_ar || media.description_ar, filePath, fileType, mediaId]
            );

            await db.query(`DELETE FROM media_tags WHERE mediaId = ?`, [mediaId]);

            if (req.body.tags) {
                let tags = [];
                try { tags = JSON.parse(req.body.tags); } catch {}
                if (Array.isArray(tags) && tags.length > 0) {
                    for (let tagName of tags) {
                        if (!tagName || !tagName.trim()) continue;
                        let tag = await db.queryOne(
                            `SELECT id FROM tags WHERE LOWER(name) = LOWER(?) AND deletedAt IS NULL`,
                            [tagName.trim()]
                        );
                        if (tag) {
                            await db.query(
                                `INSERT INTO media_tags (mediaId, tagId, createdAt, updatedAt) VALUES (?, ?, SYSDATETIME(), SYSDATETIME())`,
                                [mediaId, tag.id]
                            );
                        } else {
                            await db.query(
                                `INSERT INTO tags (name, status, createdAt, updatedAt) VALUES (?, '1', SYSDATETIME(), SYSDATETIME())`,
                                [tagName.trim()]
                            );
                            const newTag = await db.queryOne(
                                `SELECT CAST(IDENT_CURRENT('tags') as INT) as id`
                            );
                            if (newTag?.id) {
                                await db.query(
                                    `INSERT INTO media_tags (mediaId, tagId, createdAt, updatedAt) VALUES (?, ?, SYSDATETIME(), SYSDATETIME())`,
                                    [mediaId, newTag.id]
                                );
                            }
                        }
                    }
                }
            }

            return res.json({ status: true, message: 'Media updated successfully' });
        } catch (error) {
            console.error('Error in update media:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const mediaId = req.params.id;
            const media = await db.queryOne(
                `SELECT * FROM Media WHERE id = ? AND deletedAt IS NULL`,
                [mediaId]
            );

            if (!media) {
                return res.status(404).json({ status: false, message: 'Media not found' });
            }

            if (media.file) {
                const filePath = path.join(__dirname, '../../', media.file);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            await db.query(
                `UPDATE Media SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
                [mediaId]
            );

            return res.json({ status: true, message: 'Media deleted successfully' });
        } catch (error) {
            console.error('Error in delete media:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = MediaController;

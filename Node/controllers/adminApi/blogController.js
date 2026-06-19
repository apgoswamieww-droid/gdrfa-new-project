const db = require('../../config/dbDirect');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class BlogController {
    static async list(req, res) {
        try {
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            const search = req.query.search || '';

            let whereClause = 'WHERE deletedAt IS NULL';
            const params = [];

            if (search) {
                whereClause += ' AND (title LIKE ? OR title_ar LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            const countResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM blog_posts ${whereClause}`,
                params
            );
            const total = countResult.total || 0;

            const data = await db.query(
                `SELECT * FROM blog_posts ${whereClause} 
                 ORDER BY createdAt DESC 
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [...params, start, length]
            );

            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const formatted = data.map(b => ({
                ...b,
                status: b.status === "1" ? "1" : "0",
                media_url: b.media
                    ? (b.media.startsWith('http') ? b.media : `${baseUrl}/${b.media}`)
                    : ''
            }));

            const blogIds = formatted.map(b => b.id);
            let tagsMap = {};
            if (blogIds.length > 0) {
                const placeholders = blogIds.map(() => '?').join(',');
                const tagsData = await db.query(
                    `SELECT pt.postId, t.id, t.name FROM post_tags pt
                     INNER JOIN tags t ON pt.tagId = t.id
                     WHERE pt.postId IN (${placeholders}) AND t.deletedAt IS NULL`,
                    blogIds
                );
                tagsData.forEach(t => {
                    if (!tagsMap[t.postId]) tagsMap[t.postId] = [];
                    tagsMap[t.postId].push({ id: t.id, name: t.name });
                });
            }
            const withTags = formatted.map(b => ({
                ...b,
                tags: tagsMap[b.id] || []
            }));

            return res.json({
                status: true,
                message: 'Blog posts retrieved successfully',
                data: { data: withTags, total }
            });
        } catch (error) {
            console.error('Error in list blog posts:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async store(req, res) {
        try {
            const { title, title_ar, shortDescription, shortDescription_ar, content, content_ar } = req.body;

            if (!title || !shortDescription) {
                return res.status(400).json({ status: false, message: 'Title and short description are required' });
            }

            let mediaPath = null;
            let mediaType = null;

            if (req.file) {
                const filePath = req.file.path;
                const { size, mimetype } = req.file;
                const maxImageSize = 20 * 1024 * 1024;
                const maxVideoSize = 100 * 1024 * 1024;

                const cleanup = () => { try { fs.unlinkSync(filePath); } catch {} };

                if (mimetype.startsWith('image/')) {
                    mediaType = 'image';
                    if (size > maxImageSize) {
                        cleanup();
                        return res.status(400).json({ status: false, message: 'Image file too large. Max 20MB allowed.' });
                    }
                } else if (mimetype.startsWith('video/')) {
                    mediaType = 'video';
                    if (size > maxVideoSize) {
                        cleanup();
                        return res.status(400).json({ status: false, message: 'Video file too large. Max 100MB allowed.' });
                    }
                } else {
                    cleanup();
                    return res.status(400).json({ status: false, message: 'Invalid file type. Only images and videos are allowed.' });
                }

                mediaPath = `uploads/blog/${req.file.filename}`;
            }

            await db.query(
                `INSERT INTO blog_posts (title, title_ar, shortDescription, shortDescription_ar, media, mediaType, content, content_ar, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, '1', SYSDATETIME(), SYSDATETIME())`,
                [title.trim(), title_ar || null, shortDescription.trim(), shortDescription_ar || null, mediaPath, mediaType, content || null, content_ar || null]
            );

            const postResult = await db.queryOne(
                `SELECT CAST(IDENT_CURRENT('blog_posts') as INT) as id`
            );
            const postId = postResult?.id;

            if (postId && req.body.tags) {
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
                                `INSERT INTO post_tags (postId, tagId, createdAt, updatedAt) VALUES (?, ?, SYSDATETIME(), SYSDATETIME())`,
                                [postId, tag.id]
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
                                    `INSERT INTO post_tags (postId, tagId, createdAt, updatedAt) VALUES (?, ?, SYSDATETIME(), SYSDATETIME())`,
                                    [postId, newTag.id]
                                );
                            }
                        }
                    }
                }
            }

            return res.json({ status: true, message: 'Blog post created successfully' });
        } catch (error) {
            console.error('Error in store blog post:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const postId = req.params.id;
            const { title, title_ar, shortDescription, shortDescription_ar, content, content_ar } = req.body;

            const post = await db.queryOne(
                `SELECT * FROM blog_posts WHERE id = ? AND deletedAt IS NULL`,
                [postId]
            );

            if (!post) {
                return res.status(404).json({ status: false, message: 'Blog post not found' });
            }

            let mediaPath = post.media;
            let mediaType = post.mediaType;

            if (req.file) {
                const filePath = req.file.path;
                const { size, mimetype } = req.file;
                const maxImageSize = 20 * 1024 * 1024;
                const maxVideoSize = 100 * 1024 * 1024;

                const cleanup = () => { try { fs.unlinkSync(filePath); } catch {} };

                if (mimetype.startsWith('image/')) {
                    mediaType = 'image';
                    if (size > maxImageSize) {
                        cleanup();
                        return res.status(400).json({ status: false, message: 'Image file too large. Max 20MB allowed.' });
                    }
                } else if (mimetype.startsWith('video/')) {
                    mediaType = 'video';
                    if (size > maxVideoSize) {
                        cleanup();
                        return res.status(400).json({ status: false, message: 'Video file too large. Max 100MB allowed.' });
                    }
                } else {
                    cleanup();
                    return res.status(400).json({ status: false, message: 'Invalid file type. Only images and videos are allowed.' });
                }

                mediaPath = `uploads/blog/${req.file.filename}`;

                if (post.media) {
                    const oldPath = path.join(__dirname, '../../', post.media);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
            }

            await db.query(
                `UPDATE blog_posts SET title = ?, title_ar = ?, shortDescription = ?, shortDescription_ar = ?, media = ?, mediaType = ?, content = ?, content_ar = ?, updatedAt = SYSDATETIME()
                 WHERE id = ?`,
                [title || post.title, title_ar || post.title_ar, shortDescription || post.shortDescription, shortDescription_ar || post.shortDescription_ar, mediaPath, mediaType, content !== undefined ? content : post.content, content_ar !== undefined ? content_ar : post.content_ar, postId]
            );

            await db.query(`DELETE FROM post_tags WHERE postId = ?`, [postId]);

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
                                `INSERT INTO post_tags (postId, tagId, createdAt, updatedAt) VALUES (?, ?, SYSDATETIME(), SYSDATETIME())`,
                                [postId, tag.id]
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
                                    `INSERT INTO post_tags (postId, tagId, createdAt, updatedAt) VALUES (?, ?, SYSDATETIME(), SYSDATETIME())`,
                                    [postId, newTag.id]
                                );
                            }
                        }
                    }
                }
            }

            return res.json({ status: true, message: 'Blog post updated successfully' });
        } catch (error) {
            console.error('Error in update blog post:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async show(req, res) {
        try {
            const postId = req.params.id;
            const post = await db.queryOne(
                `SELECT * FROM blog_posts WHERE id = ? AND deletedAt IS NULL`,
                [postId]
            );

            if (!post) {
                return res.status(404).json({ status: false, message: 'Blog post not found' });
            }

            const baseUrl = `${req.protocol}://${req.get('host')}`;

            const tags = await db.query(
                `SELECT t.id, t.name FROM tags t
                 INNER JOIN post_tags pt ON t.id = pt.tagId
                 WHERE pt.postId = ? AND t.deletedAt IS NULL
                 ORDER BY t.name ASC`,
                [postId]
            );

            const formatted = {
                ...post,
                status: post.status === "1" ? "1" : "0",
                media_url: post.media
                    ? (post.media.startsWith('http') ? post.media : `${baseUrl}/${post.media}`)
                    : '',
                tags: tags || []
            };

            return res.json({
                status: true,
                message: 'Blog post retrieved successfully',
                data: formatted
            });
        } catch (error) {
            console.error('Error in show blog post:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const postId = req.params.id;
            const post = await db.queryOne(
                `SELECT * FROM blog_posts WHERE id = ? AND deletedAt IS NULL`,
                [postId]
            );

            if (!post) {
                return res.status(404).json({ status: false, message: 'Blog post not found' });
            }

            if (post.media) {
                const mediaPath = path.join(__dirname, '../../', post.media);
                if (fs.existsSync(mediaPath)) {
                    fs.unlinkSync(mediaPath);
                }
            }

            await db.query(
                `UPDATE blog_posts SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
                [postId]
            );

            return res.json({ status: true, message: 'Blog post deleted successfully' });
        } catch (error) {
            console.error('Error in delete blog post:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async listTags(req, res) {
        try {
            const tags = await db.query(
                `SELECT id, name FROM tags WHERE status = '1' AND deletedAt IS NULL ORDER BY name ASC`
            );
            return res.json({ status: true, data: tags || [] });
        } catch (error) {
            console.error('Error in list tags:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = BlogController;

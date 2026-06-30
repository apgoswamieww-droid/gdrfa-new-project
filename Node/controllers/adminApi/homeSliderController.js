const db = require('../../config/dbDirect');
const imagePath = require('../../utils/imagePath');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

class HomeSliderController {
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
                `SELECT COUNT(*) as total FROM home_sliders ${whereClause}`,
                params
            );
            const total = countResult.total || 0;

            const data = await db.query(
                `SELECT * FROM home_sliders ${whereClause} 
                 ORDER BY createdAt DESC 
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [...params, start, length]
            );

            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const formatted = data.map(s => ({
                ...s,
                status: s.status === "1" ? "1" : "0",
                media_url: s.media_path
                    ? (s.media_path.startsWith('http') ? s.media_path : `${baseUrl}/${s.media_path}`)
                    : ''
            }));

            return res.json({
                status: true,
                message: 'Home sliders retrieved successfully',
                data: { data: formatted, total }
            });
        } catch (error) {
            console.error('Error in list home sliders:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async store(req, res) {
        try {
            const { title, title_ar, short_description, short_description_ar } = req.body;

            if (!title || !short_description) {
                return res.status(400).json({ status: false, message: 'Title and short description are required' });
            }

            if (!req.file) {
                return res.status(400).json({ status: false, message: 'Media file is required' });
            }

            const filePath = req.file.path;
            const { size, mimetype } = req.file;

            const maxImageSize = 20 * 1024 * 1024;
            const maxVideoSize = 100 * 1024 * 1024;

            let mediaType = '';

            const cleanup = () => { try { fs.unlinkSync(filePath); } catch {} };

            if (mimetype.startsWith('image/')) {
                mediaType = 'image';
                if (size > maxImageSize) {
                    cleanup();
                    return res.status(400).json({ status: false, message: 'Image file too large. Max 20MB allowed.' });
                }
                try {
                    const metadata = await sharp(filePath).metadata();
                    const w = metadata.width, h = metadata.height;
                    if (Math.abs(w - 1440) > 100 || Math.abs(h - 800) > 100) {
                        cleanup();
                        return res.status(400).json({ status: false, message: `Image must be close to 1440x800 pixels (uploaded: ${w}x${h}).` });
                    }
                } catch (dimErr) {
                    cleanup();
                    return res.status(400).json({ status: false, message: 'Could not read image dimensions. Please upload a valid image.' });
                }
            } else if (mimetype.startsWith('video/')) {
                mediaType = 'video';
                if (size > maxVideoSize) {
                    cleanup();
                    return res.status(400).json({ status: false, message: 'Video file too large. Max 100MB allowed.' });
                }
                try {
                    await new Promise((resolve, reject) => {
                        ffmpeg.ffprobe(filePath, (err, metadata) => {
                            if (err) return reject(err);
                            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                            if (!videoStream) return reject(new Error('No video stream found'));
                            const w = videoStream.width;
                            const h = videoStream.height;
                            if (w < h) {
                                cleanup();
                                reject(new Error(`Video must be wide/landscape orientation (uploaded: ${w}x${h}).`));
                                return;
                            }
                            resolve();
                        });
                    });
                } catch (vidErr) {
                    cleanup();
                    return res.status(400).json({ status: false, message: vidErr.message || 'Invalid video file.' });
                }
            } else {
                cleanup();
                return res.status(400).json({ status: false, message: 'Invalid file type. Only images and videos are allowed.' });
            }

            const mediaPath = `uploads/homeSlider/${req.file.filename}`;

            await db.query(
                `INSERT INTO home_sliders (title, title_ar, short_description, short_description_ar, media_type, media_path, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, '1', SYSDATETIME(), SYSDATETIME())`,
                [title.trim(), title_ar || null, short_description.trim(), short_description_ar || null, mediaType, mediaPath]
            );

            return res.json({ status: true, message: 'Home slider created successfully' });
        } catch (error) {
            console.error('Error in store home slider:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const sliderId = req.params.id;
            const { title, title_ar, short_description, short_description_ar } = req.body;

            const slider = await db.queryOne(
                `SELECT * FROM home_sliders WHERE id = ? AND deletedAt IS NULL`,
                [sliderId]
            );

            if (!slider) {
                return res.status(404).json({ status: false, message: 'Home slider not found' });
            }

            let mediaPath = slider.media_path;
            let mediaType = slider.media_type;

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
                    try {
                        const metadata = await sharp(filePath).metadata();
                        const w = metadata.width, h = metadata.height;
                        if (Math.abs(w - 1440) > 100 || Math.abs(h - 800) > 100) {
                            cleanup();
                            return res.status(400).json({ status: false, message: `Image must be close to 1440x800 pixels (uploaded: ${w}x${h}).` });
                        }
                    } catch (dimErr) {
                        cleanup();
                        return res.status(400).json({ status: false, message: 'Could not read image dimensions.' });
                    }
                } else if (mimetype.startsWith('video/')) {
                    mediaType = 'video';
                    if (size > maxVideoSize) {
                        cleanup();
                        return res.status(400).json({ status: false, message: 'Video file too large. Max 100MB allowed.' });
                    }
                    try {
                        await new Promise((resolve, reject) => {
                            ffmpeg.ffprobe(filePath, (err, metadata) => {
                                if (err) return reject(err);
                                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                                if (!videoStream) return reject(new Error('No video stream found'));
                                const w = videoStream.width;
                                const h = videoStream.height;
                                if (w < h) {
                                    cleanup();
                                    reject(new Error(`Video must be wide/landscape orientation (uploaded: ${w}x${h}).`));
                                    return;
                                }
                                resolve();
                            });
                        });
                    } catch (vidErr) {
                        cleanup();
                        return res.status(400).json({ status: false, message: vidErr.message || 'Invalid video file.' });
                    }
                } else {
                    cleanup();
                    return res.status(400).json({ status: false, message: 'Invalid file type. Only images and videos are allowed.' });
                }

                mediaPath = `uploads/homeSlider/${req.file.filename}`;

                if (slider.media_path) {
                    const oldPath = path.join(__dirname, '../../', slider.media_path);
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                }
            }

            await db.query(
                `UPDATE home_sliders SET title = ?, title_ar = ?, short_description = ?, short_description_ar = ?, media_path = ?, media_type = ?, updatedAt = SYSDATETIME()
                 WHERE id = ?`,
                [title || slider.title, title_ar || slider.title_ar, short_description || slider.short_description, short_description_ar || slider.short_description_ar, mediaPath, mediaType, sliderId]
            );

            return res.json({ status: true, message: 'Home slider updated successfully' });
        } catch (error) {
            console.error('Error in update home slider:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const sliderId = req.params.id;
            const slider = await db.queryOne(
                `SELECT * FROM home_sliders WHERE id = ? AND deletedAt IS NULL`,
                [sliderId]
            );

            if (!slider) {
                return res.status(404).json({ status: false, message: 'Home slider not found' });
            }

            if (slider.media_path) {
                const mediaPath = path.join(__dirname, '../../', slider.media_path);
                if (fs.existsSync(mediaPath)) {
                    fs.unlinkSync(mediaPath);
                }
            }

            await db.query(
                `UPDATE home_sliders SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
                [sliderId]
            );

            return res.json({ status: true, message: 'Home slider deleted successfully' });
        } catch (error) {
            console.error('Error in delete home slider:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = HomeSliderController;

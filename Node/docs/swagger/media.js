/**
 * @swagger
 * /api/media-list:
 *   get:
 *     tags: [Media]
 *     summary: Get all media with pagination
 *     description: Retrieve list of media items with multilingual support
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Media retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           title:
 *                             type: string
 *                             example: "Media Title (localized)"
 *                           description:
 *                             type: string
 *                             example: "Media description (localized)"
 *                           file:
 *                             type: string
 *                             example: "http://localhost:8080/uploads/media/file.jpg"
 *                           fileType:
 *                             type: string
 *                             example: "image"
 *                           tags:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 1
 *                                 name:
 *                                   type: string
 *                                   example: "Sports"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * @swagger
 * /api/media/{id}:
 *   get:
 *     tags: [Media]
 *     summary: Get media by ID
 *     description: Retrieve a specific media item with related media
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Media ID
 *         schema:
 *           type: integer
 *           example: 1
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Media retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         title:
 *                           type: string
 *                           example: "Media Title (localized)"
 *                         description:
 *                           type: string
 *                           example: "Media description (localized)"
 *                         file:
 *                           type: string
 *                           example: "http://localhost:8080/uploads/media/file.jpg"
 *                         fileType:
 *                           type: string
 *                           example: "image"
 *                         tags:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               name:
 *                                 type: string
 *                                 example: "Sports"
 *                         relatedMedia:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 2
 *                               title:
 *                                 type: string
 *                                 example: "Related Media Title"
 *                               file:
 *                                 type: string
 *                                 example: "http://localhost:8080/uploads/media/related.jpg"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Media not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
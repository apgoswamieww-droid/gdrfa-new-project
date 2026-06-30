/**
 * @swagger
 * /api/blog-list:
 *   get:
 *     tags: [Blogs]
 *     summary: Get all blogs with pagination
 *     description: Retrieve list of blogs with multilingual support
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Blogs retrieved successfully
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
 *                         $ref: '#/components/schemas/Blog'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * @swagger
 * /api/blog/{id}:
 *   get:
 *     tags: [Blogs]
 *     summary: Get blog by ID
 *     description: Retrieve a specific blog post with related blogs
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Blog ID
 *         schema:
 *           type: integer
 *           example: 1
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Blog retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Blog'
 *                         - type: object
 *                           properties:
 *                             relatedBlogs:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Blog'
 *       404:
 *         description: Blog not found
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
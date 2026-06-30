/**
 * @swagger
 * /api/cms:
 *   get:
 *     tags: [CMS Pages]
 *     summary: Get all CMS pages
 *     description: Retrieve list of all active CMS pages with multilingual support
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Pages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
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
 *                           slug:
 *                             type: string
 *                             example: "privacy-policy"
 *                           name:
 *                             type: string
 *                             example: "Privacy Policy (localized)"
 *                           status:
 *                             type: string
 *                             example: "1"
 *       404:
 *         description: No pages found
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
 *
 * @swagger
 * /api/cms/{slug}:
 *   get:
 *     tags: [CMS Pages]
 *     summary: Get CMS page by slug
 *     description: Retrieve a specific CMS page content by its slug with multilingual support
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         description: Page slug
 *         schema:
 *           type: string
 *           example: "privacy-policy"
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Page retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CmsPage'
 *       404:
 *         description: Page not found
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
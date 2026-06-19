/**
 * @swagger
 * /api/home-event:
 *   get:
 *     tags: [Events]
 *     summary: Get home page events
 *     description: Retrieve events for home page display
 *     parameters:
 *       - name: year
 *         in: query
 *         description: Filter events by year
 *         required: false
 *         schema:
 *           type: integer
 *           example: 2025
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * @swagger
 * /api/event/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get event by ID
 *     description: Retrieve detailed information about a specific event
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Event ID
 *         schema:
 *           type: integer
 *           example: 1
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
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
 * /api/team-details/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get team details
 *     description: Retrieve detailed information about a specific team
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Team ID
 *         schema:
 *           type: integer
 *           example: 1
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Team details retrieved successfully
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
 *                         name:
 *                           type: string
 *                           example: "Team Alpha"
 *                         TeamPlayers:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               player:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 1
 *                                   name:
 *                                     type: string
 *                                     example: "John Doe"
 *                                   email:
 *                                     type: string
 *                                     example: "john.doe@example.com"
 *                         events:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Event'
 *       404:
 *         description: Team not found
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
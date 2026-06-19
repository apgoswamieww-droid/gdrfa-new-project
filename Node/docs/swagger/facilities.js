/**
 * @swagger
 * /api/facilities:
 *   get:
 *     tags: [Facilities]
 *     summary: Get all facilities
 *     description: Retrieve list of all active sports facilities
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Facilities retrieved successfully
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
 *                           title:
 *                             type: string
 *                             example: "Swimming Pool"
 *                           description:
 *                             type: string
 *                             example: "Olympic size swimming pool"
 *                           image:
 *                             type: string
 *                             example: "http://localhost:8080/uploads/facilities/pool.jpg"
 *                           status:
 *                             type: string
 *                             example: "1"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * @swagger
 * /api/facility-request:
 *   post:
 *     tags: [Facilities]
 *     summary: Create facility booking request
 *     description: Submit a request to book a facility for future dates only
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facility_id
 *               - requested_date
 *               - start_time
 *               - end_time
 *               - purpose
 *             properties:
 *               facility_id:
 *                 type: integer
 *                 example: 1
 *               requested_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-10-15"
 *                 description: "Must be a future date"
 *               start_time:
 *                 type: string
 *                 format: time
 *                 example: "09:00"
 *               end_time:
 *                 type: string
 *                 format: time
 *                 example: "11:00"
 *               purpose:
 *                 type: string
 *                 example: "Team training session"
 *     responses:
 *       200:
 *         description: Facility request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error (past date not allowed)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
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
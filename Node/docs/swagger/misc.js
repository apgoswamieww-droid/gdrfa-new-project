/**
 * @swagger
 * /api/faq:
 *   get:
 *     tags: [FAQ]
 *     summary: Get frequently asked questions
 *     description: Retrieve list of active FAQs with multilingual support
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: FAQs retrieved successfully
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
 *                           question:
 *                             type: string
 *                             example: "How do I register for events? (localized)"
 *                           answer:
 *                             type: string
 *                             example: "You can register through the mobile app. (localized)"
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
 * /api/home-slider:
 *   get:
 *     tags: [Home]
 *     summary: Get home page sliders
 *     description: Retrieve list of active home page sliders with multilingual support
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Sliders retrieved successfully
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
 *                             example: "Welcome to GDRFA Sports (localized)"
 *                           description:
 *                             type: string
 *                             example: "Join our sports community (localized)"
 *                           image:
 *                             type: string
 *                             example: "http://localhost:8080/uploads/sliders/slide1.jpg"
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
 * /api/contact-us:
 *   post:
 *     tags: [Contact]
 *     summary: Submit contact form
 *     description: Submit a contact us form
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               subject:
 *                 type: string
 *                 example: "Inquiry about sports programs"
 *               message:
 *                 type: string
 *                 example: "I would like to know more about your programs."
 *               phone:
 *                 type: string
 *                 example: "+971501234567"
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
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
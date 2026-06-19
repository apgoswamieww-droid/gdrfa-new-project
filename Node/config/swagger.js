const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'GDRFA API Documentation',
    version: '1.0.0',
    description: 'API documentation for GDRFA backend system with multilingual support (Arabic/English)',
    contact: {
      name: 'GDRFA Development Team',
      email: 'support@gdrfa.ae',
    },
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : `http://localhost:${process.env.PORT || 8080}`,
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication',
      },
    },
    schemas: {
      // Common response schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully',
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'An error occurred',
          },
        },
      },
      PaginationResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Data retrieved successfully',
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              total: {
                type: 'integer',
                example: 100,
              },
              page: {
                type: 'integer',
                example: 1,
              },
              limit: {
                type: 'integer',
                example: 10,
              },
              totalPages: {
                type: 'integer',
                example: 10,
              },
            },
          },
        },
      },
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com',
          },
          mobile: {
            type: 'string',
            example: '+971501234567',
          },
          image: {
            type: 'string',
            nullable: true,
            example: 'uploads/user/profile.jpg',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      // Blog schemas
      Blog: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          title: {
            type: 'string',
            example: 'Blog Title (localized)',
          },
          shortDescription: {
            type: 'string',
            example: 'Short description (localized)',
          },
          media: {
            type: 'string',
            nullable: true,
            example: 'http://localhost:8080/uploads/blog/image.jpg',
          },
          mediaType: {
            type: 'string',
            enum: ['image', 'video'],
            example: 'image',
          },
          content: {
            type: 'object',
            description: 'EditorJS content (localized)',
          },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  example: 1,
                },
                name: {
                  type: 'string',
                  example: 'Sports',
                },
              },
            },
          },
          readingTime: {
            type: 'string',
            example: '5 min read',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      // CMS Page schemas
      CmsPage: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          slug: {
            type: 'string',
            example: 'privacy-policy',
          },
          name: {
            type: 'string',
            example: 'Privacy Policy (localized)',
          },
          description: {
            type: 'string',
            example: 'Page content (localized)',
          },
          status: {
            type: 'string',
            example: '1',
          },
        },
      },
      // Event schemas
      Event: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'Sports Event',
          },
          startDate: {
            type: 'string',
            format: 'date',
            example: '2025-10-15',
          },
          endDate: {
            type: 'string',
            format: 'date',
            example: '2025-10-20',
          },
          location: {
            type: 'string',
            example: 'Dubai Sports Complex',
          },
          image: {
            type: 'string',
            nullable: true,
            example: 'http://localhost:8080/uploads/events/event.jpg',
          },
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  example: 1,
                },
                name: {
                  type: 'string',
                  example: 'Football',
                },
                type: {
                  type: 'string',
                  example: 'Team Sport',
                },
              },
            },
          },
        },
      },
    },
    parameters: {
      AcceptLanguage: {
        name: 'Accept-Language',
        in: 'header',
        description: 'Language preference for localized content',
        required: false,
        schema: {
          type: 'string',
          enum: ['en', 'ar'],
          default: 'en',
        },
        example: 'ar',
      },
      PageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
        example: 1,
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        example: 10,
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and profile management',
    },
    {
      name: 'Blogs',
      description: 'Blog posts with multilingual support',
    },
    {
      name: 'CMS Pages',
      description: 'Content management system pages',
    },
    {
      name: 'Events',
      description: 'Sports events and activities',
    },
    {
      name: 'Media',
      description: 'Media gallery with multilingual support',
    },
    {
      name: 'Facilities',
      description: 'Sports facilities and booking',
    },
    {
      name: 'FAQ',
      description: 'Frequently asked questions',
    },
    {
      name: 'Contact',
      description: 'Contact us functionality',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './routes/apiRoutes.js',
    './controllers/api/*.js',
    './docs/swagger/*.js', // For additional documentation files
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerSpec,
  swaggerUi,
};
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hệ thống cho thuê xe máy - Motorbike Rental System',
      description: 'Tài liệu hướng dẫn API đầy đủ cho hệ thống thuê xe máy cao cấp.',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Máy chủ kiểm thử (Development)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Sử dụng đường dẫn tuyệt đối để đảm bảo quét đúng tệp trên Windows
  apis: [path.join(__dirname, '../routes/*.js')], 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Rental Management API",
      version: "1.0.0",
      description: "API documentation for the Rental Management System",
    },
    servers: [
      {
        url: "https://collaborative-gregorio-unleavened.ngrok-free.dev",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

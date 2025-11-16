import { fastify, FastifyBaseLogger, FastifyInstance, FastifyTypeProvider } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { RawServerDefault } from 'fastify';
import { IncomingMessage, ServerResponse } from "http";
import { env } from "./env";
import { logger } from "./middlewares/logger.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found-handler.js";
import { routes } from "./routes";

// 🔹 Criar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify();

// 🔹 Registrar multipart para uploads
app.register(fastifyMultipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// 🔹 Servir arquivos estáticos da pasta images
app.register(fastifyStatic, {
  root: path.join(__dirname, "images"),
  prefix: "/images/",
});

app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
        cookieName: 'refresh_token',
        signed: false,
    },
    sign: { expiresIn: '10m' },
});

app.register(fastifyCookie);

app.register(cors, {
    origin: true, // permite qualquer origem
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

app.addHook('onResponse', logger);
app.setErrorHandler(errorHandler);
app.setNotFoundHandler(notFoundHandler);
app.register(routes);

export { app };
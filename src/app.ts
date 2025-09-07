import { fastify } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { env } from "./env";
import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/error-handler";
import { notFoundHandler } from "./middlewares/not-found-handler";
import { routes } from "./routes";

const app = fastify();

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

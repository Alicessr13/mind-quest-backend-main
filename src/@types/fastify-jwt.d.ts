import "@fastify/jwt"

declare module "@fastify/jwt" {
    export interface FastifyJWT {
        user: {
            user_id: string;
            created_at: string;
            name: string;
            email: string;
        };
    };
};

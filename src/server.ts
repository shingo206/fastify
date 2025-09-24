import fastifyCors from '@fastify/cors';
import fastifyEnv, {FastifyEnvOptions} from '@fastify/env';
import Fastify, {FastifyInstance, RouteShorthandOptions} from 'fastify'
import helloRoute from './hello.js';

const server: FastifyInstance = Fastify({
    logger: true,
});

const envSchema = {
    type: 'object',
    properties: {
        NODE_ENV: {type: 'string', default: 'development'},
        PORT: {type: 'number', default: 3000},
    },
    required: ['NODE_ENV', 'PORT'],
    additionalProperties: false,
};

const options: FastifyEnvOptions = {
    confKey: 'config',
    schema: envSchema,
    data: process.env
};

// Register the plugin
server.register(fastifyEnv, options);
server.register(fastifyCors, {
    origin: true,
    methods: ['GET'],
});
server.register(helloRoute);

const opts: RouteShorthandOptions = {
    schema: {
        response: {
            200: {
                type: 'object',
                properties: {
                    pong: {
                        type: 'string'
                    }
                }
            }
        }
    }
}

server.get('/ping', opts, async (request, reply) => {
    reply.send({pong: 'it worked!'});
})

const start = async () => {
    try {
        await server.ready();
        const port = (server as any).config.PORT;
        await server.listen({port: port, host: '0.0.0.0'});
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}

start().catch((err) => {
    console.error(err)
    process.exit(1)
})

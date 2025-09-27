import fastifyCors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import fastifyMongodb from '@fastify/mongodb';
import fastifySensible from '@fastify/sensible';
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
        MONGODB_URI: {type: 'string'},
    },
    required: ['NODE_ENV', 'PORT', 'MONGODB_URI'],
    additionalProperties: false,
};

// Register the plugin
server.register(fastifyEnv, {
    dotenv: true,
    confKey: 'config',
    schema: envSchema,
});

server.register(fastifyCors, {
    origin: true,
    methods: ['GET'],
});

server.register(fastifySensible);

server.after(() => {
    server.register(fastifyMongodb, {
        forceClose: true,
        url: (server as any).config.MONGODB_URI,
    })
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

start();

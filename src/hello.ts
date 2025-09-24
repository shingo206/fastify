import {FastifyInstance, FastifyPluginOptions} from 'fastify';

const helloRouter = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    fastify.get('/hello', async (request, reply) => {
        reply.send({message: 'Hello, world!'});
    });

    fastify.get('/', async (request, reply) => {
        reply.send({message: 'Welcome to the Fastify API!'});
    });
};

export default helloRouter;

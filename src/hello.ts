import {FastifyInstance, FastifyPluginOptions} from 'fastify';

const helloRouter = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    const state = (fastify as any).mongo.connection.readyState;

    fastify.get('/hello', async (request, reply) => {
        reply.send({message: 'Hello, world!'});
    });

    fastify.get('/', async (request, reply) => {
        reply.send({message: 'Welcome to the Fastify API!'});
    });

    fastify.get('/test-db', async (request, reply) => {
        try {
            let status: string;
            switch (state) {
                case 0:
                    status = "Disconnected";
                    break;
                case 1:
                    status = "Connected";
                    break;
                case 2:
                    status = "Connecting";
                    break;
                case 3:
                    status = "Disconnecting";
                    break;
                default:
                    status = "Unknown";
            }
            reply.send({database: status});

        } catch (error) {
            fastify.log.error(error);
            reply.status(500).send({error: 'Something went wrong with connection!'});
            process.exit(1);
        }
    });
};

export default helloRouter;

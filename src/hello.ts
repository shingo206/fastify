import {FastifyInstance, FastifyPluginOptions} from 'fastify';

const helloRouter = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    fastify.get('/hello', async (request, reply) => {
        reply.send({message: 'Hello, world!'});
    });

    fastify.get('/', async (request, reply) => {
        reply.send({message: 'Welcome to the Fastify API!'});
    });

    fastify.get('/test-db', async (request, reply) => {
        try {
            // MongoDBプラグインが利用可能かチェック
            if (!(fastify as any).mongo) {
                throw fastify.httpErrors.serviceUnavailable('MongoDB connection not available' );
            }

            // データベース接続状態をチェック
            const mongoClient = (fastify as any).mongo.client;
            const isConnected = mongoClient && mongoClient.topology && mongoClient.topology.isConnected();

            let status: string;
            if (isConnected) {
                status = "Connected";
            } else {
                status = "Disconnected";
            }

            return { database: status };

        } catch (error) {
            fastify.log.error(error);
            throw fastify.httpErrors.internalServerError('Database connection check failed' );
        }
    });
};

export default helloRouter;

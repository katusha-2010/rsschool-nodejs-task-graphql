import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import { HttpError} from '@fastify/sensible/lib/httpError';
import { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return await fastify.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity|HttpError> {
      const id:string = request.params.id;
      const post:PostEntity | null = await fastify.db.posts.findOne({key:'id', equals:id});
      if(post === null) {        
        return fastify.httpErrors.notFound();
      } else {
        return post;
      } 
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity|HttpError> { 
      const body = request.body;
      const {content, title} = body;
      if(!content || !title) {
        return fastify.httpErrors.badRequest();
      } else {
        return await fastify.db.posts.create(body);
      }     
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity|HttpError> {
      const id:string = request.params.id;      
      const post:PostEntity | null = await fastify.db.posts.findOne({key:'id', equals:id});      
      if(post === null) {
        return fastify.httpErrors.badRequest();
      }
      const userId:UserEntity | null = await fastify.db.users.findOne({key:'id', equals:post!.userId});
      if(userId === null) {
        return fastify.httpErrors.notFound();
      }    
      return await fastify.db.posts.delete(id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity|HttpError> {
      const body = request.body;
      const id:string = request.params.id;
      const post:PostEntity | null = await fastify.db.posts.findOne({key:'id', equals:id});
      if(post === null) {return fastify.httpErrors.badRequest()}
      return await fastify.db.posts.change(id, Object.assign(post, body));      
    }
  );
};

export default plugin;

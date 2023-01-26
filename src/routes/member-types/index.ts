import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import { HttpError } from '@fastify/sensible/lib/httpError';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    return await fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity|HttpError> {
      const id:string = request.params.id;
      const memberType:MemberTypeEntity | null = await fastify.db.memberTypes.findOne({key:'id', equals:id});
      if(memberType === null) {        
        return fastify.httpErrors.notFound();
      } else {
        return memberType;
      } 
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity|HttpError> {
      const id:string = request.params.id;
      const body = request.body;
      const {discount, monthPostsLimit} = body; 
      if(!discount && !monthPostsLimit) {
        return await fastify.httpErrors.badRequest();
      } else {
        return await fastify.db.memberTypes.change(id, {discount, monthPostsLimit});
      }      
    }
  );
};

export default plugin;

import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { HttpError } from '@fastify/sensible/lib/httpError';
import { UserEntity } from '../../utils/DB/entities/DBUsers';
import { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    ProfileEntity[]
  > {
    return await fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity|HttpError> {
      const id:string = request.params.id;
      const profile:ProfileEntity | null = await fastify.db.profiles.findOne({key:'id', equals:id});
      if(profile === null) {        
        return fastify.httpErrors.notFound();
      } else {
        return profile;
      } 
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity|HttpError> {
      const body = request.body;
      const {userId, memberTypeId} = body;
      const usersArr:UserEntity[] = await fastify.db.users.findMany();
      const profilesArr:ProfileEntity[] = await fastify.db.profiles.findMany();
      const memberTypeArr:MemberTypeEntity[] = await fastify.db.memberTypes.findMany();
      const isUserExist:boolean = usersArr.find(el => el.id === userId)? true : false;
      const isProfileExistForUser:boolean = profilesArr.find(el => el.userId === userId)? true : false;
      const isMemberTypeExist:boolean = memberTypeArr.find(el => el.id === memberTypeId)? true : false;
      if(!isUserExist) {
        return fastify.httpErrors.badRequest();
      }
      if(isProfileExistForUser) {
        return fastify.httpErrors.badRequest();
      }
      if(!isMemberTypeExist) {
        return fastify.httpErrors.badRequest();
      }
      return await fastify.db.profiles.create(body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity|HttpError> {
      const id:string = request.params.id;
      const profile:ProfileEntity | null = await fastify.db.profiles.findOne({key:'id', equals:id});
      if(profile === null) {        
        return fastify.httpErrors.badRequest();
      }
      return await fastify.db.profiles.delete(id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity|HttpError> {
      const body = request.body;
      const id:string = request.params.id;
      const profile:ProfileEntity | null = await fastify.db.profiles.findOne({key:'id', equals:id});
      if(profile === null) {        
        return fastify.httpErrors.badRequest();
      }
      return await fastify.db.profiles.change(id, body);
    }
  );
};

export default plugin;

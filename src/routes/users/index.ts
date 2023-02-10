import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { HttpError } from '@fastify/sensible/lib/httpError';
import { PostEntity } from '../../utils/DB/entities/DBPosts';
import { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity|HttpError> {
      const id:string = request.params.id;
      const user:UserEntity | null = await fastify.db.users.findOne({key:'id', equals:id});
      if(user === null) {        
        return fastify.httpErrors.notFound();
      } else {
        return user;
      }       
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {      
      const body = request.body;      
      return await fastify.db.users.create(body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity|HttpError> {
      const id:string = request.params.id;
      const user:UserEntity | null = await fastify.db.users.findOne({key:'id', equals:id});
      if(user === null) {
        return fastify.httpErrors.badRequest();
      }      

      function getObjectWithChangedField(subscribedUser:UserEntity, userId:string):Partial<Omit<UserEntity, "id">> {        
        const userSubscribeArr:string[] = subscribedUser?.subscribedToUserIds;
        const changedUserSubscribeArr:string[] = userSubscribeArr?.filter(el => el !== userId);
        return Object.assign({}, {subscribedToUserIds:changedUserSubscribeArr})
      }

      const subscribedUsersArr:UserEntity[] = await fastify.db.users.findMany({key:'subscribedToUserIds', inArray:id});

      for(let user of subscribedUsersArr) {
        const fieldChanged:Partial<Omit<UserEntity, "id">> = getObjectWithChangedField(user, id);

        fastify.db.users.change(user.id, fieldChanged)
      }

      const postsArr: PostEntity[] = await fastify.db.posts.findMany();
      for(let post of postsArr) {
        if(post.userId === id) {
          fastify.db.posts.delete(post.id)
        }
      }

      const profilesArr:ProfileEntity[] = await fastify.db.profiles.findMany();
      for(let profile of profilesArr) {
        if(profile.userId === id) {
          fastify.db.profiles.delete(profile.id)
        }
      }

      return await fastify.db.users.delete(id);
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity|HttpError> {
      const id:string = request.params.id;
      const userId:string = request.body.userId;
      const user:UserEntity | null = await fastify.db.users.findOne({key:'id', equals: id});
      if(user === null) {return await fastify.httpErrors.notFound()}

      function getObjectWithChangedField(subscribedUser:UserEntity, userId:string):Partial<Omit<UserEntity, "id">> {        
        const userSubscribeArr:string[] = subscribedUser?.subscribedToUserIds;
        const changedUserSubscribeArr:string[] = userSubscribeArr?.filter(el => el !== userId);
        changedUserSubscribeArr.push(userId);
        return Object.assign({}, {subscribedToUserIds:changedUserSubscribeArr})
      }

      const subscribedUser:UserEntity | null = await fastify.db.users.findOne({key:'id', equals: userId});
      if(subscribedUser === null) {return await fastify.httpErrors.notFound()};

      const subscribedUserChangedField:Partial<Omit<UserEntity, "id">> = getObjectWithChangedField(subscribedUser, id);
      return await fastify.db.users.change(userId, subscribedUserChangedField);
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity|HttpError> {
      const id:string = request.params.id;
      const userId:string = request.body.userId;
      const user:UserEntity | null = await fastify.db.users.findOne({key:'id', equals: id});
      const subscribedUser:UserEntity | null = await fastify.db.users.findOne({key:'id', equals: userId});
      if(user === null || subscribedUser === null) {return await fastify.httpErrors.notFound()}
      if(subscribedUser.subscribedToUserIds.includes(id) === false) {return await fastify.httpErrors.badRequest()}

      function getObjectWithChangedField(subscribedUser:UserEntity, userId:string):Partial<Omit<UserEntity, "id">> {        
        const userSubscribeArr:string[] = subscribedUser?.subscribedToUserIds;
        const changedUserSubscribeArr:string[] = userSubscribeArr?.filter(el => el !== userId);
        return Object.assign({}, {subscribedToUserIds:changedUserSubscribeArr})
      }    

      const subscribedUserChangedField:Partial<Omit<UserEntity, "id">> = getObjectWithChangedField(subscribedUser, id);
      return await fastify.db.users.change(userId, subscribedUserChangedField);  
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity|HttpError> {
      const body = request.body;
      const id:string = request.params.id;
      const user:UserEntity | null = await fastify.db.users.findOne({key:'id', equals: id});      
      if(user === null) {
        return await fastify.httpErrors.badRequest();
      }      
      return await fastify.db.users.change(id, body);
    }
  );
};

export default plugin;

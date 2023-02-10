import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
import { graphql, buildSchema} from 'graphql';
import { PostEntity } from '../../utils/DB/entities/DBPosts';
import { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
      },
    },
    async function (request, reply) {
      const source = request.body.query! as string;

      const schema = buildSchema(`
      type UserEntity {
        id: String
        firstName: String
        lastName: String
        email: String
        subscribedToUserIds: [String]
      }

      type ProfileEntity {
        id: String!
        avatar: String
        sex: String
        birthday: Int
        country: String
        street: String
        city: String
        memberTypeId: String
        userId: String
      }

      type PostEntity {
        id: String!
        title: String
        content: String
        userId: String
      }

      type MemberTypeEntity {
        id: String!
        discount: Int
        monthPostsLimit: Int
      }

      type UserAllFields {
        id: String
        firstName: String
        lastName: String
        email: String
        subscribedToUserIds: [String]
        post: [PostEntity]
        profile: ProfileEntity
        memberType: MemberTypeEntity
      }

      type UserProfileSubscribers {
        id: String
        firstName: String
        lastName: String
        email: String
        subscribedToUserIds: [String]
        post: [PostEntity]
        profile: ProfileEntity
        memberType: MemberTypeEntity
      }

      type UsersSubscribedTo {
        id: String
        firstName: String
        lastName: String
        email: String
        subscribedToUserIds: [String]
        usersSubscribedTo: [UserEntity]
      }

      type SubscribedToUser {
        id: String
        subscribedToUser: [String]
        usersSubscribedTo: [UserEntity]
      }

      type usersWithAllSubscribedAndSubsctibers {
        id: String
        firstName: String
        lastName: String
        email: String
        subscribedToUserIds: [SubscribedToUser]
        usersSubscribedTo: [UsersSubscribedTo]
      }

       type Query {
       users: [UserEntity]
       user(id: String!): UserEntity
       posts: [PostEntity]
       post(id: String!): PostEntity
       profiles: [ProfileEntity]
       profile(id: String!): ProfileEntity
       memberTypes: [MemberTypeEntity]
       memberType(id: String!): MemberTypeEntity
       usersAllFields: [UserAllFields]
       userAllFieldsByID(id: String!): UserAllFields
       usersWithUserSubscribedTo: [UserProfileSubscribers]
       userWithUserSubscribedToByID(id: String!): UserProfileSubscribers
       usersWithAllSubscribedAndSubsctibers: [usersWithAllSubscribedAndSubsctibers]
       }

       input newUser {
        firstName: String!
        lastName: String!
        email: String!
       }

      input newProfile {
        id: String!
        avatar: String
        sex: String
        birthday: Int
        country: String
        street: String
        city: String
        memberTypeId: String
        userId: String
       }

      input newPost {
        id: String!
        title: String
        content: String
        userId: String
       }

       type Mutation {
        createNewUser(input: newUser!): UserEntity
        createNewProfile(input: newProfile!): ProfileEntity
        createNewPost(input: newPost!): PostEntity
       }
      `);

      const rootValue = {
        users: async() => {              
          return await fastify.db.users.findMany()
        },
        user: async(id:string) => { 
          const user =  await fastify.db.users.findOne({key:'id', equals: id});
          if(user === null) {return fastify.httpErrors.notFound()} 
          return user
        },
        posts: async() => {    
          return await fastify.db.posts.findMany()
        },
        post: async(id:string) => {
          const post = await fastify.db.posts.findOne({key:'id', equals: id});
          if(post === null) {return await fastify.httpErrors.notFound()}   
          return post
        },
        profiles: async() => {    
          return await fastify.db.profiles.findMany()
        },
        profile: async(id:string) => { 
          const profile =  await fastify.db.profiles.findOne({key:'id', equals: id});
          if(profile === null) {return await fastify.httpErrors.notFound()}
          return profile
        },
        memberTypes: async() => {    
          return await fastify.db.memberTypes.findMany()
        },
        memberType: async(id:string) => {
          const memberType = await fastify.db.memberTypes.findOne({key:'id', equals: id});
          if(memberType === null) {return await fastify.httpErrors.notFound()}    
          return memberType
        },

        usersAllFields: async() => {
          const users:UserEntity[] = await fastify.db.users.findMany();
          const resultArr = users.map(async(user) => {
            const {id} = user;
            const post:PostEntity = await fastify.db.posts.findOne({key:"userId", equals:id}) as PostEntity ;
            const profile:ProfileEntity = await fastify.db.profiles.findOne({key:"userId", equals:id}) as ProfileEntity;
            const memberType:MemberTypeEntity = await fastify.db.memberTypes.findOne({key:"id", equals:profile?.memberTypeId!}) as MemberTypeEntity;
            return profile? Object.assign(user, {post, profile, memberType}) : Object.assign(user, {post})
          })
          return await resultArr;
        },

        userAllFieldsByID: async(id:string) => {
          const user:UserEntity = await fastify.db.users.findOne({key:"id", equals:id}) as UserEntity;
          const post:PostEntity = await fastify.db.posts.findOne({key:"userId", equals:id}) as PostEntity ;
          const profile:ProfileEntity = await fastify.db.profiles.findOne({key:"userId", equals:id}) as ProfileEntity;
          const memberType:MemberTypeEntity = await fastify.db.memberTypes.findOne({key:"id", equals:profile?.memberTypeId!}) as MemberTypeEntity;
          return profile? Object.assign(user, {post, profile, memberType}) : Object.assign(user, {post})
        },

        usersWithUserSubscribedTo: async() => {
          const users:UserEntity[] = await fastify.db.users.findMany();
          const resultArr = users.map(async(user) => {
            const usersSubscribedTo:UserEntity[] = await fastify.db.users.findMany({key:"subscribedToUserIds", inArray:user.id});
            const profile:ProfileEntity = await fastify.db.profiles.findOne({key:"userId", equals:user.id}) as ProfileEntity;
            return profile? Object.assign(user, {profile,usersSubscribedTo}) : Object.assign(user, {usersSubscribedTo})
          })
          return resultArr;
        },

        userWithUserSubscribedToByID: async(id:string) => {
          const user:UserEntity = await fastify.db.users.findOne({key:"id", equals:id}) as UserEntity;
          const usersSubscribedTo:UserEntity[] = await fastify.db.users.findMany({key:"subscribedToUserIds", inArray:id});
          const profile:ProfileEntity = await fastify.db.profiles.findOne({key:"userId", equals:id}) as ProfileEntity;
          return profile? Object.assign(user, {profile,usersSubscribedTo}) : Object.assign(user, {usersSubscribedTo})
        },

        usersWithAllSubscribedAndSubsctibers: async(id:string) => {
          const users:UserEntity[] = await fastify.db.users.findMany();
          const resultArr = users.map(async(user) => {
            const usersSubscribedTo1:UserEntity[] = await fastify.db.users.findMany({key:"subscribedToUserIds", inArray:user.id});
            const subscribedToUser1:string[] = user.subscribedToUserIds;
            const subscribedToUserWide = subscribedToUser1.map(async(el) => {
              const user = await fastify.db.users.findOne({key:"id", equals:el});
              const usersSubscribedTo:UserEntity[] = await fastify.db.users.findMany({key:"subscribedToUserIds", inArray:el});
              return {id:el, subscribedToUser: user?.subscribedToUserIds, usersSubscribedTo}
            })
            const usersSubscribedToWide = usersSubscribedTo1.map(async(user) => {
              const usersSubscribedTo:UserEntity[] = await fastify.db.users.findMany({key:"subscribedToUserIds", inArray:user.id});
              return Object.assign(user, {usersSubscribedTo})
            })
            
            return Object.assign(user, {subscribedToUser:subscribedToUserWide,usersSubscribedTo:usersSubscribedToWide})
          })
          return resultArr;
        },

        createNewUser: async({input}:any) => {
          return await fastify.db.users.create(input);
        },

        createNewProfile: async({input}:any) => {
          const {userId, memberTypeId} = input;
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
          return await fastify.db.profiles.create(input);
        },

        createNewPost: async({input}:any) => {
          const {content, title} = input;
          if(!content || !title) {
            return fastify.httpErrors.badRequest();
          } else {
            return await fastify.db.posts.create(input);
          }
        },
      };
    
      return await graphql({schema, source, rootValue});      
    }
  ); 
};

export default plugin;
// mutation{
// createNewUser (input: {
//     firstName:"Vasia",
//     lastName:"Pupkin",
//     email:"p@mail.ru"
// }){
//     id
//     firstName
//     lastName
//     email
// }
// }

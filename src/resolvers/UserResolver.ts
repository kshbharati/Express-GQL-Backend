import "reflect-metadata";
import { PublicUser} from "@root/schema/User";
import { Arg, Ctx, Field, InputType, Mutation,Query, Resolver } from "type-graphql";
import { AppContext } from "@root/context";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import UserResponse from '@root/APIResponse'
import { hashPass, comparePass } from "@root/PassMgmt";
import { getLoggedUser } from "@root/SessionMgmt";
import { decodeToken, generateToken } from "@root/TokenMgmt";
import { User } from "@prisma/client";
import { IsEmail } from "class-validator";
import { ErrorCode, GQLError, ServerError } from "@root/ErrorHelpers";
import { GraphQLError } from "graphql";

@InputType()
class UserCreateInput {
    @Field()
    @IsEmail()
    email: string;

    @Field()
    password: string;
}

@InputType()
class UserLoginInput {
    @Field()
    @IsEmail()
    email: string;

    @Field()
    password: string;
}

@InputType()
class UserUpdateEmail {
    @Field({ nullable: true })
    @IsEmail()
    newEmail: string;
}

@InputType()
class UserUpdatePassword{
    @Field()
    oldPassword:string;

    @Field()
    newPassword:string;
}
// @ObjectType()
// class UserOutputResponse {
//     @Field()
//     id: string;

//     @Field()
//     email: string;
// }





Resolver(PublicUser);
export class UserResolver {
    @Mutation((type) => UserResponse)
    async signupUser(
        @Arg("data") data: UserCreateInput,
        @Ctx() ctx: AppContext
    ): Promise<UserResponse> {
        try {
            const user = await ctx.prisma.user.create({
                data: {
                    email: data.email,
                    password: await hashPass(data.password),
                },
            });

            if (!user) throw GQLError(ServerError.INTERNAL_SERVER_ERROR,"Database");
            return {
                status: "200",
                message: "User created with email " + user.email,
            };
            
        } catch (e: any) {
            if (e instanceof PrismaClientKnownRequestError) {
                if (e.code === "P2002") throw GQLError(ServerError.DUPLICATE_ENTRY,"user");
            }
            throw new GraphQLError(e.response?.data?.message)
        }
    }

    @Mutation((type) =>UserResponse)
    async updateEmail(
        @Arg("data") data:UserUpdateEmail,
        @Ctx() ctx:AppContext
    ): Promise<UserResponse>
    {
        let sessionResponse = await getLoggedUser(ctx);
        if (sessionResponse instanceof GraphQLError) throw sessionResponse;

        const loggedUser = sessionResponse as User;

        if (!loggedUser)
            throw GQLError(ServerError.NOT_LOGGED_IN);
        
        if(loggedUser.email===data.newEmail) throw GQLError(ServerError.BAD_USER_INPUT,"email");

        try{
            const user = await ctx.prisma.user.update({
                where: {
                    email: loggedUser.email,
                },
                data: {
                    email: data.newEmail,
                },
                select: {
                    id: true,
                    email: true,
                },
            });
            if (!user) throw GQLError(ServerError.INTERNAL_SERVER_ERROR);

            await ctx.redis.del(loggedUser.email);

            const token = await generateToken({
                id: user.id,
                email: user.email,
            });

            await ctx.redis.set(user.email, token); //Set user email and token pkey-pair on redis

            return {
                status: "200",
                message: "Successfully updated the email to: " + user.email,
                token:token
            };
        }catch(err:any){
            throw new GraphQLError(err.response?.data?.message)
        }


    }


    @Mutation((type)=>UserResponse)
    async updatePassword(
        @Arg("data") data:UserUpdatePassword,
        @Ctx() ctx:AppContext
    ):Promise<UserResponse>{
        let sessionResponse = await getLoggedUser(ctx);
        if (sessionResponse instanceof GraphQLError) throw sessionResponse;

        const loggedUser = sessionResponse as User;

        if (!loggedUser)
            throw GQLError(ServerError.NOT_LOGGED_IN);
        
            try{
                if(await !comparePass(loggedUser.password, data.oldPassword)) throw GQLError(ServerError.BAD_USER_INPUT, "password");

                const updatedUser = await ctx.prisma.user.update({
                    where:{
                        email:loggedUser.email
                    },
                    data:{
                        password:await hashPass(data.newPassword)
                    },
                    select:{
                        email:true
                    }
                })

                return {
                    status: "200",
                    message: 'Password changed successfully',
                };
            }catch(err:any){
                throw new GraphQLError(err.response?.data?.message);
            }
    }
    

    @Mutation((type) => UserResponse)
    async Login(
        @Arg("data") data: UserLoginInput,
        @Ctx() ctx: AppContext
    ): Promise<UserResponse> {
        const loggedUser = await getLoggedUser(ctx);
        if (loggedUser instanceof GraphQLError) throw loggedUser;

        if (loggedUser)
            throw GQLError(ServerError.LOGGED_IN);
        
        const user = await ctx.prisma.user.findUnique({
            where: {
                email: data.email,
            },
        });

        if (!user) throw GQLError(ServerError.BAD_USER_INPUT,'email');

        if (await !comparePass(data.password, user.password))
            throw GQLError(ServerError.BAD_USER_INPUT, "password");

        const token = await generateToken({
            id: user.id,
            email: user.email,
        });

        await ctx.redis.set(user.email, token); //Set user email and token pkey-pair on redis

        return {
            status: "200",
            message: "Login SuccessFull",
            token: token,
        };
    }

    @Mutation((type) => UserResponse)
    async LogOut(@Ctx() ctx: AppContext): Promise<UserResponse> {
        if(!ctx.token) throw GQLError(ServerError.NOT_FOUND,"token");

        const token:User = await decodeToken(ctx.token as string) as User;

        await ctx.redis.del(token.email);
        return {
            status:'200',
            message:'Logout Successfull'
        }
    }

    @Query(() => UserResponse)
    async allUsers(@Ctx() ctx: AppContext): Promise<UserResponse> {
        const loggedUser = await getLoggedUser(ctx);
        if(loggedUser instanceof GraphQLError) throw loggedUser;

        if (!loggedUser) throw GQLError(ServerError.NOT_LOGGED_IN);
        
        return {
            status: "200",
            data: await ctx.prisma.user.findMany(),
        };
    }
}




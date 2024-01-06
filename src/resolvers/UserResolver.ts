import "reflect-metadata";
import { PrivateUser, PublicUser} from "@root/schema/User";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { AppContext } from "@root/context";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { GraphQLError } from "graphql";
import { ErrorCode } from "@root/ErrorCodes";
import UserResponse from '@root/APIResponse'
import { IsTokenValid, comparePass, generateToken, getLoggedUser, hashPass } from "@root/helpers";

@InputType()
class UserCreateInput {
    @Field()
    email: string;

    @Field()
    password: string;
}

@InputType()
class UserLoginInput {
    @Field()
    email: string;

    @Field()
    password: string;
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

            if (!user) throw new Error('Server Encountered UnExpected Problem. Please Try Again')

            return {
                status: "200",
                message: "User created with email " + user.email,
            };
            
        } catch (e: any) {
            if (e instanceof PrismaClientKnownRequestError) {
                if (e.code === "P2002") {
                    throw new GraphQLError("Value is already being used.", {
                        extensions: {
                            code: ErrorCode.DUPLICATE_ENTRY,
                            argumentName: "email",
                        },
                    });
                }
            }
            throw e;
        }
    }

    @Mutation((type) => UserResponse)
    async Login(
        @Arg("data") data: UserLoginInput,
        @Ctx() ctx: AppContext
    ): Promise<UserResponse> {
        /* Deletes the old token if there are any*/
        if (ctx.token) {
            ctx.redis.del(ctx.token);
        }

        const user = await ctx.prisma.user.findUnique({
            where: {
                email: data.email,
            },
        });

        if (!user) throw new Error("One or more Fields Do not match");

        if (await !comparePass(data.password, user.password))
            throw new Error("One or more Fields Do not match");

        const token = await generateToken({
            id: user.id,
            email: user.email,
        });

        await ctx.redis.set(token, user.id);

        return {
            status: "200",
            message: "Login SuccessFull",
            token: token,
        };
    }

    @Mutation((type) => UserResponse)
    async LogOut(@Ctx() ctx: AppContext): Promise<UserResponse> {
        await ctx.redis.del(ctx.token as string);
        return {
            status:'200',
            message:'Logout Successfull'
        }
    }

    @Query(() => UserResponse)
    async allUsers(@Ctx() ctx: AppContext): Promise<UserResponse> {
        const loggedUser = await getLoggedUser(ctx);

        if (!loggedUser)
            throw new Error(
                "Either you haven't logged in or the authentication has Expired. Please login to continue"
            );
        return {
            status: "200",
            data: await ctx.prisma.user.findMany(),
        };
    }
}




import "reflect-metadata";
import { PrivateUser, PublicUser} from "@root/schema/User";
import { Arg, Ctx, Field, InputType, Mutation,Query, Resolver } from "type-graphql";
import { AppContext } from "@root/context";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { GraphQLError, GraphQLErrorExtensions } from "graphql";
import UserResponse from '@root/APIResponse'
import { hashPass, comparePass } from "@root/PassMgmt";
import { getLoggedUser } from "@root/SessionMgmt";
import { decodeToken, generateToken } from "@root/TokenMgmt";
import { User } from "@prisma/client";
import { IsEmail } from "class-validator";
import { ErrorCode, GQLError, GQLErrorOptions } from "@root/ErrorHelpers";

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

            if (!user) throw GQLError('Server Encountered UnExpected Problem. Please Try Again',ErrorCode.INTERNAL_SERVER_ERROR);

            return {
                status: "200",
                message: "User created with email " + user.email,
            };
            
        } catch (e: any) {
            if (e instanceof PrismaClientKnownRequestError) {
                if (e.code === "P2002") throw GQLError("Value is already being used.", ErrorCode.DUPLICATE_ENTRY,'email');
            }
            throw GQLError(e.response?.data?.message)
        }
    }

    //TODO Update this function and User field to include change to be depending on User Type
    @Mutation((type) =>UserResponse)
    async updateEmail(
        @Arg("data") data:UserUpdateEmail,
        @Ctx() ctx:AppContext
    ): Promise<UserResponse>
    {
        const loggedUser:User = await getLoggedUser(ctx) as User;

        if (!loggedUser)
            throw GQLError("Either you haven't logged in or the authentication has Expired. Please login to continue",ErrorCode.FORBIDDEN,"token");
        
        if(loggedUser.email===data.newEmail) throw GQLError("Same Email Provided.",ErrorCode.DUPLICATE_ENTRY);

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
            if (!user) throw GQLError("User doesn't exist",ErrorCode.NOT_FOUND,'email')

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
            throw GQLError(err.response?.data?.message)
        }


    }


    @Mutation((type)=>UserResponse)
    async updatePassword(
        @Arg("data") data:UserUpdatePassword,
        @Ctx() ctx:AppContext
    ):Promise<UserResponse>{
        const loggedUser: User = (await getLoggedUser(ctx)) as User;

        if (!loggedUser)
            throw GQLError(
                "Either you haven't logged in or the authentication has Expired. Please login to continue",
                ErrorCode.FORBIDDEN,
                "token"
            );
        
            try{
                if(await !comparePass(loggedUser.password, data.oldPassword)) throw GQLError("Old Password Doesn't match", ErrorCode.BAD_USER_INPUT,'old_password');

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
                throw GQLError(err.response?.data?.message);
            }
    }

    @Mutation((type) => UserResponse)
    async Login(
        @Arg("data") data: UserLoginInput,
        @Ctx() ctx: AppContext
    ): Promise<UserResponse> {
        /* Deletes the old token if there are any*/

        const loggedUser:User = await getLoggedUser(ctx) as User;
        
        if(loggedUser) throw GQLError("User Already Logged In. Logout to login to another account",ErrorCode.ALREADY_LOGGED_IN);

        const user = await ctx.prisma.user.findUnique({
            where: {
                email: data.email,
            },
        });

        if (!user) throw GQLError("One or more Fields Do not match",ErrorCode.BAD_USER_INPUT,'email or password');

        if (await !comparePass(data.password, user.password))
            throw GQLError("One or more Fields Do not match",ErrorCode.BAD_USER_INPUT,"email or password");

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
        if(!ctx.token) throw GQLError("User Token not provided.");

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

        if (!loggedUser)
            throw GQLError(
                "Either you haven't logged in or the authentication has Expired. Please login to continue",ErrorCode.FORBIDDEN
            );

        return {
            status: "200",
            data: await ctx.prisma.user.findMany(),
        };
    }
}




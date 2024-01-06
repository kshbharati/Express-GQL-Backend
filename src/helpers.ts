import { User } from "@prisma/client";
import { AppContext } from "./context";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { decode } from "punycode";

export async function getLoggedUser(ctx: AppContext): Promise<User | null> {
    if (!ctx.token) return null;
 
    if(!IsTokenValid(ctx.token)) return null;

    const userId = await ctx.redis.get(ctx.token);

    if (!userId || userId === null) return null;

    const user = ctx.prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!user) return null;

    return user;
}

/*
Token is in format Bearer asdnijqabndfuinbnasdf.
Take only the second part of the token 
*/
export function getToken(token: string) {
    return token.split(" ")[1];
}


export async function hashPass(pass: string) {
    const saltRounds = 10;
    const salt = await bcrypt.genSaltSync(saltRounds);
    const hash = await bcrypt.hashSync(pass, salt);
    return hash;
}

export async function comparePass(pass: string, hashedPass: string) {
    return await bcrypt.compareSync(pass, hashedPass);
}

export async function generateToken(data: any) {
    const token = await jwt.sign(data, process.env.JWT_SECRET_KEY as string, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
    return token;
}

export async function IsTokenValid(token:string)
{
    try {
        const decoded = await jwt.verify(
            token,
            process.env.JWT_SECRET_KEY as string
        );
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }

   
}
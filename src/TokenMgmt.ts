import * as jwt from "jsonwebtoken";


export async function generateToken(data: any) {
    const token = await jwt.sign(data, process.env.JWT_SECRET_KEY as string, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
    return token;
}

//Add a current TimeStamp so we can create an automated task to delete Redis Keys on their Expiry. Expiry Set on .env file.
export function formatTokenForRedis(token:string){
    return Date.now()+":"+token;
}

//Returns just the token from after formatting the timestamp at the front
export function formatTokenFromRedis(token:string)
{
    return token.split(":")[1];
}

export async function decodeToken(token:string)
{
    try {
        const decoded = await jwt.verify(
            token,
            process.env.JWT_SECRET_KEY as string
        );
        return decoded;
    } catch (error) {
        return null;
    }
}

/*
Token is in format Bearer asdnijqabndfuinbnasdf.
Take only the second part of the token 
*/
export function formatToken(token: string) {
    return token.split(" ")[1];
}

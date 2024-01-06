import { IsEmail } from "class-validator";
import "reflect-metadata";
import { Field, ID, ObjectType } from "type-graphql";
import BaseSchema from "./BaseSchema";

@ObjectType({implements: BaseSchema})
export class PublicUser {

    @Field()
    @IsEmail()
    email: string;
}

@ObjectType()
export class PrivateUser extends PublicUser {
    @Field()
    password: string;
}

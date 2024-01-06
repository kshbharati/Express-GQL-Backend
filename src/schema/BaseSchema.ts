import { Field, ID, InterfaceType } from "type-graphql";

@InterfaceType()
export default abstract class BaseSchema {
    @Field((type) => ID)
    id: string;

    @Field()
    createdAt?: Date;

    @Field()
    updatedAt?: Date;
}
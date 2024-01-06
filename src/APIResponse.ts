import { User } from "@prisma/client";
import { ObjectType, Field } from "type-graphql";
import { PrivateUser, PublicUser} from "@root/schema/User";

@ObjectType()
export default class APIResponse {
    @Field()
    status: string;

    @Field({nullable:true})
    message?: string;

    @Field({nullable:true})
    token?: string;

    @Field((type) => [PublicUser],{ nullable: true })
    data?: User[];
}

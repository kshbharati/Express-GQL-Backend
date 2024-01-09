// For clarity in this example we included our typeDefs and resolvers above our test,

// but in a real world situation you'd be importing these in from different files
import { ApolloServer, GraphQLResponse } from "@apollo/server";
import {UserResolver} from '@root/resolvers/UserResolver';

import { buildSchema } from "type-graphql";

import { prismaContext, AppContext, redisContext } from "@root/context";
import {expect, jest , test, afterAll} from '@jest/globals'

import { GraphQLScalarType} from "graphql";
import { DateTimeResolver } from "graphql-scalars";

afterAll(() => {redisContext.disconnect; redisContext.quit();});

test("Get All Users", async () => {
    const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFiY2JjMTQyLTc1ZWMtNDg0Yy04NzY3LTY5MzY0Y2Q0YTg2NiIsImVtYWlsIjoia3NoQGhvdG1haWwuY29tIiwiaWF0IjoxNzA0NzA0MDcyLCJleHAiOjE3MDQ3OTA0NzJ9.y-U9R3kLrjrTjg6YYwGIL8h4Enr8wvNWlzejfPNtKsI";
    const schema = await buildSchema({
        resolvers: [UserResolver],
        scalarsMap: [{ type: GraphQLScalarType, scalar: DateTimeResolver }],
        validate: { forbidUnknownValues: false },
    });

    const testServer = new ApolloServer<AppContext>({
        schema,
    });

    const response = await testServer.executeOperation(
        {
            query: `
                mutation LogIn{
                Login(data: {
                    email:"kshitizxox@gmail.com",
                    password:"HelloWorld"
                }){
                    status,
                    message,
                    token
                }
                }`,

            // variables: { name: "world" },
        },
        {
            contextValue: {
                prisma: prismaContext,
                redis: redisContext,
            },
        }
    ) as GraphQLResponse;


    // console.table(response);
    // Note the use of Node's assert rather than Jest's expect; if using

    // TypeScript, `assert`` will appropriately narrow the type of `body`

    // and `expect` will not.
    
    if(response.body.kind === "single")
    {
        const error =  response.body.singleResult.errors;
        const data = response.body.singleResult.data;

        if(error) 
        {
            console.log(error[0]?.extensions?.code);
            await expect(error[0]?.extensions?.code).toMatch("NOT_FOUND");
            await expect(error[0]?.extensions?.argumentName).toMatch("token");
        }
    }


});

import "reflect-metadata";

import * as dotenv from "dotenv";
dotenv.config();

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import {expressMiddleware} from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";




import express from 'express'
import http from "http";

import multer from 'multer';

import cors from "cors";

import { GraphQLScalarType } from "graphql";
import { DateTimeResolver } from "graphql-scalars";


import { buildSchema} from "type-graphql";

import { UserResolver } from "@root/resolvers/UserResolver";

import bodyParser from "body-parser";

import { prismaContext, AppContext, redisContext} from "./context";
import {formatToken } from "./TokenMgmt";

// The ApolloServer constructor requires two parameters: your schema

// definition and your set of resolvers.

//Register any enums
// registerEnumType(SortOrder, {
//     name: "SortOrder",
// });


const GRAPHQL_PATH = "/api";
const UPLOAD_PATH="/upload";


async function app(){
    //Express
    const api = express();
    api.use(cors());

    const httpServer = http.createServer(api);

    const schema = await buildSchema({
        resolvers: [UserResolver],
        scalarsMap: [{ type: GraphQLScalarType, scalar: DateTimeResolver }],
        validate: { forbidUnknownValues: false },
    });

    //Bootstap Schema to ApolloServer
    const server = new ApolloServer<AppContext>({
        schema,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            // ApolloServerPluginLandingPageDisabled(), //Uncomment to Disable Sandbox
        ],
    });

    await server.start(); //Start Graphql server with express

    api.use(
        GRAPHQL_PATH,
        cors(),
        express.json(),
        expressMiddleware(server, {
            context: async (req): Promise<AppContext> => {
                let token = req.req.headers?.authorization;

                if (token) token = formatToken(token); //formats token data

                return {
                    prisma: prismaContext,
                    redis: await redisContext,
                    token: token,
                };
            },
        })
    );

    /*
     * Other Endpoints for File Uploads
     *
     */
    //TODO Use Router and move the endpoints to seperate file
    //Multer Config
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "./tmp/uploads/");
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + "-" + file.originalname);
        },
    });

    const upload = multer({ storage });

    api.use(bodyParser.json());

    api.post(UPLOAD_PATH, cors(), upload.single("file"), (req, res) => {
        if (req.file == undefined) {
            res.status(300).json({ error: "Image Upload Failed" });
            return;
        }

        console.log(req.file);
        if (!req.file) {
            res.status(400).json({ error: "No File Uploaded" });
            return;
        }

        res.json({
            message: "File Uploaded Successfully",
            filename: req.file?.filename,
        });
    });


    await new Promise<void>((resolve) =>
        httpServer.listen({ port: 4000 }, resolve)
    );

    console.log(`🚀 Server ready at http://localhost:4000/api`);
}

app()



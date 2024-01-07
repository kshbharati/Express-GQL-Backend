import { GraphQLError, GraphQLErrorExtensions } from "graphql/error/GraphQLError";

export enum ErrorCode {
    DUPLICATE_ENTRY="DUPLICATE_ENTRY",
    INTERNAL_SERVER_ERROR="INTERNAL_SERVER_ERROR",
    NOT_FOUND="NOT_FOUND",
    BAD_USER_INPUT="BAD_USER_INPUT",
    FORBIDDEN="FORBIDDEN",
    ALREADY_LOGGED_IN="ALREADY_LOGGED_IN"
}

export const GQLErrorOptions = (
    code?: string,
    argumentName?: string
): GraphQLErrorExtensions => (
        {
            extensions: { code: code, argumentName: argumentName},
        }
    );

export const GQLError = (message:string, code?:string, argumentName?:string):GraphQLError => {
    return new GraphQLError(message, GQLErrorOptions(code, argumentName));
}
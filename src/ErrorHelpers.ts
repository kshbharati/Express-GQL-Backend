import { GraphQLError, GraphQLErrorExtensions } from "graphql/error/GraphQLError";

export type ServerErrorOptions = {message:string, status?:string};

const ErrorFormat = (message:string, status?:string):ServerErrorOptions => ({message:message, status:status});

export enum ErrorCode {
    DUPLICATE_ENTRY="DUPLICATE_ENTRY",
    INTERNAL_SERVER_ERROR="INTERNAL_SERVER_ERROR",
    NOT_FOUND="NOT_FOUND",
    BAD_USER_INPUT="BAD_USER_INPUT",
    FORBIDDEN="FORBIDDEN",
    ALREADY_LOGGED_IN="ALREADY_LOGGED_IN",
    INVALID="INVALID"
}

export const ServerError = {
    DUPLICATE_ENTRY: ErrorFormat("Provided entry already exists. Please ensure unique fields are changed",ErrorCode.DUPLICATE_ENTRY),
    INTERNAL_SERVER_ERROR: ErrorFormat("Server encountered unexpected Error",ErrorCode.INTERNAL_SERVER_ERROR),
    NOT_FOUND: ErrorFormat("Query not found",ErrorCode.NOT_FOUND),
    BAD_USER_INPUT: ErrorFormat("Provided input is not valid or does not match.", ErrorCode.BAD_USER_INPUT),
    FORBIDDEN: ErrorFormat("Not Allowed",ErrorCode.FORBIDDEN),
    LOGGED_IN: ErrorFormat("User is already logged.",ErrorCode.ALREADY_LOGGED_IN),
    NOT_LOGGED_IN: ErrorFormat("Either you haven't logged in or the authentication has Expired. Please login to continue", ErrorCode.FORBIDDEN),
    TOKEN_INVALID: ErrorFormat("Token Invalid or Expired", ErrorCode.INVALID),
    
}

export const GQLErrorOptions = (
    code?: string,
    argumentName?: string
): GraphQLErrorExtensions => (
        {
            extensions: { code: code, argumentName: argumentName},
        }
    );

export const GQLError = (error: ServerErrorOptions,  argumentName?:string):GraphQLError => {
    return new GraphQLError(error.message, GQLErrorOptions(error.status, argumentName));
}

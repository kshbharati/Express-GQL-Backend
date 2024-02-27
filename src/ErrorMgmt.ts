import { GraphQLError, GraphQLErrorExtensions } from "graphql/error/GraphQLError";

type ErrorCodeOptions = {code?:string, message?:string} 

export type ServerErrorOptions = {
    errorCode:ErrorCodeOptions,
    field?: string;
};

export const GQLErrorCodeFormat = (code: string, message?: string): ErrorCodeOptions => ({
    code: code,
    message: message,
});

export enum GenericErrorCodes {
    DUPLICATE_ENTRY="DUPLICATE_ENTRY",
    INTERNAL_SERVER_ERROR="INTERNAL_SERVER_ERROR",
    NOT_FOUND="NOT_FOUND",
    BAD_USER_INPUT="BAD_USER_INPUT",
    FORBIDDEN="FORBIDDEN",
    ALREADY_LOGGED_IN="ALREADY_LOGGED_IN",
    INVALID="INVALID"
}

export const GQLErrorCodes = {
    DUPLICATE_ENTRY: GQLErrorCodeFormat("Provided entry already exists. Please ensure unique fields are changed",GenericErrorCodes.DUPLICATE_ENTRY),
    INTERNAL_SERVER_ERROR: GQLErrorCodeFormat("Server encountered unexpected Error",GenericErrorCodes.INTERNAL_SERVER_ERROR),
    NOT_FOUND: GQLErrorCodeFormat("Query not found",GenericErrorCodes.NOT_FOUND),
    BAD_USER_INPUT: GQLErrorCodeFormat("Provided input is not valid or does not match.", GenericErrorCodes.BAD_USER_INPUT),
    FORBIDDEN: GQLErrorCodeFormat("Not Allowed",GenericErrorCodes.FORBIDDEN),
    LOGGED_IN: GQLErrorCodeFormat("User is already logged.",GenericErrorCodes.ALREADY_LOGGED_IN),
    NOT_LOGGED_IN: GQLErrorCodeFormat("Either you haven't logged in or the authentication has Expired. Please login to continue", GenericErrorCodes.FORBIDDEN),
    TOKEN_INVALID: GQLErrorCodeFormat("Token Invalid or Expired", GenericErrorCodes.INVALID),
    
}

export const GQLError = (errorCode: ErrorCodeOptions,  argumentName?:string):ServerErrorOptions => {
    return {errorCode: errorCode, field:argumentName}
}

// Discord API base. Forced to be version 10.
// https://discord.com/developers/docs/reference#api-versioning
export const APIBase = 'https://discord.com/api/v10'

// Discord API error response.
// https://discord.com/developers/docs/reference#error-messages
export interface ErrorMessage {
    code: number,
    errors: any,
    message: string
}

export function logErrorMessage(methodName: string, msg: ErrorMessage) {
    console.error(`${methodName} failed with code ${msg.code}: ${msg.message}`)
    console.error('Inner contents', msg.errors)
}
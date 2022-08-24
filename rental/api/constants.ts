// Discord API base. Forced to be version 10.

import { tserror } from "../../util/tslog.ts"

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
    tserror(`${methodName} failed with code ${msg.code}: ${msg.message}`)
    tserror(`Inner contents, ${JSON.stringify(msg, null, 4)}`)
}
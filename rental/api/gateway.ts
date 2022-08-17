import { APIBase, ErrorMessage, logErrorMessage } from './constants.ts'

// Gateway response
// https://discord.com/developers/docs/topics/gateway#get-gateway-bot-json-response
interface GatewayBotResponse {
    url: string,
    shards: number,
    session_start_limit: {
        total: number,
        remaining: number,
        reset_after: number,    // In milliseconds
        max_concurrency: number // Number of identify requests per 5 seconds
    }
}

// Gets the WebSocket gateway for our bot
export async function getGatewayBot(token: string): 
    Promise<GatewayBotResponse | null>
{
    let json: any
    try {
        json = await (await fetch(`${APIBase}/gateway/bot`, {
            headers: {
                'Authorization': `Bot ${token}`
            }
        })).json()
    } catch(error) {
        return null
    }

    if(json['code']) {
        logErrorMessage('Get Gateway', json as ErrorMessage)
        return null
    }
    else
        return json as GatewayBotResponse
}
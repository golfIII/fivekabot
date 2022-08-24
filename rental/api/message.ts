// All message related API functions go here

import { APIBase, ErrorMessage, logErrorMessage } from './constants.ts'
import { Embed, Message, MessageReference } from '../types/message.ts'
import { MessageComponent } from '../types/interaction.ts'
import { tserror } from '../../util/tslog.ts'

// Converts a Message to a MessageReference
export function toMessageReference(msg: Message) {
    return {
        message_id: msg.id,
        channel_id: msg.channel_id,
    } as MessageReference
}

// Sends a message to a channel.
// https://discord.com/developers/docs/resources/channel#create-message
// TODO: 
// - Add support for files
// - Add support for ephemeral messages
// - Add support for stickers
// - Add support for components
// - Check embed length prior to sending
export async function createMessage(token: string, channelId: string, message: string | Embed[], 
    replyTo?: MessageReference, components?: MessageComponent[]): Promise<Message | null>
{
    const postBody = {} as Record<string, any>

    // If our message isn't an embed array, just set it to be the string content.
    if(!Array.isArray(message) && typeof message === 'string') {
        // There are limits to the amount of content within messages
        if(message.length > 2000) {
            tserror('Attempted to send message content with more than 2000 characters')
            return null
        } 
        postBody['content'] = message
    } else {
        // Array of embeds
        postBody['embeds'] = message
    }

    if(components && components.length > 0) {
        postBody['components'] = components
    }

    if(replyTo) {
        postBody['message_reference'] = replyTo
        // Prevent @-ing the user
        // https://discord.com/developers/docs/resources/channel#allowed-mentions-object
        postBody['allowed_mentions'] = { replied_user: false }
    }

    // Send the message to the API
    let json: any
    try {
        json = await (await fetch(`${APIBase}/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postBody)
        })).json()
    } catch(error) {
        return null
    }

    if(json['code']) {
        logErrorMessage('Create Message', json as ErrorMessage)
        return null
    }

    return json
}
// All guild utility functions are here

import { APIBase, ErrorMessage, logErrorMessage } from './constants.ts'

import { GuildMember } from '../types/guild.ts'
import { Rental } from '../../deps.ts'
import { tslog } from '../../util/tslog.ts'

// Moves a member to another voice channel
// https://discord.com/developers/docs/resources/guild#modify-guild-member
// TODO:
// - Permissions checking
export async function moveGuildMember(token: string, guildId: string, userId: string, newChannelId: string | null): Promise<GuildMember | null> {

    let json: any
    try {
        json = await (await fetch(`${APIBase}/guilds/${guildId}/members/${userId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ channel_id: newChannelId })
        })).json()
    } catch(error) {
        return null
    }

    if(json['code']) {
        logErrorMessage('Move Guild Member', json as ErrorMessage)
        tslog(JSON.stringify(json['errors'], null, 4))
        return null
    }

    return json
}

// Gets a channel
// https://discord.com/developers/docs/resources/channel#get-channel
export async function getChannel(token: string, channelId: string): Promise<Rental.Channel | null> {
    let json: any
    try {
        json = await (await fetch(`${APIBase}/channels/${channelId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bot ${token}`,
                'Content-Type': 'application/json'
            }
        })).json()
    } catch(error) {
        return null
    }

    if(json['code']) {
        logErrorMessage('Get Channel', json as ErrorMessage)
        return null
    }

    return json
}
// Song queues for servers

import { Lavadeno } from '@base/deps.ts'
import { bot } from '@base/index.ts'

// Music playing cluster; interfaces with lavalink
export let cluster: Lavadeno.Node

export interface Song {
    title: string,
    link: string,
    track: string,
    queuedBy: string 
}

// Server queues mapped by the guildId
let guildQueues: Map<string, Song[] | null>
// Player objects for each guild
export interface PlayerData {
    player: Lavadeno.Player,
    loop: boolean
}
let guildPlayers: Map<string, PlayerData | null>

export function initMusic() {
    guildQueues = new Map()
    guildPlayers = new Map()

    cluster = new Lavadeno.Node({
        connection: {
            host: '127.0.0.1',
            port: 2333,
            password: 'youshallnotpass'
        },
        sendGatewayPayload: function(_id: bigint, payload: Lavadeno.UpdateVoiceStatus) {
            // There are no shards in this framework, so we just send via the main socket
            bot.sendPayload(JSON.stringify(payload))
        }
    })
}

export function getGuildQueue(key: string) {
    return guildQueues.get(key)
}

export function setGuildQueue(key: string, val: Song[] | null) {
    guildQueues.set(key, val)
}

export function getGuildPlayer(key: string) {
    return guildPlayers.get(key)
}

export function setGuildPlayer(key: string, val: PlayerData | null) {
    guildPlayers.set(key, val)
}
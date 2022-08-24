import { Rental } from '@base/deps.ts'
import { Command } from '@commands/handler.ts'

import { getUserChannel } from '@store/voice_state.ts'
import { 
    Song, PlayerData,
    cluster, 
    getGuildQueue, getGuildPlayer, 
    setGuildQueue, setGuildPlayer
} from '@store/queues.ts'
import { tserror, tslog } from '../../../util/tslog.ts'


async function playQueue(msg: Rental.Message, guildId: string) {

    // Both of these objects should exist
    const queue = getGuildQueue(guildId)!
    const player = getGuildPlayer(guildId)

    if(!player) {
        return
    }

    const response = new Rental.EmbedBuilder()

    const connection = await player.player.play(queue[0].track)

    // Clear the event subscriptions
    // This needs to be done, as trackStuck, channelMove, and disconnect are not necessarily always occurring.
    // As a result. connection.once continuously binds, but never revokes, subscriptions to these events, until they max out.
    connection.off()

    connection.once('trackStart', async (track: string | null) => {
        response
            .setColor(0x2F3136)
            .setDescription(`:arrow_forward: Now playing: [${queue[0].title}](${queue[0].link}) (<@${queue[0].queuedBy}>)`)
        await Rental.createMessage(Deno.env.get('TEST_TOKEN')!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
    })
    connection.once('trackEnd', async (track: string | null) => {
        // Remove the track at the top & update the queue
        const previous = queue.shift()!
        // If we loop, unshift the top song
        if(player.loop) {
            queue.unshift(previous)
        }

        setGuildQueue(guildId, queue)


        if(queue.length === 0) {
            // We're done; null out the guild queue and exit the channel
            response
                .setColor(0x2F3136)
                .setDescription(':white_check_mark: Finished playing!')
            await Rental.createMessage(Deno.env.get('TEST_TOKEN')!, msg.channel_id, [response.data], Rental.toMessageReference(msg))

            player.player.disconnect()
            player.player.destroy()
            setGuildPlayer(guildId, null)
        } else {
            await playQueue(msg, guildId)
        }

        
    })
    
    connection.once('disconnected', async () => {
        // Clear the queue

        await player.player.stop()
        await player.player.destroy()

        setGuildQueue(guildId, null)
        setGuildPlayer(guildId, null)
    })
    
    connection.once('channelMove', async () => {
        // Player moved; attempt to stop and resume
        await player.player.pause()
        await player.player.resume()
    })
    connection.once('trackStuck', async (track: string | null, thresholdMs: number) => {

        console.warn('Track stuck')
        response
            .setColor(0xff0000)
            .setDescription(`:warning: Track stuck; attempting to resume`)
        await Rental.createMessage(Deno.env.get('TEST_TOKEN')!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
        await player.player.pause()
        await player.player.resume()
    })
    


}


// TODO: Finish this 
interface AuthCredentialsResponse {
    access_token: string,
    token_type: string,
    expires_in: number
}

interface AuthInfo { 
    credentials: AuthCredentialsResponse,
    openedAt: number
}

let authCredentials: AuthInfo | null = null

// Load and refresh the auth token using the client credentials flow
// https://developer.spotify.com/documentation/general/guides/authorization/client-credentials/
async function loadAuthToken() {
    if(
        !authCredentials ||
        Date.now() - authCredentials.openedAt >= authCredentials.credentials.expires_in * 1000
    ) {
        // We need to reload our auth token
        const response = await (await (await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ZTIyNWI2ZTk4YWNkNGI4YmFlYzRkYzA5YTY3NzYxYTY6MjVlZGI0Y2QzZjAyNDVlNjhjNDY3ZDdjMTIzOTA0ZmM=',
                'Content-Type': 'application/x-www-form-urlencoded' 
            },
            body: 'grant_type=client_credentials'
        }))).json()

        if(response.error) {
            tslog(`Failed to get spotify auth key: ${response.error_description}`)
            return null
        }

        if(!authCredentials) {
            authCredentials = {
                credentials: response,
                openedAt: Date.now()
            }
        } else {
            authCredentials.credentials = response,
            authCredentials.openedAt = Date.now()
        }
    }
    return authCredentials.credentials.access_token
}

// Gets a spotify track and returns the song
async function getSpotifySong(songId: string, userId: string): Promise<Song | null> {
    const token = await loadAuthToken()
    if(!token) {
        return null
    }
    // Get the track
    const track = await (await fetch(`https://api.spotify.com/v1/tracks/${songId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })).json()

    if(track.error) {
        tserror(`Failed to get spotify track: ${track.error_description}`)
        return null
    }

    // Use the song title and artists to make a query
    const artists = track.artists.reduce((prev: string, curr: any) => {
        return `${prev}, ${curr.name}`
    }, '').slice(2) // Remove the first 2 elements because they'll be a space and a comma

    const queryString = `${track.name} by ${artists}`

    const result = await cluster.rest.loadTracks(`ytsearch:${queryString}`)

    if(result.loadType === 'NO_MATCHES' || result.loadType === 'LOAD_FAILED') {
        return null
    } else {
        return {
            title: result.tracks[0].info.title,
            link: result.tracks[0].info.uri,
            track: result.tracks[0].track,
            queuedBy: userId
        } as Song
    }
}

// Gets all songs present in a spotify playlist OR album
async function getSpotifyPlaylist(isAlbum: boolean, playlistId: string, userId: string): Promise<Song[] | null> {
    const token = await loadAuthToken()
    if(!token) {
        return null
    }
    // Get the songs in the playlist OR album

    const query = isAlbum ? 'albums' : 'playlists'

    const playlist = await (await fetch(`https://api.spotify.com/v1/${query}/${playlistId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })).json()

    if(playlist.error) {
        tserror(`Failed to get spotify playlist, ${playlist.error}: ${playlist.error_description}`)
        return null
    }

    const mappedTracks: Array<Song | null> = playlist.tracks.items.map(async (track: any) => {

        // If the playlist is user generated, the track is packed within the track property
        if(!track.artists)
            track = track.track

        const artists = track.artists.reduce((prev: string, curr: any) => {
            return `${prev}, ${curr.name}`
        }, '').slice(2) // Remove the 2 elements, because it should be a comma and a space
    
        const queryString = `${track.name} by ${artists}`

        let songResult: Song | null = null

        // Load the track and then attempt to add it to the mappedTracks array
        const result = await cluster.rest.loadTracks(`ytsearch:${queryString}`)
        if(result.loadType === 'NO_MATCHES' || result.loadType === 'LOAD_FAILED') {
            tserror(`Failed to load track ${queryString} from playlist ${playlistId}`)
            songResult = null
        } else {
            songResult = {
                title: result.tracks[0].info.title,
                link: result.tracks[0].info.uri,
                track: result.tracks[0].track,
                queuedBy: userId
            }
        }

        return songResult
    

    })

    // For some reason, we get an array of promises; resolve them all.
    const resolvedTracks = await Promise.all(mappedTracks)

    return resolvedTracks.filter(item => item !== null) as Song[]
}

// Gets the song(s) from a given link. 
async function parseLink(link: string, userId: string): Promise<Song[] | null> {

    const songs: Song[] = []

    // Taken from https://stackoverflow.com/questions/19377262/regex-for-youtube-url
    const ytlinkRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/

    // Taken from https://stackoverflow.com/questions/18227087/validate-soundcloud-url-via-javascript-regex
    const sclinkRegex = /^(?:(https?):\/\/)?(?:(?:www|m)\.)?(soundcloud\.com|snd\.sc)\/(.*)$/

    // Taken from https://gist.github.com/fantattitude/3627354
    const splinkRegex = /(https?:\/\/open.spotify.com\/(track|user|artist|album|playlist)\/[a-zA-Z0-9]+(\/playlist\/[a-zA-Z0-9]+|)|spotify:(track|user|artist|album):[a-zA-Z0-9]+(:playlist:[a-zA-Z0-9]+|))/

    if(ytlinkRegex.test(link) || sclinkRegex.test(link)) {

        // Before doing anything, check if it's a youtube short; we can't play this format yet.
        if(link.includes('/shorts/')) {
            tserror('We don\'t support youtube shorts')
            return null
        }

        // Outright download the link
        const queriedSongs = await cluster.rest.loadTracks(link)

        // Determine if its a playlist using the playlistInfo
        if(queriedSongs.playlistInfo.name) {
            // This is a playlist; add all of the items to our list
            const mappedSongs = queriedSongs.tracks.map((val) => {
                return {
                    title: val.info.title,
                    link: val.info.uri,
                    track: val.track,
                    queuedBy: userId
                }
            })

            songs.push(...mappedSongs)
        } else {
            // This is a single song; add it to the songs list
            if(!queriedSongs.tracks[0]) {
                // Failed to load the song
                return null
            }

            const trackInfo = queriedSongs.tracks[0].info
            songs.push({
                title: trackInfo.title,
                link: trackInfo.uri,
                track: queriedSongs.tracks[0].track,
                queuedBy: userId
            })
        }
    } else {
        // We have a spotify link, a query term, or an invalid link of another type (that we do not want to support currently)
        if(splinkRegex.exec(link)) {
            // So, we now need to find out if its a playlist or not

            if(link.includes('playlist') || link.includes('album')) {
                // Playlist; get the playlist id
                const typeRegex = /(playlist|album)\/([\w\d]+)/gm
                const typeTest = typeRegex.exec(link)

                if(!typeTest) {
                    tserror('Unknown spotify resource')
                    return null
                }
                const resourceId = typeTest[2]
                const type = typeTest[1].toLowerCase() === 'playlist' ? false : true

                // This is very slow
                const tracks = await getSpotifyPlaylist(type, resourceId, userId)
                if(!tracks) {
                    tserror(`Failed to load spotify playlist, ${link}`)
                    return null
                }

                songs.push(...tracks)
            } else {
                // Track
                const trackRegex = /track\/([^\?]+)/gm
                const trackId = trackRegex.exec(link)![1]
                const track = await getSpotifySong(trackId, userId)
                if(!track) {
                    tserror(`Failed to load spotify track, ${link}`)
                    return null
                }
                songs.push(track)
            }
        } else {
            // Invalid link; force the user to query the term instead
            return null
        }
    }

    return songs
}

function isValidURL(query: string) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i') // fragment locator
    return !!pattern.test(query)
}

export const play: Command = {
    name: ['play'],
    description: 'Plays music, given the arguments. Ruka supports youtube, spotify, and soundcloud links',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        
        const response = new Rental.EmbedBuilder()

        const channel = getUserChannel(msg.author.id)
        
        // Check if the user is in a voice channel
        if(!channel || !channel.channelId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: You aren\'t in a voice channel')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }


        // Check if the user has put in a track as arg[1]
        const query = msg.content.split(' ').slice(1).join(' ')

        if(query.length === 0) {
            // No query was given
            response
                .setColor(0xff0000)
                .setDescription(':x: No song provided')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // The guildId usually doesn't exist; we have to get the channel from the API if this is the case
        let guildId = channel.guildId
        if(!guildId) {
            const channelInfo = await Rental.getChannel(bot.token!, channel.channelId)
            if(channelInfo) guildId = channelInfo.guild_id!
        }

        if(!guildId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Wasn\'t able to find the server you\'re in')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // We have a valid voice channel; check if any players exist in this guild
        let currentPlayer = getGuildPlayer(guildId)

        if(!currentPlayer) {
            currentPlayer = {} as PlayerData
            // Make a new player
            currentPlayer.player = cluster.createPlayer(BigInt(guildId))
            // By default, looping will be off.
            currentPlayer.loop = false
            setGuildPlayer(guildId, currentPlayer)
            currentPlayer.player.connect(BigInt(channel.channelId))

        } else {
            // We have an existing player; if it isn't playing, connect it to the
            // voice channel
            if(!currentPlayer.player.playing) {
                currentPlayer.player.connect(BigInt(channel.channelId))
            }
        }

        // Now, deal with the user input

        let searchResults: Song[]

        // Deal with if its a link
        if(isValidURL(query)) {
            const songs = await parseLink(query, msg.author.id)
            // Code duplication :(
            if(!songs) {
                const result = await cluster.rest.loadTracks(`ytsearch:${query}`)
                if(result.loadType === 'NO_MATCHES' || result.loadType === 'LOAD_FAILED') {
                    response
                        .setColor(0xff0000)
                        .setDescription(':x: Couldn\'t find a video with the requested name')
                    await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
                    return
                }
                // Add the result to searchResults
                searchResults = [{
                    title: result.tracks[0].info.title,
                    track: result.tracks[0].track,
                    queuedBy: msg.author.id,
                    link: result.tracks[0].info.uri
                }] 
            } else {
                searchResults = songs
            }
        } else {
            // Query the song
            const result = await cluster.rest.loadTracks(`ytsearch:${query}`)
            if(result.loadType === 'NO_MATCHES' || result.loadType === 'LOAD_FAILED') {
                response
                    .setColor(0xff0000)
                    .setDescription(':x: Couldn\'t find a video with the requested name; if its a playlist, it is likely that it can\'t be found. :(')
                await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
                return
            }
            // Add this result to the list
            searchResults = [{
                title: result.tracks[0].info.title,
                track: result.tracks[0].track,
                queuedBy: msg.author.id,
                link: result.tracks[0].info.uri
            }] 
        }

        // Notify the users of the new songs
        if(searchResults.length === 1) {
            response
                .setColor(0x2F3136)
                .setDescription(`:information_source: Added [${searchResults[0].title}](${searchResults[0].link}) to queue`)
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
        } else if(searchResults.length === 0) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Couldn\'t find a video(s) with the requested name(s)')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        } else {
            response
                .setColor(0x2F3136)
                .setDescription(`:information_source: Added ${searchResults.length} songs to queue`)
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
        }

        // Now, add these results to the server queue
        const serverQueue = getGuildQueue(guildId)
        if(!serverQueue || serverQueue.length === 0) {
            // Create a new queue
            setGuildQueue(guildId, searchResults)

            await playQueue(msg, guildId)
        } else {
            // Add to the existing queue
            serverQueue.push(...searchResults)
            setGuildQueue(guildId, serverQueue)
        }        
        return
    }
}

// 4fun, thanks anthony
export const desuwa: Command = {
    name: ['desuwa'],
    description: 'Forced at gunpoint by anthony to add this one',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        
        const response = new Rental.EmbedBuilder()

        const channel = getUserChannel(msg.author.id)
        
        // Check if the user is in a voice channel
        if(!channel || !channel.channelId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: You aren\'t in a voice channel')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // The guildId usually doesn't exist; we have to get the channel from the API if this is the case
        let guildId = channel.guildId
        if(!guildId) {
            const channelInfo = await Rental.getChannel(bot.token!, channel.channelId)
            if(channelInfo) guildId = channelInfo.guild_id!
        }

        if(!guildId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Wasn\'t able to find the server you\'re in')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // We have a valid voice channel; check if any players exist in this guild
        let currentPlayer = getGuildPlayer(guildId)

        if(!currentPlayer) {
            currentPlayer = {} as PlayerData
            // Make a new player
            currentPlayer.player = cluster.createPlayer(BigInt(guildId))
            // By default, looping will be off.
            currentPlayer.loop = false
            setGuildPlayer(guildId, currentPlayer)
            currentPlayer.player.connect(BigInt(channel.channelId))

        } else {
            // We have an existing player; if it isn't playing, connect it to the
            // voice channel
            if(!currentPlayer.player.playing) {
                currentPlayer.player.connect(BigInt(channel.channelId))
            }
        }

        const trackResult = await cluster.rest.loadTracks('https://www.youtube.com/watch?v=qTwBoJe_wOc')
        const searchResults: Song[] = [{
            track: trackResult.tracks[0].track,
            title: trackResult.tracks[0].info.title,
            queuedBy: msg.author.id,
            link: trackResult.tracks[0].info.uri
        }]

        // Now, add these results to the server queue
        const serverQueue = getGuildQueue(guildId)
        if(!serverQueue || serverQueue.length === 0) {
            // Create a new queue
            setGuildQueue(guildId, searchResults)

            await playQueue(msg, guildId)
        } else {
            // Add to the existing queue
            serverQueue.push(...searchResults)
            setGuildQueue(guildId, serverQueue)
        }        
        return
    }
}

export const skip: Command = {
    name: ['skip', 'next'],
    description: 'Skips the current song',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        const response = new Rental.EmbedBuilder()

        const channel = getUserChannel(msg.author.id)
        
        // Check if the user is in a voice channel
        if(!channel || !channel.channelId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: You aren\'t in a voice channel')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // The guildId usually doesn't exist; we have to get the channel from the API if this is the case
        let guildId = channel.guildId
        if(!guildId) {
            const channelInfo = await Rental.getChannel(bot.token!, channel.channelId)
            if(channelInfo) guildId = channelInfo.guild_id!
        }

        if(!guildId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Wasn\'t able to find the server you\'re in')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // Get the player
        let currentPlayer = getGuildPlayer(guildId)
        const queue = getGuildQueue(guildId)
        
        if(!currentPlayer || !currentPlayer.player.playing || !queue || queue.length === 0) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Nothing playing')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        } else {
            // We have an existing player; remove the current song on the guild queue and attempt to play
            const skipped = queue[0]
            response
                .setColor(0x2F3136)
                .setDescription(`:fast_forward: Skipped [${skipped.title}](${skipped.link}) (<@${skipped.queuedBy}>)`)
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            
            // Stopping the track will fire trackEnd, continuing the queue
            await currentPlayer.player.stop()
        }
    }
}

export const clear: Command = {
    name: ['clear', 'stop'],
    description: 'Clears the current queue',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        const response = new Rental.EmbedBuilder()

        const channel = getUserChannel(msg.author.id)
        
        // Check if the user is in a voice channel
        if(!channel || !channel.channelId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: You aren\'t in a voice channel')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // The guildId usually doesn't exist; we have to get the channel from the API if this is the case
        let guildId = channel.guildId
        if(!guildId) {
            const channelInfo = await Rental.getChannel(bot.token!, channel.channelId)
            if(channelInfo) guildId = channelInfo.guild_id!
        }

        if(!guildId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Wasn\'t able to find the server you\'re in')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // Get the player
        let currentPlayer = getGuildPlayer(guildId)
        const queue = getGuildQueue(guildId)
        
        if(!currentPlayer || !currentPlayer.player.playing || !queue || queue.length === 0) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Nothing playing')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        } else {
            // We have an existing player; remove all songs in the queue and kill the player
            // Disconnect deals with clearing the queue
            currentPlayer.player.disconnect()

            // Duplicate code
            await currentPlayer.player.stop()
            await currentPlayer.player.destroy()
            
            setGuildQueue(guildId, null)
            setGuildPlayer(guildId, null)

            response
                .setColor(0x2F3136)
                .setDescription(`:fast_forward: Cleared the queue`)
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
        }
    }
}

export const queue: Command = {
    name: ['queue'],
    description: 'Lists the current queue within the server, if it exists',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        const response = new Rental.EmbedBuilder()

        const channel = getUserChannel(msg.author.id)
        
        // Check if the user is in a voice channel
        // We don't care if they're in a channel or not
        if(!channel || !channel.channelId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: You aren\'t in a voice channel')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // The guildId usually doesn't exist; we have to get the channel from the API if this is the case
        let guildId = channel.guildId
        if(!guildId) {
            const channelInfo = await Rental.getChannel(bot.token!, channel.channelId)
            if(channelInfo) guildId = channelInfo.guild_id!
        }

        if(!guildId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Wasn\'t able to find the server you\'re in')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // Get the player
        let currentPlayer = getGuildPlayer(guildId)
        const queue = getGuildQueue(guildId)
        
        if(!currentPlayer || !currentPlayer.player.playing || !queue || queue.length === 0) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Nothing playing')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        } else {
            // TODO: Paginate the results
            // Embeds have a maximum of 25 fields; get the 25 most recent songs and print their names and who queued them

            // Get top 24 songs; we'll append the first song manually
            const topSongs = queue.slice(0, 25)
            const fields = []

            for(const [i, song] of topSongs.entries()) {

                const text = (i === 0) ? 
                    `:arrow_forward: Currently Playing: [${queue[0].title}](${queue[0].link}) (<@${queue[0].queuedBy}>)`
                    : `[${song.title}](${song.link}) (<@${song.queuedBy}>)`

                fields.push({
                    name: `Track ${i + 1}`,
                    value: text
                })
            }
            
            response
                .setColor(0x2F3136)
                .setTitle('Current Queue (Page 1)')
                .setFields(fields)
        
            // Add the message interaction components
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg), [{
                type: Rental.ActionRowInteraction,
                components: [{
                    type: Rental.ButtonInteraction,
                    style: Rental.ButtonStyle.Primary,
                    label: '◀',
                    custom_id: 'QUEUE_PREVIOUS_PAGE'
                },
                {
                    type: Rental.ButtonInteraction,
                    style: Rental.ButtonStyle.Primary,
                    label: '▶',
                    custom_id: 'QUEUE_NEXT_PAGE'
                }]
            }])
        }
    }
}

export const shuffle: Command = {
    name: ['shuffle', 'mix'],
    description: 'Shuffles the songs in the current playlist. Will not affect the current song playing',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        const response = new Rental.EmbedBuilder()

        const channel = getUserChannel(msg.author.id)
        
        // Check if the user is in a voice channel
        // We don't care if they're in a channel or not
        if(!channel || !channel.channelId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: You aren\'t in a voice channel')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // The guildId usually doesn't exist; we have to get the channel from the API if this is the case
        let guildId = channel.guildId
        if(!guildId) {
            const channelInfo = await Rental.getChannel(bot.token!, channel.channelId)
            if(channelInfo) guildId = channelInfo.guild_id!
        }

        if(!guildId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Wasn\'t able to find the server you\'re in')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // Get the player
        let currentPlayer = getGuildPlayer(guildId)
        const queue = getGuildQueue(guildId)
        
        if(!currentPlayer || !currentPlayer.player.playing || !queue || queue.length === 0) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Nothing playing')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        } else {
            
            // Shuffle the queue

            // General idea behind this shuffle is that we:
            // 1. Add the 'sort' property to all songs
            // 2. Sort the songs using these sort values
            // 3. Remove the 'sort' property, resulting in a shuffled array 
            const shuffled = queue.map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value)

            setGuildQueue(guildId, shuffled)
            // Force a reset, as this is the only way to stop and reload the playQueue function
            await currentPlayer.player.stop()


            response
                .setColor(0x2F3136)
                .setDescription(':twisted_rightwards_arrows: Shuffled the playlist!')
        
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
        }
    }
}

export const loop: Command = {
    name: ['loop'],
    description: 'Toggles the looping of the queue. Does not include tracks played prior to the execution of this command',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        const response = new Rental.EmbedBuilder()

        const channel = getUserChannel(msg.author.id)
        
        // Check if the user is in a voice channel
        if(!channel || !channel.channelId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: You aren\'t in a voice channel')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // The guildId usually doesn't exist; we have to get the channel from the API if this is the case
        let guildId = channel.guildId
        if(!guildId) {
            const channelInfo = await Rental.getChannel(bot.token!, channel.channelId)
            if(channelInfo) guildId = channelInfo.guild_id!
        }

        if(!guildId) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Wasn\'t able to find the server you\'re in')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // Get the player
        let currentPlayer = getGuildPlayer(guildId)
        const queue = getGuildQueue(guildId)
        
        if(!currentPlayer || !currentPlayer.player.playing || !queue || queue.length === 0) {
            response
                .setColor(0xff0000)
                .setDescription(':x: Nothing playing')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        } else {
            // We have a valid queue; begin to loop it
            currentPlayer.loop = !currentPlayer.loop
            setGuildPlayer(guildId, currentPlayer)

            response
                .setColor(0x2F3136)
                .setDescription(`:arrows_counterclockwise: ${currentPlayer.loop ? 'Looping' : 'Stopped looping'} the current queue`)
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }
    }
}
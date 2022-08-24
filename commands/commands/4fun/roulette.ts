import { Rental } from '@base/deps.ts'
import { Command } from '@commands/handler.ts'

import { getUserChannel, getUsersInChannel } from '@store/voice_state.ts'

import { cooldownMap, saveCooldownMap } from '@store/roulette_cooldown.ts'

const ROULETTE_COOLDOWN = 5 * 60 * 1000 // 5 minutes

// Utility to convert ms to min, sec
const toMinStr = (ms: number) => {
    const minutes = Math.floor(ms / 1000 / 60)
    const seconds = Math.round((ms / 1000) - Math.floor(minutes * 60))
    return `${minutes} min, ${seconds} sec`
}

// TODO: Permissions check
export const roulette: Command = {
    name: ['roulette'],
    description: 'Kicks a random person from the voice channel you\'re in, excluding the bot.',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        const response = new Rental.EmbedBuilder()

        // Find the channel that the user is in
        const userInfo = getUserChannel(msg.author.id)

        if(!userInfo) {
            response
                .setColor(0xff0000)
                .setDescription(':x: You aren\'t in a voice channel')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // Check if the user has an existing cooldown
        const existingCooldown = cooldownMap[msg.author.id]
        if(existingCooldown) {
            // Check the timer on the cooldown
            const time = Date.now() - existingCooldown

            if(time <= ROULETTE_COOLDOWN) {
                const remainingTime = toMinStr(ROULETTE_COOLDOWN - time)
                response
                    .setColor(0xff0000)
                    .setDescription(`:x: You\'re still on cooldown for ${remainingTime}`)
                await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
                return
            }
        }

        cooldownMap[msg.author.id] = Date.now()
        saveCooldownMap()

        // Get the users in the current channel
        const usersInChannel = getUsersInChannel(userInfo.channelId)!

        let userIds = usersInChannel.map((val) => val.userId)
        // Remove the bot from the pool of people to kick
        userIds = userIds.filter((userId) => userId !== bot.id!)

        if(userIds.length === 0) {
            response
                .setColor(0xff0000)
                .setDescription(':x: No one (except the bot) is in the channel')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

        // Choose a random person
        const chosen = userIds[Math.floor(Math.random() * userIds.length)]

        let guildId = userInfo.guildId
        if(!guildId) {
            const channelInfo = await Rental.getChannel(bot.token!, userInfo.channelId)
            if(channelInfo) guildId = channelInfo.guild_id!
        }

        // Kick them
        const result = await Rental.moveGuildMember(bot.token!, guildId, chosen, null)
        if(!result) {
            response
                .setColor(0xFF0000)
                .setDescription(':x: I don\'t have permissions to move members!')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }
        response
            .setColor(0x2F3136)
            .setDescription(`:white_check_mark: Kicked <@${chosen}>!`)
        await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
    }
}
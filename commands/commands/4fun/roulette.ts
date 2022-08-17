import { Rental } from '@base/deps.ts'
import { Command } from '@commands/handler.ts'

import { getUserChannel, getUsersInChannel } from '@store/voice_state.ts'

import { cooldownMap } from '@store/roulette_cooldown.ts'

// TODO: Permissions check
export const roulette: Command = {
    name: ['roulette'],
    description: 'Kicks a random person from the voice channel you\'re in, excluding the bot.',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        const response = new Rental.EmbedBuilder()

        // Check if the user has an existing cooldown
        const existingCooldown = cooldownMap.get(msg.author.id)
        if(existingCooldown) {
            
        }

        // Find the channel that the user is in
        const userInfo = getUserChannel(msg.author.id)

        if(!userInfo) {
            response
                .setColor(0xff0000)
                .setDescription(':x: You aren\'t in a voice channel')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        }

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
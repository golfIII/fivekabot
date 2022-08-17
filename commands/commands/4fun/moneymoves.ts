// https://media.discordapp.net/attachments/396550806570270724/705694906756366346/gg-3.png?width=394&height=701

import { Rental } from '@base/deps.ts'
import { Command } from '@commands/handler.ts'

export const moneymoves: Command = {
    name: ['moneymoves'],
    description: 'Faker incarnate',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        const message = new Rental.EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('Faker')
            .setImage('https://media.discordapp.net/attachments/396550806570270724/705694906756366346/gg-3.png?width=394&height=701')
        await Rental.createMessage(bot.token!, 
            msg.channel_id, [message.data], Rental.toMessageReference(msg))
    }
}
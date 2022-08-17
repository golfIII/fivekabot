import { Rental } from '@base/deps.ts'
import { Command } from '@commands/handler.ts'

export const dance: Command = {
    name: ['dance'],
    description: 'OG Ruka dance command',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        const message = new Rental.EmbedBuilder()
            .setColor(0x2F3136)
            .setImage('https://c.tenor.com/CwKu6TpeU7IAAAAd/ruka-icon.gif')
        await Rental.createMessage(bot.token!, 
            msg.channel_id, [message.data], Rental.toMessageReference(msg))
    }
}
import { Rental } from '@base/deps.ts'
import { Command } from '@commands/handler.ts'

export const nb: Command = {
    name: ['nb'],
    description: 'Tell someone they got no bitches',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        const message = new Rental.EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('NO BITCHES??')
            .setImage('https://c.tenor.com/LIX8OttaVncAAAAC/foss-no-bitches.gif')
        await Rental.createMessage(bot.token!, 
            msg.channel_id, [message.data], Rental.toMessageReference(msg))
    }
}
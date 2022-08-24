/* Template for creating new image commands  */
import { Rental } from '@base/deps.ts'
import { Command } from '@commands/handler.ts'

// Rename the variable below
export const ENTER_VARIABLE_NAME_HERE: Command = {
    name: ['ENTER_NAME_HERE'],
    description: 'ENTER_DESCRIPTION HERE',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {
        const message = new Rental.EmbedBuilder()
            .setColor(0x2F3136)
            .setImage('ENTER_IMAGE_LINK_HERE')
        await Rental.createMessage(bot.token!, 
            msg.channel_id, [message.data], Rental.toMessageReference(msg))
    }
}
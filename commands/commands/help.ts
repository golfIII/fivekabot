import { Rental } from '@base/deps.ts'
import { Command, commands } from '@commands/handler.ts'

export const help: Command = {
    name: ['help'],
    description: 'Shows the help message',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {

        const fields: {
            name: string,
            value: string,
            inline?: boolean
        }[] = []

        const prefix = Deno.env.get('COMMAND_PREFIX')!

        for(const command of commands) {

            const parsedNames = command.name.map((val) => `${prefix}${val}`).join(', ')

            fields.push({
                name: parsedNames,
                value: command.description
            })
        }

        const message = new Rental.EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('ruka.help')
            .setFields(fields.reverse())
        await Rental.createMessage(bot.token!, 
            msg.channel_id, [message.data], Rental.toMessageReference(msg))
        return
    }
}
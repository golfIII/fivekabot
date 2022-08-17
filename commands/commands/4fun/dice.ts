import { Rental } from '@base/deps.ts'
import { Command } from '@commands/handler.ts'

export const dice: Command = {
    name: ['dice', 'roll'],
    description: 'Rolls a whole number from the range [1, Arg]',
    async execute(bot: Rental.Client, msg: Rental.Message) {
        const response = new Rental.EmbedBuilder()

        // Parse the param
        const param = msg.content.split(' ')[1]
        const count = parseInt(param)
        if(Number.isNaN(count)) {
            response
                .setColor(0xff0000)
                .setDescription(':x: - Given parameter isn\'t convertible to number')
            await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
            return
        } 

        response
            .setColor(0x2F3136)
            .setDescription(`:game_die: You rolled a ${Math.floor(Math.random() * count)+1}`)
        await Rental.createMessage(bot.token!, msg.channel_id, [response.data], Rental.toMessageReference(msg))
    }
}
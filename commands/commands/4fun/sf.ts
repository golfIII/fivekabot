import { Rental } from '@base/deps.ts'
import { Command } from '@commands/handler.ts'

export const sf: Command = {
    name: ['sf'],
    description: 'https://dungeon.report/ps/4611686018438498781',
    execute: async (bot: Rental.Client, msg: Rental.Message) => {

        const duality = new Rental.EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('Kyle')
            .setURL('https://dungeon.report/ps/4611686018438498781')
            .setImage('https://www.bungie.net/common/destiny2_content/icons/de052aec1306777be98e7a8050bcbfb4.jpg')
        const grasp = new Rental.EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('Kyle')
            .setURL('https://dungeon.report/ps/4611686018438498781')
            .setImage('https://www.bungie.net/common/destiny2_content/icons/5f3614bd64c0668febb1ff1ae3d1632b.jpg')
        const pit = new Rental.EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('Kyle')
            .setURL('https://dungeon.report/ps/4611686018438498781')
            .setImage('https://www.bungie.net/common/destiny2_content/icons/bf9b9247278e8f8186b75fd1577e665f.jpg')
        const proph = new Rental.EmbedBuilder()
            .setColor(0x2F3136)
            .setTitle('Kyle')
            .setURL('https://dungeon.report/ps/4611686018438498781')
            .setImage('https://www.bungie.net/common/destiny2_content/icons/092f537b01b33598f0434ba04894aa72.jpg') 
        await Rental.createMessage(bot.token!, 
            msg.channel_id, [duality.data, grasp.data, pit.data, proph.data], Rental.toMessageReference(msg))
    }
}
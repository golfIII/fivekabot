import { Rental, Lavadeno } from '@base/deps.ts'
import { initVoiceStates, updateVoiceStates } from '@store/voice_state.ts'
import { initMusic, cluster } from '@store/queues.ts'
import { commands, checkCommands } from '@commands/handler.ts'
import * as Commands from '@commands/all.ts'

// Setup the command structure
for(const commandName of Object.keys(Commands)) {
    // @ts-ignore
    commands.push(Commands[commandName])
}
console.log('Loaded commands', commands)


// Initialize the music players
initMusic()

// Message content intent is required now, sadly
export const bot = new Rental.Client(
    Rental.Intents.MessageContent |
    Rental.Intents.Guilds | Rental.Intents.GuildMessages | Rental.Intents.GuildVoiceStates
)

bot.on(Rental.DispatchEvent.Ready, () => {
    console.log('Rental client online')
    // Connect the our lavalink node to allow for playing
    cluster.connect(BigInt(bot.id!))
})

// Initialize our voice state related stores
bot.on(Rental.DispatchEvent.GuildCreate, (guild: Rental.GuildCreate) => {
    initVoiceStates(guild.voice_states)
})

// Updates the server connection token
bot.on(Rental.DispatchEvent.VoiceServerUpdate, (payload: any) => {
    cluster.handleVoiceUpdate(payload)
})

// Update our voice states map & update the cluster's internals
bot.on(Rental.DispatchEvent.VoiceStateUpdate, (voiceState: Rental.VoiceState) => {
    // Note: this event will fire if a user modifies their voice state
    // (deafens/mutes/undeafens/unmutes)
    updateVoiceStates(voiceState)
    cluster.handleVoiceUpdate(voiceState as Lavadeno.DiscordVoiceState)
})

bot.on(Rental.DispatchEvent.MessageCreate, (message: Rental.Message) => {
    if(message.author.bot)
        return

    checkCommands(bot, message)
})

// Check interactions
bot.on(Rental.DispatchEvent.InteractionCreate, (body: Rental.Interaction) => {
    if(body.data && body.data.component_type === Rental.ButtonInteraction) {
        // Get the custom id and deal with it accordingly
        // TODO: Split this up into different handlers, maybe have one from ./commands/commands/music?
        switch(body.data.custom_id) {
            case 'QUEUE_NEXT_PAGE': {
                console.log('next page requested')
                break
            }
            case 'QUEUE_PREVIOUS_PAGE': {
                console.log('previous page requested')
                break
            }
            default: break
        }
    }
})

await bot.login(Deno.env.get('BOT_TOKEN')!, Rental.LoginReason.Identify, {
    activities: [{
        name: `${Deno.env.get('COMMAND_PREFIX')}help`,
        type: Rental.ActivityType.Listening,
    }],
    status: Rental.StatusType.Online
})
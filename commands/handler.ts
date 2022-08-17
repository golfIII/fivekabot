import { Rental } from '@base/deps.ts'

import * as allCommands from './all.ts'

// Basic command interface
export interface Command {
    name: string[], // Array of aliases
    description: string,
    execute: (bot: Rental.Client, message: Rental.Message) => void
}

export const commands: Command[] = []
/*
export async function registerCommands(path: string) {

    console.log(allCommands)

    // Pull and import all files from the ./commands/ directory
    // NOTE: This path is relative to index.ts
    const contents = Deno.readDirSync(path)
    for(const content of contents) {
        if(content.isFile && content.name.endsWith('ts')) {
            const command = await import(`.${path}/${content.name}`) as { default: Command }
            commands.push(command.default)
        } else if(content.isDirectory) {
            await registerCommands(`${path}/${content.name}`)
        }
    }

    // TODO: Hoist the help command to the bottom, putting it on top

}
*/

export function checkCommands(bot: Rental.Client, msg: Rental.Message) {
    // Loop through the commands and execute any that have their criteria met
    const prefix = Deno.env.get('COMMAND_PREFIX')!
    if(msg.content.toLowerCase().startsWith(prefix)) {

        const userCommand = msg.content.split(' ')[0]

        const commandName = userCommand.split('.')[1].toLowerCase()

        for(const command of commands) {
            const commandAliases = command.name.map((val: string) => val.toLowerCase())

            if(commandAliases.includes(commandName)) {
                command.execute(bot, msg)
                return
            }
        }
    }
}
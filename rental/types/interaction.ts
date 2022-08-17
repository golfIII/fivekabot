import { User } from './user.ts'
import { Emoji } from './emoji.ts'
import { Channel } from './channel.ts'
import { Message } from './message.ts'
import { GuildRole, GuildMember } from './guild.ts'

export enum InteractionType {
    Ping = 1,
    ApplicationCommand = 2,
    MessageComponent = 3,
    ApplicationCommandAutocomplete = 4,
    ModalSubmit = 5
}

// Discord API Main interaction object
// https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
export interface Interaction {
    id: string,
    application_id: string,
    type: InteractionType,
    data?: {
        id: string,
        name: string,
        type: number,
        resolved?: {
            users?: Record<string, User>,
            members?: Record<string, Partial<GuildMember>>,
            roles?: Record<string, GuildRole>,
            channels?: Record<string, Partial<Channel>>,
            messages?: Record<string, Partial<Message>>,
            // Ignore attachments
        },
        custom_id?: string // only exists if its a button
        component_type?: 1 | 2 | 3 | 4
    }
    guid_id?: string,
    channel_id?: string,
    member?: GuildMember,
    user?: User,
    token: string, // Used to continue the interaction
    version: 1,
    message?: Message,
    app_permissions?: string,
    locale?: string,
    guild_locale?: string
}

// Discord API Message interaction object
// https://discord.com/developers/docs/interactions/receiving-and-responding#message-interaction-object-message-interaction-structure
export interface MessageInteraction {
    id: string,
    type: InteractionType,
    name: string,
    user: User,
    member?: Partial<GuildMember>
}

// Discord API Button style
// https://discord.com/developers/docs/interactions/message-components#button-object-button-styles
export enum ButtonStyle {
    Primary = 1,
    Secondary = 2,
    Success = 3,
    Danger = 4,
    Link = 5
}

// Discord API Button type
// https://discord.com/developers/docs/interactions/message-components#buttons
export interface Button {
    type: 2,
    style: ButtonStyle,
    label?: string,
    emoji?: Partial<Emoji>,
    custom_id?: string // Developer defined, see documentation,
    url?: string,
    disabled?: boolean
}

export const ButtonInteraction = 2

// Discord API Select menu
// https://discord.com/developers/docs/interactions/message-components#select-menu-object
export interface SelectMenu {
    type: 3,
    custom_id: string,
    options: {
        label: string,
        value: string,
        description?: string,
        emoji?: Partial<Emoji>,
        default?: boolean
    }[],
    placeholder?: string,
    min_values?: number,
    max_values?: number,
    disabled?: boolean
}

export const SelectMenuInteraction = 3

// Discord API Text input, for modals
// https://discord.com/developers/docs/interactions/message-components#text-inputs
export enum TextInputStyle { Short = 1, Paragraph = 2 }

export interface TextInput {
    type: 4,
    custom_id: string,
    style: TextInputStyle,
    label: string,
    min_length?: number,
    max_length?: number,
    required?: boolean,
    value?: string,
    placeholder?: string
}

export const TextInputInteraction = 4

// Discord API Action row
// https://discord.com/developers/docs/interactions/message-components#component-object
export interface ActionRow {
    type: 1,
    components: MessageComponent[]
}

export const ActionRowInteraction = 1

export type MessageComponent = Button | SelectMenu | TextInput | ActionRow

import { User } from './user.ts'
import { Channel, ChannelMention } from './channel.ts'
import { Emoji, StickerFormatType } from './emoji.ts'
import { MessageInteraction, MessageComponent } from './interaction.ts'

// Discord API Embed object
// https://discord.com/developers/docs/resources/channel#embed-object
// TODO: Implement https://discord.com/developers/docs/resources/channel#embed-object-embed-limits
export interface Embed {
    title?: string,
    type?: string,
    description?: string,
    url?: string,
    timestamp?: string,
    color?: number,
    footer?: {
        text: string,
        icon_url?: string,
        proxy_icon_url?: string
    },
    image?: {
        url: string,
        proxy_url?: string,
        height?: number,
        width?: number
    },
    thumbnail?: {
        url: string,
        proxy_url?: string,
        height?: number,
        width?: number
    },
    video?: {
        url: string,
        proxy_url?: string,
        height?: number,
        width?: number
    },
    provider?: {
        name?: string,
        url?: string
    },
    author?: {
        name: string,
        url?: string,
        icon_url?: string,
        proxy_icon_url?: string
    },
    fields?: {
        name: string,
        value: string,
        inline?: boolean
    }[]
}

// Discord API Attachment object
// https://discord.com/developers/docs/resources/channel#attachment-object
export interface Attachment {
    id: string,
    filename: string,
    description?: string,
    content_type?: string,
    size: number, // in bytes
    url: string,
    proxy_url: string,
    height?: number,
    width?: number,
    ephemeral?: boolean
}

// Discord API Message reference object, required to make replies
// https://discord.com/developers/docs/resources/channel#message-reference-object-message-reference-structure
export interface MessageReference {
    message_id?: string,
    channel_id?: string,
    guild_id?: string,
    fail_if_not_exists?: boolean
}

// Discord API Message reaction object
// https://discord.com/developers/docs/resources/channel#reaction-object
export interface MessageReaction {
    count: number,
    me: boolean,
    emoji: Partial<Emoji>,
}

// Discord API Message types
// https://discord.com/developers/docs/resources/channel#message-object-message-types
export enum MessageType {
    Default = 0,
    RecipientAdd = 1,
    RecipientRemove = 2,
    Call = 3,
    ChannelNameChange = 4,
    ChannelIconChange = 5,
    ChannelPinnedMessage = 6,
    UserJoin = 7,
    GuildBoost = 8,
    GuildBoostTier_1 = 9,
    GuildBoostTier_2 = 10,
    GuildBoostTier_3 = 11,
    ChannelFollowAdd = 12,
    GuildDiscoveryDisqualified = 14,
    GuildDiscoveryRequalified = 15,
    GuildDiscoveryGracePeriodInitialWarning = 16,
    GuildDiscoveryGracePeriodFinalWarning = 17,
    ThreadCreated = 18,
    Reply = 19,
    ChatInputCommand = 20,
    ThreadStarterMessage = 21,
    GuildInviteReminder = 22,
    ContextMenuCommand = 23,
    AutoModerationAction = 24,
}

// Discord API Message object
// https://discord.com/developers/docs/resources/channel#message-object
export interface Message {
    id: string,
    channel_id: string,
    author: User,
    content: string,
    timestamp: string,
    edited_timestamp?: string,
    tts: boolean,
    mention_everyone: boolean,
    mentions: User[],
    mention_roles: string[],
    mention_channels?: ChannelMention[],
    attachments: Attachment[]
    embeds: Embed[],
    reactions?: MessageReaction[],
    nonce?: number | string,
    pinned: boolean,
    webhook_id?: string, // Only exists if the message was sent by a webhook
    type: MessageType,
    // .activity and .application are omitted
    application_id?: string,
    message_reference?: MessageReference
    flags?: number,
    referenced_message?: Message,
    interaction?: MessageInteraction,
    thread?: Channel,
    components?: MessageComponent[],
    sticker_items?: {
        id: string,
        name: string,
        format_type: StickerFormatType
    }[],
    position?: number
}

// Utility functions and classes

// Embed builder, reminiscent of discordjs. Chainable properties.
export class EmbedBuilder {
    private embed!: Embed

    constructor() {
        this.embed = {}
    }

    public setTitle(title: string) { 
        this.embed.title = title
        return this
    }

    public setDescription(description: string) { 
        this.embed.description = description
        return this
    }

    public setURL(url: string) {
        this.embed.url = url
        return this
    }

    public setColor(color: number) {
        this.embed.color = color
        return this
    }

    public setFooter(text: string, iconURL: string) {
        this.embed.footer = {
            text: text,
            icon_url: iconURL
        }
        return this
    }

    public setImage(url: string) {
        this.embed.image = {
            url: url
        }
        return this 
    }

    public setThumbnail(url: string) {
        this.embed.thumbnail = {
            url: url
        }
        return this
    }

    public setAuthor(name: string, url?: string, iconURL?: string) {
        this.embed.author = {
            name: name,
            url: url,
            icon_url: iconURL
        }
        return this
    }

    public setFields(fields: {
        name: string,
        value: string,
        inline?: boolean
    }[]) {
        this.embed.fields = fields
        return this
    }

    get data() {
        return this.embed
    }
}
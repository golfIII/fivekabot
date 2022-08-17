import { User } from './user.ts'
import { Emoji, Sticker } from './emoji.ts'
import { Channel, VoiceState } from './channel.ts'

// Discord API Guild member object
// https://discord.com/developers/docs/resources/guild#guild-member-object
export interface GuildMember {
    user?: User,
    nick?: string,
    avatar?: string,
    roles: string[],
    joined_at: string,
    premium_since?: string,
    deaf: boolean,
    mute: boolean,
    pending?: boolean
    permissions?: string,
    communication_disabled_until?: string
}

// Discord API Guild roles object
export interface GuildRole {
    id: string,
    name: string,
    color: number,
    hoist: boolean,
    icon?: string,
    unicode_emoji?: string,
    position: number,
    permissions: string,
    managed: boolean,
    mentionable: boolean,
    tags?: {
        bot_id?: string,
        integration_id?: string,
    }
}

// Discord API Guild object
// https://discord.com/developers/docs/resources/guild#guild-object-guild-structure
export interface Guild {
    id: string,
    name: string,
    icon?: string,
    icon_hash?: string,
    splash?: string,
    discovery_splash?: string
    owner?: boolean,
    owner_id: string,
    permissions?: string,
    region?: string,
    afk_channel_id?: string,
    afk_timeout: number,
    widget_enabled?: boolean,
    widget_channel_id?: string,
    verification_level: number,
    default_message_notifications: number,
    explicit_content_filter: number,
    roles: GuildRole[],
    emojis: Emoji[],
    features: string[],
    mfa_level: number,
    application_id?: string,
    system_channel_id?: string,
    system_channel_flags: number,
    rules_channel_id?: string,
    max_presences?: number,
    max_members?: number,
    vanity_url_code?: string,
    description?: string,
    banner?: string,
    premium_tier: number,
    premium_subscription_count?: number,
    preferred_locale: string,
    public_updates_channel_id?: string,
    max_video_channel_users?: number,
    approximate_member_count?: number,
    approximate_presence_count?: number,
    welcome_screen?: {
        description?: string,
        welcome_channels: {
            channel_id: string,
            description: string,
            emoji_id?: string,
            emoji_name?: string
        }[]
    },
    nsfw_level: number,
    stickers?: Sticker[],
    premium_progress_bar_enabled: boolean
}

// Discord API payload sent when GuildCreate is received
export interface GuildCreate {
    // The following fields are already present it guild
    id: string,
    name: string,
    icon?: string,
    icon_hash?: string,
    splash?: string,
    discovery_splash?: string
    owner?: boolean,
    owner_id: string,
    permissions?: string,
    region?: string,
    afk_channel_id?: string,
    afk_timeout: number,
    widget_enabled?: boolean,
    widget_channel_id?: string,
    verification_level: number,
    default_message_notifications: number,
    explicit_content_filter: number,
    roles: GuildRole[],
    emojis: Emoji[],
    features: string[],
    mfa_level: number,
    application_id?: string,
    system_channel_id?: string,
    system_channel_flags: number,
    rules_channel_id?: string,
    max_presences?: number,
    max_members?: number,
    vanity_url_code?: string,
    description?: string,
    banner?: string,
    premium_tier: number,
    premium_subscription_count?: number,
    preferred_locale: string,
    public_updates_channel_id?: string,
    max_video_channel_users?: number,
    approximate_member_count?: number,
    approximate_presence_count?: number,
    welcome_screen?: {
        description?: string,
        welcome_channels: {
            channel_id: string,
            description: string,
            emoji_id?: string,
            emoji_name?: string
        }[]
    },
    nsfw_level: number,
    stickers?: Sticker[],
    premium_progress_bar_enabled: boolean
    // The following fields are unique to this GuildCreate object
    joined_at: string,
    large: boolean,
    unavailable?: string,
    member_count: number,
    voice_states: Partial<VoiceState>[]
    members: GuildMember[],
    channels: Channel[],
    threads: Channel[],
    // presences are (for now) IGNORED
    // stage instances are (for now) IGNORED
    // guild scheduled events are (for now) IGNORED
}
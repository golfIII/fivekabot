// TODO: Move thread objects to their own file
import { User } from './user.ts'
import { GuildMember } from './guild.ts'

// Discord API Channel types
// https://discord.com/developers/docs/resources/channel#channel-object-channel-types
export enum ChannelType {
    GuildText          = 0,
    DM                 = 1,
    GuildVoice         = 2,
    GroupDM            = 3,
    GuildCategory      = 4,
    GuildNews          = 5,
    GuildNewsThread    = 10,
    GuildPublicThread  = 11,
    GuildPrivateThread = 12,
    GuildStageVoice    = 13,
    GuildDirectory     = 14,
    GuildForum         = 15
}

// Discord API Channel mention object
// https://discord.com/developers/docs/resources/channel#channel-mention-object
export interface ChannelMention {
    id: string,
    guild_id: string,
    type: ChannelType,
    name: string
}

// Discord API Channel object
// https://discord.com/developers/docs/resources/channel#channel-object
export interface Channel {
    id: string,
    type: ChannelType,
    guild_id?: string,
    position?: number,
    permission_overwrites?: {
        id: string,
        type: number, // 0 or 1, role or member respectively
        allow: string,
        deny: string
    }[],
    name?: string,
    topic?: string,
    nsfw?: boolean,
    last_message_id?: string,
    bitrate?: number,
    user_limit?: number,
    rate_limit_per_user?: number,
    recipients?: User[],
    icon?: string,
    owner_id?: string,
    application_id?: string,
    parent_id?: string,
    last_pin_timestamp?: string,
    rtc_region?: string,
    video_quality_mode?: string,
    message_count?: number,
    member_count?: number,
    thread_metadata?: {
        archived: boolean,
        auto_archive_duration: number,
        archive_timestamp: string,
        locked: boolean,
        invitable?: boolean,
        create_timestamp?: string
    }[],
    member: {
        id?: string,
        user_id?: string,
        join_timestamp: string,
        flags: number
    },
    default_auto_archive_duration?: number,
    permissions?: string,
    flags?: number,
    total_message_sent?: number
}

// Discord API Voice state object
// https://discord.com/developers/docs/resources/voice#voice-state-object
export interface VoiceState {
    guild_id?: string,
    channel_id?: string,
    user_id: string,
    member?: GuildMember,
    session_id: string,
    deaf: boolean,
    mute: boolean,
    self_deaf: boolean,
    self_mute: boolean,
    self_stream?: boolean,
    self_video: boolean,
    suppress: boolean,
    request_to_speak_timestamp: string
}
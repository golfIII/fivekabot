import { User } from './user.ts'

// Discord API Sticker type
// https://discord.com/developers/docs/resources/sticker#sticker-object-sticker-types
export enum StickerType {
    Standard = 1,
    Guild = 2
}

// Discord API Sticker format type
// https://discord.com/developers/docs/resources/sticker#sticker-object-sticker-format-types
export enum StickerFormatType {
    PNG = 1,
    APNG = 2,
    LOTTIE = 3
}

// Discord API Sticker object
// https://discord.com/developers/docs/resources/sticker#sticker-object
export interface Sticker {
    id: string,
    pack_id?: string,
    name: string,
    description?: string,
    tags?: string,
    type: StickerType,
    format_type: StickerFormatType,
    available?: boolean,
    guild_id?: number,
    user?: User,
    sort_value?: number
}

// Discord API Emoji object
// https://discord.com/developers/docs/resources/emoji#emoji-object
export interface Emoji {
    id?: string,
    name?: string,
    roles?: string[],
    user?: User,
    require_colons?: boolean,
    managed?: boolean,
    animated?: boolean,
    available?: boolean
}
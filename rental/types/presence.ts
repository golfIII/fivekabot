// Discord API Activity types
export enum ActivityType { 
    Game,
    Streaming,
    Listening,
    Watching,
    Custom,
    Competing
}

// Discord API Activity button; modified version of the normal Interaction button
// https://discord.com/developers/docs/topics/gateway#activity-object-activity-buttons
export interface ActivityButton {
    label: string,
    url: string
}

// Discord API Activity object
// TODO: Expand further
// https://discord.com/developers/docs/topics/gateway#activity-object
export interface Activity {
    name: string,
    type: ActivityType,
    buttons?: ActivityButton[]
}

// Discord API Status types
// https://discord.com/developers/docs/topics/gateway#update-presence-status-types
export enum StatusType {
    Online = 'online',
    DND = 'dnd',
    AFK = 'idle',
    Invisible = 'invisible',
    Offline = 'offline'
}

// Discord API Update presence object
// https://discord.com/developers/docs/topics/gateway#update-presence
export interface UpdatePresence {
    since?: number,
    activities: Activity[],
    status: StatusType,
    afk?: boolean
}
// The opcode associated with a payload.
// https://discord.com/developers/docs/topics/opcodesandstatuscodes#gatewaygatewayopcodes
export enum Opcode {
    Dispatch            = 0,  // Receive. Indicates a dispatch event (ie, MESSAGECREATE)
    Heartbeat           = 1,  // Primarily sent, but can be received; if received, the bot must send a heartbeat immediately
    Identify            = 2,  // Send, used to identify the bot
    PresenceUpdate      = 3,  // Send, used to update the bot's presence
    VoiceStateUpdate    = 4,  // Send, used to update the bot's voice status
    // 5 is skipped
    Resume              = 6,  // Send, used in place of identify when a reconnect token is given
    Reconnect           = 7,  // Receive, the bot must reconnect and resume
    RequestGuildMembers = 8,  // Send, used to get guild members
    InvalidSession      = 9,  // Receive, the bot must reconnect and reidentify
    Hello               = 10, // Received after connecting to the gateway, contains the heartbeat interval.
    Ack                 = 11  // Received once a heartbeat is acknowledged
}

// TODO: Some dispach events are missing
// Most dispatch events.
// The associated intents are present as well.
// https://discord.com/developers/docs/topics/gateway#list-of-intents
export enum DispatchEvent {
    // No intents required
    Ready = 'READY',
    InteractionCreate = 'INTERACTION_CREATE',

    // Guilds (1 << 0)
    GuildCreate = 'GUILD_CREATE',
    GuildUpdate = 'GUILD_UPDATE',
    GuildDelete = 'GUILD_DELETE',
    GuildRoleCreate = 'GUILD_ROLE_CREATE',
    GuildRoleUpdate = 'GUILD_ROLE_UPDATE',
    GuildRoleDelete = 'GUILD_ROLE_DELETE',
    ChannelCreate = 'CHANNEL_CREATE',
    ChannelUpdate = 'CHANNEL_UPDATE',
    ChannelDelete = 'CHANNEL_DELETE',
    ChannelPinsUpdate = 'CHANNEL_PINS_UPDATE',
    ThreadCreate = 'THREAD_CREATE',
    ThreadUpdate = 'THREAD_UPDATE',
    ThreadDelete = 'THREAD_DELETE',
    ThreadListSync = 'THREAD_LIST_SYNC',
    ThreadMemberUpdate = 'THREAD_MEMBER_UPDATE',
    ThreadMembersUpdate = 'THREAD_MEMBERS_UPDATE',     
    StageInstanceCreate = 'STAGE_INSTANCE_CREATE',
    StageInstanceUpdate = 'STAGE_INSTANCE_UPDATE',
    StageInstanceDelete = 'STAGE_INSTANCE_DELETE',
  
    // GuildMembers (1 << 1)
    GuildMemberAdd = 'GUILD_MEMBER_ADD',
    GuildMemberUpdate = 'GUILD_MEMBER_UPDATE',
    GuildMemberRemove = 'GUILD_MEMBER_REMOVE',
    // ThreadMembersUpdate DUPLICATE
  
    // GuildBans (1 << 2)
    GuildBanAdd = 'GUILD_BAN_ADD',
    GuildBanRemove = 'GUILD_BAN_REMOVE',
  
    // GuildEmojisAndStickers (1 << 3)
    GuildEmojisUpdate = 'GUILD_EMOJIS_UPDATE',
    GuildStickersUpdate = 'GUILD_STICKERS_UPDATE',
  
    // GuildIntegrations (1 << 4)
    GuildIntegrationsUpdate = 'GUILD_INTEGRATIONS_UPDATE',
    IntegrationCreate = 'INTEGRATION_CREATE',
    IntegrationUpdate = 'INTEGRATION_UPDATE',
    IntegrationDelete = 'INTEGRATION_DELETE',
  
    // GuildWebhooks (1 << 5)
    WebhooksUpdate = 'WEBHOOKS_UPDATE',
  
    // GuildInvites (1 << 6)
    InviteCreate = 'INVITE_CREATE',
    InviteDelete = 'INVITE_DELETE',
  
    // GuildVoiceStates (1 << 7)
    VoiceStateUpdate = 'VOICE_STATE_UPDATE',
    VoiceServerUpdate = 'VOICE_SERVER_UPDATE',
  
    // GuildPresences (1 << 8)
    PresenceUpdate = 'PRESENCE_UPDATE',
  
    // GuildMessages (1 << 9)
    MessageCreate = 'MESSAGE_CREATE',
    MessageUpdate = 'MESSAGE_UPDATE',
    MessageDelete = 'MESSAGE_DELETE',
    MessageDeleteBulk = 'MESSAGE_DELETE_BULK',
  
    // GuildMessageReactions (1 << 10)
    MessageReactionAdd = 'MESSAGE_REACTION_ADD',
    MessageReactionRemove = 'MESSAGE_REACTION_REMOVE',
    MessageReactionRemoveAll = 'MESSAGE_REACTION_REMOVE_ALL',
    MessageReactionRemoveEmoji = 'MESSAGE_REACTION_REMOVE_EMOJI',
  
    // GuildMessageTyping (1 << 11)
    TypingStart = 'TYPING_START',
  
    // DirectMessages (1 << 12)
    // MessageCreate DUPLICATE,
    // MessageDelete DUPLICATE
    // MessageUpdate DUPLICATE
    // ChannelPinsUpdate DUPLICATE,
  
    // DirectMessageReactions (1 << 13)
    // MessageReactionAdd DUPLICATE
    // MessageReactionRemove DUPLICATE
    // MessageReactionRemoveAll DUPLICATE
    // MessageReactionRemoveEmoji DUPLICATE
  
    // DirectMessageTyping (1 << 14)
    // TypingStart DUPLICATE
  
    // MessageContent (1 << 15)   
    // Experimental      
  
    // GuildScheduledEvents (1 << 16)
    GuildScheduledEventCreate = 'GUILD_SCHEDULED_EVENT_CREATE',
    GuildScheduledEventUpdate = 'GUILD_SCHEDULED_EVENT_UPDATE',
    GuildScheduledEventDelete = 'GUILD_SCHEDULED_EVENT_DELETE',
    GuildScheduledEventUserAdd = 'GUILD_SCHEDULED_EVENT_USER_ADD',
    GuildScheduledEventUserRemove = 'GUILD_SCHEDULED_EVENT_USER_REMOVE',
  
    // AutoModerationConfiguration (1 << 20)
    AutoModerationRuleCreate = 'AUTO_MODERATION_RULE_CREATE',
    AutoModerationRuleUpdate = 'AUTO_MODERATION_RULE_UPDATE',
    AutoModerationRuleDelete = 'AUTO_MODERATION_RULE_DELETE',
  
    // AutoModerationExecution (1 << 21)
    AutoModerationActionExecution = 'AUTO_MODERATION_ACTION_EXECUTION',    
}

// A discord API websocket payload.
// https://discord.com/developers/docs/topics/gateway#payloads
export interface Payload {
    op: Opcode,       // Opcode, see descriptions above
    d?: any,          // Event data
    s?: number,       // Sequence number, only present when op = Opcode.Dispatch
    t?: DispatchEvent // DispatchEvent type, only present when op = Opcode.Dispatch
}
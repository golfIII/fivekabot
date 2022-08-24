// Store of voice states for our bot

import { Rental } from '@base/deps.ts'

let voiceStates: Partial<Rental.VoiceState>[] = []

// Utilities used to update the voice states
export function initVoiceStates(states: Partial<Rental.VoiceState>[]) {
    voiceStates.push(...states)
}

export function updateVoiceStates(newState: Partial<Rental.VoiceState>) {
    // Find if this state already exists
    const existingState = voiceStates.filter((val: Partial<Rental.VoiceState>) => val.user_id! === newState.user_id!)[0]

    // TODO: REVISIT. This can sometimes bug out, with some users ghosting in channels and being treated as present.
    // I'm not sure if this is a performance thing, or if it's just an issue with the logic here.
    
    // Overwrite existing state, or just append the new state.
    if(existingState) {
        voiceStates[voiceStates.indexOf(existingState)] = newState
    } else {
        voiceStates.push(newState)
    }
}

// Queries regarding these states 

// Gets all of the users in a voice channel
export function getUsersInChannel(channelId: string) {
    const relevantStates = voiceStates.filter((state: Partial<Rental.VoiceState>) => state.channel_id! === channelId)

    if(relevantStates.length < 1)
        return null

    return relevantStates.map((state: Partial<Rental.VoiceState>) => {
        return {
            userId: state.user_id!,
            member: state.member!
        }
    })
}

// Gets the ID of the voice channel that a user is currently in, if it exists 
export function getUserChannel(userId: string) {
    const relevantState = voiceStates.filter((state: Partial<Rental.VoiceState>) => state.user_id === userId)[0]

    if(!relevantState) return null

    return {
        channelId: relevantState.channel_id!,
        guildId: relevantState.guild_id!,
        member: relevantState.member!
    }
}
import { Rental } from '../deps.ts'
/* WARNING: Tslog is a client side function; we're importing it into the lib here... */
import { tserror, tslog } from '../util/tslog.ts'
import { getGatewayBot } from './api/gateway.ts'

import { Opcode, DispatchEvent, Payload } from './types/payload.ts'

// Params required to keep the bot alive
interface BotLifeline {
    userId: string,
    token: string,
    sessionId: string, // Set within the initial ready event
    intents: number,
    gatewayPath: string,

    hbLoopPointer: number,
    hbInterval: number, // In milliseconds
    hbAckedLast: boolean,
    lastSNum: number
}

// Callback for a dispatch event. TODO: Strongly type this
type DispatchEventCallback = (_?: any) => void

// Login reasons, required to distinguish between identify and resume calls
export enum LoginReason { Identify, Resume }

// Main client for the bot
export class Client {
    private lifeline!: Partial<BotLifeline>
    private ws!: WebSocket
    private eventHandlers!: Map<DispatchEvent, DispatchEventCallback>

    constructor(intents: number) {
        this.lifeline = {}
        this.eventHandlers = new Map()
        this.lifeline.intents = intents
    }

    get token() {
        return this.lifeline.token
    }

    get id() {
        return this.lifeline.userId
    }

    private async sendHb() {
        if(!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            tserror('Attempted to send a heartbeat to a closed websocket')
            Deno.exit()
        }

        if(!this.lifeline.hbAckedLast) {
            tserror('Zombified connection')
            // Attempt to reconnect and resume
            this.ws.close(3000, 'Zombified connection')
            await this.login(this.lifeline.token!, LoginReason.Resume)
            return
        }

        const heartbeat: Payload = {
            op: Opcode.Heartbeat,
            d: this.lifeline.lastSNum
        }

        this.ws.send(JSON.stringify(heartbeat))

        // Reset the hb acknowledgement counter
        this.lifeline.hbAckedLast = false
    }

    private handleSocketOpen(ev: Event) {
        tslog('WebSocket successfully opened')
    }

    private handleDispatch(payload: Payload) {
        switch(payload.t!) {
            case DispatchEvent.Ready: {
                // save the session id and bot id
                this.lifeline.sessionId = payload.d!.session_id
                this.lifeline.userId = payload.d.user.id
                const cb = this.eventHandlers.get(DispatchEvent.Ready)
                if(cb) cb()
                break
            }
            default: {
                tslog(`Dispatch event ${JSON.stringify(payload.t, null, 4)}`)
                const cb = this.eventHandlers.get(payload.t!)
                if(cb) cb(payload.d)
                break
            }
        }
    }

    public on(event: DispatchEvent, callback: DispatchEventCallback) {
        this.eventHandlers.set(event, callback)
    }

    public async login(token: string, reason: LoginReason = LoginReason.Identify, presence?: Rental.UpdatePresence) {

        const gatewayInfo = await getGatewayBot(token)
        if(!gatewayInfo)
            this.lifeline.gatewayPath = 'wss://gateway.discord.gg/?v=10&encoding=json'
        else
            this.lifeline.gatewayPath = `${gatewayInfo.url}/?v=10&encoding=json`

        // Close any existing loops
        if(this.lifeline.hbLoopPointer) clearInterval(this.lifeline.hbLoopPointer)

        // Save gateway information and log into the gateway
        this.lifeline.hbAckedLast = true // Facilitates the first heartbeat
        this.lifeline.token = token

        // All calls to login will be preceded by a close call on the websocket, so we can safely reopen it.
        this.ws = new WebSocket(this.lifeline.gatewayPath)

        // Bind the event handlers to our websocket
        this.ws.onopen = this.handleSocketOpen
        this.ws.onmessage = async (ev: MessageEvent) => {
            const payload = JSON.parse(ev.data) as Payload

            switch(payload.op) {
                case Opcode.Dispatch: {
                    // Dispatch event
                    this.lifeline.lastSNum = payload.s!
                    this.handleDispatch(payload)
                    break
                }
                case Opcode.Heartbeat: {
                    // Immediately send a heartbeat
                    await this.sendHb()
                    break
                }
                case Opcode.Reconnect: {
                    // Reconnect and resume

                    this.ws.close(3001, 'Reconnect and resume requested (Opcode.Reconnect)')
                    tslog('Reconnect and resume requested (Opcode.Reconnect)')
                    await this.login(this.lifeline.token!, LoginReason.Resume)
                    break
                }
                case Opcode.InvalidSession: {
                    // Reconnect and reidentify
                    this.ws.close(3002, 'Invalid Session (Opcode.InvalidSession)')
                    // Wait between 1 and 5 seconds before reconnecting
                    setTimeout(async () => {
                        // The payload data is a boolean saying if we can resume or not
                        const reason = (payload.d) ? LoginReason.Resume : LoginReason.Identify
                        tslog('Invalid Session (Opcode.InvalidSession)')
                        await this.login(this.lifeline.token!, reason, {
                            activities: [{
                                name: `${Deno.env.get('COMMAND_PREFIX')}help`,
                                type: Rental.ActivityType.Listening,
                            }],
                            status: Rental.StatusType.Online
                        })
                    }, (Math.random() + 1) * 2500)
                    break  
                }
                case Opcode.Hello: {
                    // Setup the heartbeat interval
                    this.lifeline.hbInterval = payload.d!.heartbeat_interval
                    // Begin the heartbeat loop
                    setTimeout(async () => {
                        await this.sendHb()
                        this.lifeline.hbLoopPointer = setInterval(async () => {
                            await this.sendHb()
                        }, this.lifeline.hbInterval)
                    }, Math.random() * this.lifeline.hbInterval!)
    
                    // Now we need to identify OR resume, based on the LoginReason
                    if(reason === LoginReason.Identify) {
                        // Identify
                        tslog('Identifying')
                        // TODO: See the full identification payload here:
                        // https://discord.com/developers/docs/topics/gateway#identify
                        const identify: Payload = {
                            op: Opcode.Identify,
                            d: {
                                token: this.lifeline.token,
                                intents: this.lifeline.intents,
                                properties: {
                                    os: 'linux',
                                    browser: '$rental',
                                    device: '$rental'
                                },
                            }
                        }

                        if(presence)
                        identify.d['presence'] = presence

                        this.ws.send(JSON.stringify(identify))

                        // We should now receive ready and guild_create events, signifying the
                        // start of the bot.
                    } else {
                        if(!this.lifeline.sessionId) {
                            tserror('Attempted to resume prior to sessionId setup')
                            return
                        }
                        // Resume
                        tslog(`Resuming with lifeline, ${JSON.stringify(this.lifeline, null, 4)}`)
                        const resume: Payload = {
                            op: Opcode.Resume,
                            d: {
                                token: this.lifeline.token,
                                session_id: this.lifeline.sessionId,
                                seq: this.lifeline.lastSNum
                            }
                        }

                        this.ws.send(JSON.stringify(resume))
                    }
                    break
                }
                case Opcode.Ack: {
                    // Acknowledge a heartbeat
                    this.lifeline.hbAckedLast = true
                    break
                }
                default: {
                    tslog(`Unhandled gateway opcode, ${payload.op}`)
                    break
                }
            }
        }
        this.ws.onerror = async (ev: Event | ErrorEvent) => {
            tserror(`WebSocket error: ${JSON.stringify(ev, null, 4)}`)
            // Attempt to reopen
            if(!this.lifeline || !this.lifeline.token) {
                tserror('Token doesn\'t exist on lifeline')
                tserror(`Lifeline, ${JSON.stringify(this.lifeline, null, 4)}`)
                return
            }
            
            await this.login(this.lifeline.token, LoginReason.Resume)
        }
        this.ws.onclose = async (ev: CloseEvent) => {
            tslog(`WebSocket closed: ${JSON.stringify(ev, null, 4)}`)

            if(!this.lifeline || !this.lifeline.token) {
                tserror('Token doesn\'t exist on lifeline')
                tserror(`Lifeline, ${JSON.stringify(this.lifeline, null, 4)}`)
                return
            }

            const codeClass = Math.floor(ev.code / 1000)

            if(codeClass === 1) {
                // 1000 close code; session is not preserved, so we need to reidentify
                await this.login(this.lifeline.token, LoginReason.Identify, {
                    activities: [{
                        name: `${Deno.env.get('COMMAND_PREFIX')}help`,
                        type: Rental.ActivityType.Listening,
                    }],
                    status: Rental.StatusType.Online
                })
            } else if(codeClass === 4) {
                // Closed for a discord reason; attempt Resume
                await this.login(this.lifeline.token, LoginReason.Resume)
            }
            // Any other error is regarded as unhandled.
        }
    }

    public sendPayload(payload: string) {
        if(!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            tserror('Attempted to send a payload to a closed websocket')
            return
        }

        this.ws.send(payload)
    }
}

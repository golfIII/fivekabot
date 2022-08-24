// Timestamped console.log
export function tslog(msg: string) {
    console.log(`[${new Date().toString()}]: ${msg}`)
}

export function tserror(msg: string) {
    console.error(`[${new Date().toString()}]: ${msg}`)
}
import { Rental } from '@base/deps.ts'

export let cooldownMap: Record<string, number>

// Load an existing cooldown map, if a cooldown_map.json file exists
function loadSavedCooldownMap() {
    try {
        const file = JSON.parse(Deno.readTextFileSync('./stores/cooldown_map.json'))
        cooldownMap = file as Record<string, number>
    } catch(err) {
        // Likely that the file doesn't exist
        cooldownMap = {}
    }
}

// Saves the cooldown map file, should be executed whenever the program ends.
export function saveCooldownMap() {
    console.log(JSON.stringify(cooldownMap))
    Deno.writeTextFileSync('./stores/cooldown_map.json', JSON.stringify(cooldownMap))
}

globalThis.addEventListener('load', () => {
    loadSavedCooldownMap()
})

globalThis.addEventListener('unload', () => {
    saveCooldownMap()
})
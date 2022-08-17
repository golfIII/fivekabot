## Rukabot 5.0

Files / Directories:
- `rental`: Contains a minimal wrapper of the Discord API with strict typing.
- `commands`: Contains all commands present within the bot.
- `index.ts`: Application entrypoint

Run command:
`deno run --import-map=import_map.json -A index.ts`

TODOS:
1. Dynamically import commands from ./commands.
2. Add a role select command
3. Fix the loop and shuffle commands
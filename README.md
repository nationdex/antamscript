# 🕶️ AntamScript

Meet AntamScript, basically ForgeScript but B I G, 69 times more powerful, maaaaaan das ist crazy!

## 📥 Installation

```bash
# Node.js (NPM)
npm install @nationdex/antamscript

# PNPM
pnpm add @nationdex/antamscript

# Yarn
yarn add @nationdex/antamscript

# Bun
bun add @nationdex/antamscript
```

### Client initialization

Create `bot.ts` file

```ts
import { AntamClient } from "@nationdex/antamscript";

const client = new AntamClient({
  events: ["messageCreate"],
  intents: ["Guilds", "GuildMessages", "MessageContent"],
  prefixes: ["!"],
});
client.commands.add({
  type: "messageCreate",
  name: "ping",
  code: "pong! $pingms",
});
await client.login(process.env.DISCORD_TOKEN);
```

Then run the code using `bun run bot.ts`

## 🛠️ Development

```bash
# Clone the repository through Git.
git clone https://github.com/nationdex/antamscript.git

# Install all modules for AntamScript.
bun install --frozen-lockfile

# Build the project to dist.
bun run scripts/fnLoader.ts
bun run build

# Format and check with Biome.
bun run check
bun run format

# Type check with TypeScript.
bun run typecheck
```

### 👷 Maintainers

| Maintainers | Roles              |
| ----------- | ------------------ |
| ariel-aram  | Founder/Leader     |
| adidotzip   | Frontend Developer |
| user-lezi   | Backend Developer  |
| Kino7916    | Backend Developer  |

## ⚖️ License

This project is licensed under the terms of the **Apache-2.0** license.

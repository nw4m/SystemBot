# EL MOSHAKES Bot

Discord moderation bot built with discord.js v14, with a web dashboard for managing settings and permissions.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

| Variable              | Description                                    |
|-----------------------|------------------------------------------------|
| `TOKEN`               | Discord bot token                              |
| `CLIENT_ID`           | Bot Application ID                             |
| `GUILD_ID`            | Your server ID                                 |
| `PREFIX`              | Command prefix (default `!`)                   |
| `DASHBOARD_PORT`      | Dashboard port (default `3000`)                |
| `DASHBOARD_SECRET`    | Random secret string for session encryption    |
| `DASHBOARD_USERNAME`  | Dashboard login username                       |
| `DASHBOARD_PASSWORD`  | Dashboard login password                       |

### 3. Start

```bash
node index.js
```

This starts both the bot and the dashboard at the same time.

Dashboard: `http://localhost:<DASHBOARD_PORT>`

---

## Commands

### Moderation

| Command | Aliases |
|---------|---------|
| `!ban` | نكح, تف, سيف, إعدام, اعدم, تقليع, تفنيش, تلطيش, كربج, ban |
| `!unban` | إفراج, افراج, اعفاء, unban |
| `!kick` | برا, بره, اطرد, kick |
| `!mute` | اسكت, اخرس, اكتم, mute |
| `!unmute` | اتكلم, unmute |
| `!timeout` | تأديب, تاديب, نام, timeout |
| `!untimeout` | اصحى, اتايب, untimeout |
| `!warn` | w |
| `!warnings` | warns, listwarns |
| `!clearwarnings` | cw, clearwarns |
| `!nickname` | nick, n, setnick, #nick, اسم, nickname |
| `!purge` | clear, c, prune, نظف, تنظيف |
| `!lock` | lk, قفل, lock |
| `!unlock` | ulk, فك, افتحه, unlock |
| `!slowmode` | sm |
| `!channelinfo` | ci, channelinfo |
| `!roleadd` | ra, خد, حط, give |
| `!roleremove` | rr, شيل, هات, remove |
| `!role` | r |

### Utility

| Command | Aliases |
|---------|---------|
| `!ping` | pong |
| `!help` | h, commands |
| `!userinfo` | ui, whois |
| `!serverinfo` | si, guildinfo |
| `!avatar` | av, pfp |
| `!botinfo` | bi, info |
| `!afk` | away |
| `!خط` | khat, line |

---

## Permissions System

- **Roles configured in dashboard** — only members with that role can use the command.
- **No roles configured (empty)** — falls back to Discord's native permissions (e.g. `!ban` requires `Ban Members`).
- **Administrators** always bypass all permission checks.
- **Denied users** — bot stays completely silent, no response.

### Discord Permission Defaults

| Command | Required Discord Permission |
|---------|----------------------------|
| ban, unban | Ban Members |
| kick | Kick Members |
| mute, unmute, timeout, untimeout, warn, warnings, clearwarnings | Moderate Members |
| nickname | Manage Nicknames |
| purge | Manage Messages |
| lock, unlock, slowmode | Manage Channels |
| roleadd, roleremove | Manage Roles |
| ping, help, userinfo, serverinfo, avatar, botinfo, afk, خط | Everyone |

---

## Dashboard Pages

| Page | URL | Description |
|------|-----|-------------|
| Overview | `/dashboard` | Bot status, server info, container stats |
| Moderators | `/members` | Members with mod permissions and their allowed commands |
| Command Logs | `/logs` | Log of every command used — who, when, where, result |
| Settings | `/settings` | Prefix, embed color, per-command role permissions, `!خط` message |
| Warnings | `/warnings` | View and clear member warnings |

---

## Project Structure

```
├── index.js                    # Bot entry point + dashboard launcher
├── config.json                 # Default config (copied to data/ on first run)
├── .env                        # Environment variables
├── commands/
│   ├── moderation/             # ban, kick, mute, timeout, warn, lock...
│   └── utility/                # ping, help, userinfo, afk, خط...
├── utils/
│   ├── embedBuilder.js         # Embed builder (color #fd6868)
│   ├── permissionCheck.js      # Role-based permission checker
│   └── logger.js               # Command execution logger
├── data/
│   ├── config.json             # Live config (writable)
│   └── logs.json               # Command logs
└── dashboard/
    ├── server.js               # Express dashboard server
    ├── public/style.css        # Dashboard CSS
    └── views/                  # EJS templates
```

---

## Required Bot Permissions

- Administrator (recommended), or:
- Ban Members, Kick Members, Moderate Members
- Manage Messages, Manage Channels, Manage Roles, Manage Nicknames
- Send Messages, Embed Links, Read Message History

The bot's role must be **higher** than any role it manages in the hierarchy.

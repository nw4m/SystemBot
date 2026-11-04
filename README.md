# Discord Moderation Bot

A full-featured Discord moderation bot built with **discord.js v14**, with embed responses styled in `#fd6868` and a web dashboard for managing settings and role permissions.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
copy .env.example .env
```

| Variable             | Description                                      |
|----------------------|--------------------------------------------------|
| `TOKEN`              | Your Discord bot token                           |
| `CLIENT_ID`          | Your bot's Application/Client ID                 |
| `GUILD_ID`           | Your server ID                                   |
| `PREFIX`             | Command prefix (default `!`)                     |
| `DASHBOARD_PORT`     | Port for the web dashboard (default `3000`)      |
| `DASHBOARD_SECRET`   | Random secret string for session encryption      |
| `DASHBOARD_USERNAME` | Dashboard login username                         |
| `DASHBOARD_PASSWORD` | Dashboard login password                         |

### 3. Start the bot

```bash
node index.js
```

### 4. Start the dashboard

In a separate terminal:

```bash
node dashboard/server.js
```

Then open `http://localhost:3000` in your browser.

---

## Commands

### Moderation

| Command          | Aliases                              | Description                        |
|------------------|--------------------------------------|------------------------------------|
| `!ban`           | نكج, تف, سيف, اعدم, تقنيش, كريج      | Ban a member                       |
| `!unban`         | افراج, اقراج, اعفاء                   | Unban a user by ID                 |
| `!kick`          | بار, برد, اطرد                        | Kick a member                      |
| `!mute`          | اكم, اخرس                             | Mute a member (28-day timeout)     |
| `!unmute`        | اتكلم                                | Unmute a member                    |
| `!timeout`       | تأديب, نام                            | Timeout with duration (1m, 1h, 1d) |
| `!untimeout`     | اصحى, اتايب                           | Remove timeout                     |
| `!warn`          | w                                    | Warn a member                      |
| `!warnings`      | warns, listwarns                     | List member warnings               |
| `!clearwarnings` | cw, clearwarns                       | Clear all warnings                 |
| `!nickname`      | nick, n, setnick, اسم                 | Change/reset nickname              |
| `!purge`         | clear, c, prune, نظف                  | Delete messages (1-100)            |
| `!lock`          | lk, قفل                               | Lock a channel                     |
| `!unlock`        | ulk, افتح                             | Unlock a channel                   |
| `!slowmode`      | sm                                   | Set channel slowmode               |

### Utility

| Command        | Aliases              | Description              |
|----------------|----------------------|--------------------------|
| `!ping`        | pong                 | Bot latency              |
| `!help`        | h, commands          | Show all commands        |
| `!userinfo`    | ui, whois            | User information         |
| `!serverinfo`  | si, guildinfo        | Server information       |
| `!avatar`      | av, pfp              | Show user avatar         |
| `!botinfo`     | bi, info             | Bot information          |
| `!afk`         | away                 | Set AFK status           |
| `!channelinfo` | ci                   | Channel information      |
| `!roleadd`     | ra, خد, give         | Add role to member       |
| `!roleremove`  | rr, هات, شيل, remove  | Remove role from member  |
| `!role`        | r                    | Role information         |

---

## Role Permissions

Each command can be restricted to specific roles via the **dashboard**.

- Go to `http://localhost:3000` and log in
- Navigate to **Settings**
- For each command, enter the **Role IDs** (one per line or comma-separated) that are allowed to use it
- Leave blank = everyone can use the command
- Server **Administrators** always bypass permission checks
- If a user without the required role tries to use a restricted command, **the bot will not respond at all**

### How to get a Role ID

In Discord: `Server Settings > Roles > Right-click role > Copy ID`
(You need Developer Mode enabled: `User Settings > Advanced > Developer Mode`)

---

## Dashboard

| Page       | URL                         | Description                          |
|------------|-----------------------------|--------------------------------------|
| Login      | `/login`                    | Sign in with username + password     |
| Overview   | `/dashboard`                | Stats: commands, warnings, prefix    |
| Settings   | `/settings`                 | Change prefix, color, role perms     |
| Warnings   | `/warnings`                 | View and clear member warnings       |

---

## Project Structure

```
EL MOSHAKES/
├── index.js                    # Bot entry point
├── config.json                 # Bot config + warnings data
├── .env                        # Environment variables (DO NOT SHARE)
├── .env.example                # Template for .env
├── package.json
├── commands/
│   ├── moderation/             # Ban, kick, mute, warn, lock...
│   └── utility/                # Ping, help, userinfo, afk...
├── utils/
│   ├── embedBuilder.js         # Embed builder (#fd6868 color)
│   └── permissionCheck.js      # Role-based permission checker
└── dashboard/
    ├── server.js               # Express dashboard server
    ├── public/
    │   └── style.css           # Dark theme dashboard CSS
    └── views/
        ├── login.ejs
        ├── dashboard.ejs
        ├── settings.ejs
        ├── warnings.ejs
        └── partials/
            └── sidebar.ejs
```

---

## Required Bot Permissions

When inviting the bot, make sure it has:

- Administrator (recommended), OR manually:
- Ban Members
- Kick Members
- Moderate Members (for timeout)
- Manage Nicknames
- Manage Messages (for purge)
- Manage Channels (for lock/unlock/slowmode)
- Manage Roles (for roleadd/roleremove)
- Send Messages, Embed Links, Read Message History

**Important:** The bot's role must be **higher** than the roles it manages in the role hierarchy.

const configStore = require('./configStore');

const DISCORD_PERM_DEFAULTS = {
  ban:           'BanMembers',
  unban:         'BanMembers',
  kick:          'KickMembers',
  mute:          'ModerateMembers',
  unmute:        'ModerateMembers',
  timeout:       'ModerateMembers',
  untimeout:     'ModerateMembers',
  warn:          'ModerateMembers',
  warnings:      'ModerateMembers',
  clearwarnings: 'ModerateMembers',
  nickname:      'ManageNicknames',
  purge:         'ManageMessages',
  lock:          'ManageChannels',
  unlock:        'ManageChannels',
  slowmode:      'ManageChannels',
  roleadd:       'ManageRoles',
  roleremove:    'ManageRoles',
};

async function hasPermission(message, commandName, client) {
  const config       = configStore.read();
  const allowedRoles = config.permissions?.[commandName] ?? [];
  const member       = message.member;

  if (!member) return false;
  if (member.permissions.has('Administrator')) return true;

  if (allowedRoles.length > 0) {
    return allowedRoles.some(roleId => member.roles.cache.has(roleId));
  }

  const requiredPerm = DISCORD_PERM_DEFAULTS[commandName];
  if (requiredPerm) {
    return member.permissions.has(requiredPerm);
  }

  return true;
}

module.exports = { hasPermission, DISCORD_PERM_DEFAULTS };

// صلاحيات ديسكورد الافتراضية لكل أمر خطير
// لو القائمة فاضية، البوت بيتحقق من الصلاحية دي بدل ما يسمح لأي حد
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

/**
 * بيتحقق إن العضو عنده صلاحية تشغيل الأمر.
 *
 * الترتيب:
 *  1. Administrator دايماً يعدي
 *  2. لو في Role IDs في الإعدادات — يتحقق من الرول بس
 *  3. لو القائمة فاضية على أمر خطير — يتحقق من صلاحية ديسكورد الأصلية
 *  4. لو القائمة فاضية على أمر عادي (ping, help...) — مسموح لأي حد
 *  5. لو محدش انطبق عليه — البوت صامت تماماً
 */
async function hasPermission(message, commandName, client) {
  const config       = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../data/config.json'), 'utf8'));
  const allowedRoles = config.permissions?.[commandName] ?? [];

  const member = message.member;
  if (!member) return false;

  // الأدمن دايماً يعدي
  if (member.permissions.has('Administrator')) return true;

  // لو في رولات محددة — تحقق منها بس
  if (allowedRoles.length > 0) {
    return allowedRoles.some(roleId => member.roles.cache.has(roleId));
  }

  // القائمة فاضية — رجوع لصلاحيات ديسكورد الافتراضية للأوامر الخطيرة
  const requiredPerm = DISCORD_PERM_DEFAULTS[commandName];
  if (requiredPerm) {
    return member.permissions.has(requiredPerm);
  }

  // أمر عادي زي ping/help — مسموح لأي حد
  return true;
}

module.exports = { hasPermission, DISCORD_PERM_DEFAULTS };

function formatRunningTime(dbTime) {
  if (!dbTime) return '';
  // dbTime looks like "HH:MM:SS"
  return dbTime.substring(3, 5) + ':' + dbTime.substring(6, 8);
}

module.exports = { formatRunningTime };
const fs = require('fs');
const path = require('path');

function getResetPasswordTemplate(resetLink) {
  const templatePath = path.join(__dirname, 'reset-password.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  html = html.replace(/<%= resetLink %>/g, resetLink); // inject the dynamic link

  return html;
}

module.exports = getResetPasswordTemplate;
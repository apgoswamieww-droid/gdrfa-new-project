const path = require('path');

const CATEGORIES = {
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
    mimeTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
    ],
    magicNumbers: [
      { offset: 0, bytes: [0xFF, 0xD8, 0xFF] },
      { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47] },
      { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] },
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
      { offset: 0, bytes: [0x42, 0x4D] },
    ],
  },
  video: {
    extensions: ['.mp4', '.webm', '.ogg', '.mov', '.avi'],
    mimeTypes: [
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
      'application/octet-stream',
    ],
    magicNumbers: [],
  },
  pdf: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    magicNumbers: [
      { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] },
    ],
  },
  document: {
    extensions: ['.doc', '.docx'],
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    magicNumbers: [],
  },
  spreadsheet: {
    extensions: ['.xls', '.xlsx'],
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    magicNumbers: [],
  },
  presentation: {
    extensions: ['.ppt', '.pptx'],
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    magicNumbers: [],
  },
};

const DANGEROUS_EXTENSIONS = [
  '.html', '.htm', '.shtml', '.dhtml',
  '.svg', '.svgz',
  '.xml', '.xhtml',
  '.js', '.jsx', '.mjs', '.cjs',
  '.ts', '.tsx',
  '.php', '.php3', '.php4', '.php5', '.phtml',
  '.asp', '.aspx', '.asa', '.ascx',
  '.jsp', '.jspx', '.jsw', '.jsv',
  '.cfm', '.cfc',
  '.py', '.pyc', '.pyo',
  '.rb', '.rhtml',
  '.sh', '.bash', '.zsh', '.ksh',
  '.bat', '.cmd',
  '.exe', '.com', '.dll', '.so', '.dylib',
  '.msi', '.msp',
  '.vbs', '.vba', '.wsf',
  '.ps1', '.psm1', '.psd1',
  '.pl', '.pm',
  '.cgi', '.war', '.jar',
  '.lnk', '.scf',
  '.swf',
];

const CATEGORY_MAP = {
  image: ['image'],
  video: ['video'],
  imageVideo: ['image', 'video'],
  media: ['image', 'video', 'pdf', 'document', 'spreadsheet', 'presentation'],
};

function resolveExtensions(categoryNames) {
  const exts = new Set();
  for (const name of categoryNames) {
    const cats = CATEGORY_MAP[name] || [name];
    for (const cat of cats) {
      const def = CATEGORIES[cat];
      if (def) {
        for (const ext of def.extensions) exts.add(ext);
      }
    }
  }
  return [...exts];
}

function resolveMimeTypes(categoryNames) {
  const types = new Set();
  for (const name of categoryNames) {
    const cats = CATEGORY_MAP[name] || [name];
    for (const cat of cats) {
      const def = CATEGORIES[cat];
      if (def) {
        for (const mt of def.mimeTypes) types.add(mt);
      }
    }
  }
  return [...types];
}

function isDangerousExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  return DANGEROUS_EXTENSIONS.includes(ext);
}

module.exports = {
  CATEGORIES,
  DANGEROUS_EXTENSIONS,
  CATEGORY_MAP,
  resolveExtensions,
  resolveMimeTypes,
  isDangerousExtension,
};

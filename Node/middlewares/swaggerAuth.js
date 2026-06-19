const basicAuth = require('basic-auth');
const crypto = require('crypto');

// Configuration - you can move these to environment variables
const SWAGGER_CREDENTIALS = {
  email: process.env.SWAGGER_EMAIL || 'admin@gdrfa.ae',
  password: process.env.SWAGGER_PASSWORD || 'SwaggerGDRFA@2025'
};

/**
 * Basic Authentication middleware for Swagger documentation
 * Protects /api-docs endpoint with email/password
 */
function swaggerAuth(req, res, next) {
  // Get credentials from Authorization header
  const credentials = basicAuth(req);
  
  // Check if credentials are provided
  if (!credentials) {
    return requestAuth(res);
  }
  
  // Validate credentials
  const isValidEmail = credentials.name === SWAGGER_CREDENTIALS.email;
  const isValidPassword = credentials.pass === SWAGGER_CREDENTIALS.password;
  
  if (isValidEmail && isValidPassword) {
    // Authentication successful
    console.log(`✅ Swagger access granted to: ${credentials.name} at ${new Date().toISOString()}`);
    return next();
  } else {
    // Authentication failed
    console.log(`❌ Swagger access denied for: ${credentials.name || 'unknown'} at ${new Date().toISOString()}`);
    return requestAuth(res);
  }
}

/**
 * Send 401 Unauthorized response with authentication challenge
 */
function requestAuth(res) {
  res.set('WWW-Authenticate', 'Basic realm="GDRFA API Documentation"');
  res.status(401).json({
    error: 'Authentication required',
    message: 'Please provide valid email and password to access API documentation',
    hint: 'Use your GDRFA credentials to access the Swagger documentation'
  });
}

/**
 * Alternative form-based authentication (if you prefer a login form)
 */
function createSwaggerLoginForm() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>GDRFA API Documentation - Login</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .login-container {
                background: white;
                padding: 2rem;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
            }
            .logo {
                text-align: center;
                margin-bottom: 2rem;
            }
            .logo h1 {
                color: #333;
                margin: 0;
            }
            .logo p {
                color: #666;
                margin: 5px 0 0 0;
            }
            .form-group {
                margin-bottom: 1rem;
            }
            label {
                display: block;
                margin-bottom: 5px;
                color: #333;
                font-weight: bold;
            }
            input[type="email"],
            input[type="password"] {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
                box-sizing: border-box;
            }
            input[type="email"]:focus,
            input[type="password"]:focus {
                outline: none;
                border-color: #667eea;
            }
            .btn {
                width: 100%;
                padding: 12px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.3s;
            }
            .btn:hover {
                background: #5a6fd8;
            }
            .error {
                color: #e74c3c;
                margin-bottom: 1rem;
                text-align: center;
            }
            .info {
                background: #ecf0f1;
                padding: 15px;
                border-radius: 5px;
                margin-top: 1rem;
                font-size: 14px;
                color: #7f8c8d;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="logo">
                <h1>🔐 GDRFA API</h1>
                <p>Documentation Access</p>
            </div>
            <form method="POST" action="/api-docs/login">
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required placeholder="Enter your password">
                </div>
                <button type="submit" class="btn">Access Documentation</button>
            </form>
            <div class="info">
                <strong>Note:</strong> Use your authorized GDRFA credentials to access the API documentation.
            </div>
        </div>
    </body>
    </html>
  `;
}

module.exports = {
  swaggerAuth,
  SWAGGER_CREDENTIALS,
  createSwaggerLoginForm
};
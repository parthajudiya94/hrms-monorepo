# HRMS Web Frontend

React-based frontend for the HRMS application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Troubleshooting

### If the app doesn't start:

1. **Check if dependencies are installed:**
   ```bash
   npm install
   ```

2. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
   On Windows:
   ```bash
   rmdir /s /q node_modules
   del package-lock.json
   npm install
   ```

3. **Check Node.js version:**
   - Should be Node.js 18 or higher
   - Check with: `node --version`

4. **Check for port conflicts:**
   - Make sure port 3000 is not in use
   - You can change the port by setting `PORT=3001` in environment

5. **Common errors:**
   - **OpenSSL error**: Already fixed with `--openssl-legacy-provider` flag
   - **Module not found**: Run `npm install` again
   - **Port already in use**: Kill the process using port 3000 or use a different port

## Environment Variables

Create a `.env` file in the `packages/web` directory (optional):

```env
REACT_APP_API_URL=http://localhost:3001/api
PORT=3000
```

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve to backend/uploads (one level up from scripts/)
const dir = path.resolve(__dirname, '..', 'uploads');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log('Created uploads directory at', dir);
} else {
  console.log('uploads directory already exists at', dir);
}

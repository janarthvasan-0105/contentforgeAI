const fs = require('fs');
const path = require('path');

const sourceDir = path.join('d:', 'ContentForge', 'ezgif-8dff4e17179a0769-jpg');
const targetDir = path.join(__dirname, 'public', 'frames');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Read files from source directory
const files = fs.readdirSync(sourceDir).filter(f => f.startsWith('ezgif-frame-') && f.endsWith('.jpg'));

// Sort files to ensure correct order
files.sort((a, b) => {
  const numA = parseInt(a.replace('ezgif-frame-', '').replace('.jpg', ''), 10);
  const numB = parseInt(b.replace('ezgif-frame-', '').replace('.jpg', ''), 10);
  return numA - numB;
});

console.log(`Found ${files.length} frames. Copying to public/frames...`);

let copied = 0;
files.forEach((file, index) => {
  const sourcePath = path.join(sourceDir, file);
  // Rename to frame-001.jpg, frame-002.jpg, etc. (1-indexed)
  const newName = `frame-${String(index + 1).padStart(3, '0')}.jpg`;
  const targetPath = path.join(targetDir, newName);
  
  fs.copyFileSync(sourcePath, targetPath);
  copied++;
  if (copied % 50 === 0) {
    console.log(`Copied ${copied} / ${files.length} frames...`);
  }
});

console.log(`✅ Successfully copied and renamed ${copied} frames to frontend/public/frames/`);

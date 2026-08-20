const fs = require('fs');
const path = require('path');

const sourceDir = 'D:\\ContentForge\\new_frame';
const destDir = 'D:\\ContentForge\\frontend\\public\\frames';

// Ensure destination exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Get all files
const files = fs.readdirSync(sourceDir);

// Filter and copy
let count = 0;
for (const file of files) {
  // Match files like "ezgif-frame-001.jpg" and ignore "- Copy.jpg"
  const match = file.match(/^ezgif-frame-(\d{3})\.jpg$/);
  if (match) {
    const frameNum = match[1];
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, `frame-${frameNum}.jpg`);
    
    // Copy file
    fs.copyFileSync(sourcePath, destPath);
    count++;
  }
}

console.log(`Successfully copied ${count} frames.`);

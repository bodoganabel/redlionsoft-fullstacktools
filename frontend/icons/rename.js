const fs = require('fs');
const path = require('path');

const dir = './';

fs.readdirSync(dir).forEach(file => {
  const filePath = path.join(dir, file);
  const stats = fs.statSync(filePath);

  if (stats.isFile() && file.includes('Icon')) {
    let newFileName = file.replace('Icon', '');
    newFileName = `Icon${newFileName}`;
    
    const newFilePath = path.join(dir, newFileName);
    fs.renameSync(filePath, newFilePath);
    console.log(`Renamed ${filePath} to ${newFilePath}`);
}
});

// If you are running this script, you probably need to run it with sudo privileges to be able to rename all the files.
// Run the following command in your terminal:
// sudo node rename.js
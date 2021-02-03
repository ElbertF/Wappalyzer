const fs = require('fs')
const path = require('path')
const { convertFile } = require('convert-svg-to-png')

const appPaths = () => {
  const fileDir = path.dirname(require.main.filename).split('/')
  // Remove current bin directory
  fileDir.pop()
  const appDir = fileDir.join('/')

  return {
    basePath: fileDir,
    appPath: appDir,
    iconPath: appDir + '/src/drivers/webextension/images/icons',
    convertPath: appDir + '/src/drivers/webextension/images/icons/converted',
  }
}

/**
 * Copy files from source to destination.
 * @param source
 * @param destination
 */
function copyFiles(source, destination) {
  // File destination will be created or overwritten by default.
  fs.copyFileSync(source, destination)
  // console.log(`${source} -> ${destination}`)
}

/**
 * Get extension of image file.
 * @returns {string}
 */
function getFileExtension(filePath) {
  return path.extname(filePath)
}

/**
 * Get base name of image file.
 * @returns {string}
 */
function getFileName(filePath) {
  return path.basename(filePath, getFileExtension(filePath))
}

function getConvertFileName(filePath) {
  const name = getFileName(filePath)
  return `${appPaths().convertPath}/${name}.png`
}

/**
 * Check if converted image exists
 * @returns {boolean}
 */
function checkFileExists(imagePath) {
  const fileExists = fs.existsSync(imagePath)
  return fileExists
}

function checkIfFile(filePath) {
  return fs.statSync(filePath).isFile()
}

function diffFiles(fileOne, fileTwo) {
  const f1 = fs.readFileSync(fileOne)
  const f2 = fs.readFileSync(fileTwo)
  return f1.equals(f2)
}

function dateModified(file) {
  return fs.statSync(file).mtime
}

function dateDiff(file) {
  const now = new Date().getTime()
  const then = dateModified(file).getTime()
  return Math.round(Math.abs((then - now) / 86400000))
}

// Main script
fs.readdirSync(appPaths().iconPath).forEach((fileName) => {
  const image = {
    id: fileName,
    path: `${appPaths().iconPath}/${fileName}`,
    convertPath: `${appPaths().convertPath}/${fileName}`,
    async convertAndCopy() {
      await convertFile(this.path, {
        height: 32,
        width: 32,
        outputFilePath: this.convertPath,
      }).then((outputFile) => {
        console.log(`SVG Converted: ${outputFile}`)
      })
    },
    processFile() {
      // Setup variables.
      const ext = getFileExtension(this.path)

      // If SVG, run checks.
      if (ext === '.svg') {
        // Check if converted file exists.
        const convertFilePath = getConvertFileName(this.path)
        if (checkFileExists(convertFilePath)) {
          // If file has changed in past 7 days.
          if (dateDiff(this.path) > 8) {
            console.log(`File exists, skipping: ${this.id}`)
            return null
          }
        }
        // Convert and copy file.
        this.convertAndCopy()
      } else {
        // If PNG or other, just copy the file as-is.
        // eslint-disable-next-line no-lonely-if
        if (checkIfFile(this.path)) {
          copyFiles(this.path, this.convertPath)
        } else {
          console.info('Not a file, skipping...')
        }
      }
    },
  }

  image.processFile()
})

/**

cd  ; cp *.svg converted ; cd converted ; convert-svg-to-png *.svg --width 32 --height 32 ; rm *.svg
(async() => {
  const inputFilePath = '/path/to/my-image.svg';
  const outputFilePath = await convertFile(inputFilePath);

  console.log(outputFilePath);
  //=> "/path/to/my-image.png"
})();
*/

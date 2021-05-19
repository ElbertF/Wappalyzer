const fs = require('fs')
const path = require('path')
const { createConverter } = require('convert-svg-to-png')

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

const converter = createConverter()

;(async () => {
  // Main script
  const files = fs.readdirSync(appPaths().iconPath)

  const totalFiles = files.length

  do {
    await Promise.all(
      files.splice(0, 50).map(async (fileName) => {
        const image = {
          id: fileName,
          path: `${appPaths().iconPath}/${fileName}`,
          convertPath: `${appPaths().convertPath}/${fileName}`,
          async convertAndCopy() {
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                await converter
                  .convertFile(this.path, {
                    height: 32,
                    width: 32,
                    outputFilePath: this.convertPath,
                  })
                  .catch((error) => {
                    throw new Error(`${error} (${fileName})`)
                  })
              } catch (error) {
                if (attempt >= 3) {
                  throw error
                } else {
                  await new Promise((resolve) =>
                    setTimeout(resolve, 500 * attempt)
                  )
                }
              }

              break
            }
          },
          async processFile() {
            // Setup variables.
            const ext = getFileExtension(this.path)

            // If SVG, run checks.
            if (ext === '.svg') {
              // Check if converted file exists.
              const convertFilePath = getConvertFileName(this.path)
              if (checkFileExists(convertFilePath)) {
                // If file has changed in past 7 days.
                if (dateDiff(this.path) > 8) {
                  return null
                }
              }
              // Convert and copy file.
              await this.convertAndCopy()
            } else {
              // If PNG or other, just copy the file as-is.
              // eslint-disable-next-line no-lonely-if
              if (checkIfFile(this.path)) {
                copyFiles(this.path, this.convertPath)
              }
            }
          },
        }

        await image.processFile()
      })
    )

    console.log(`${100 - Math.round((100 / totalFiles) * files.length)}%`)
  } while (files.length)

  await converter.destroy()

  console.log(`Converted ${totalFiles.toLocaleString()} files.`)

  process.exit()
})()

/**

cd  ; cp *.svg converted ; cd converted ; convert-svg-to-png *.svg --width 32 --height 32 ; rm *.svg
(async() => {
  const inputFilePath = '/path/to/my-image.svg';
  const outputFilePath = await convertFile(inputFilePath);

  console.log(outputFilePath);
  //=> "/path/to/my-image.png"
})();
*/

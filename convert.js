const child_process = require("child_process");
const fs = require("fs");
const path = require("path");

async function convertOpusToAac(opusFilepath, aacFilepath) {
  return new Promise((resolve, reject) => {
    // Read Opus file's bitrate using ffprobe
    /*const opusInfoProcess = child_process.spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "a:0",
      "-show_entries",
      "stream=bit_rate",
      "-of",
      "default=noprint_wrappers=1",
      opusFilepath,
    ]);
    let opusBitrate;
    opusInfoProcess.stdout.on("data", data => {
      console.log(data.toString());
      opusBitrate = parseFloat(data.toString().trim()) / 1000;
      console.log("Opus bitrate:", opusBitrate, "kbps");
    });

    // Handle errors while reading Opus bitrate
    opusInfoProcess.stderr.on("data", data => {
      reject(`Error while trying to read Opus file's bitrate: ${data}`);
    });*/
    const opus = child_process
      .spawnSync("ffprobe", [opusFilepath])
      .stderr.toString();
    const match = opus.match(/bitrate: ([\d\.]+) kb\/s/);

    if (!match) {
      reject(opus);
      return;
    }

    const substr = opusFilepath.substring(0, 24);
    const bitrate = parseFloat(match[1]);
    console.log(`${substr} bitrate: ${bitrate}kbps`);

    // Convert Opus file to AAC using ffmpeg
    const conversionProcess = child_process.spawn("ffmpeg", [
      "-i",
      opusFilepath,
      "-strict",
      "-2",
      "-c:a",
      "aac",
      "-b:a",
      `${bitrate.toFixed(2)}k`,
      aacFilepath,
    ]);

    // Log all output from ffmpeg in real-time
    conversionProcess.stdout.on("data", data => {
      console.log(data.toString());
    });

    conversionProcess.stderr.on("data", data => {
      const d = data.toString();
      if (!/time=[\d:\.]+/.test(d) || Math.random() * 5 > 4)
        console.error(`${substr}: ${d}`);
    });

    // Resolve promise when conversion process exits successfully
    conversionProcess.on("close", code => {
      if (code === 0) {
        resolve();
      } else {
        reject(`ffmpeg exited with status code ${code}`);
      }
    });

    // Handle errors while converting file using ffmpeg
    conversionProcess.on("error", err => {
      reject(`Error while converting file using ffmpeg: ${err}`);
    });
  });
}

// // Example usage
// const opusFilepath = "THE WORLD WE LIVE IN 星 - 壊​れ​た​魂 [M2DSwU5OynU].opus";
// const aacFilepath =
//   "aac/THE WORLD WE LIVE IN 星 - 壊​れ​た​魂 [M2DSwU5OynU].aac";

// convertOpusToAac(opusFilepath, aacFilepath)
//   .then(() => {
//     console.log("Conversion completed successfully");
//   })
//   .catch(err => {
//     console.error(`Error during conversion: ${err}`);
//   });
const opusDir = "."; // replace with the actual directory path
const aacDir = path.join(opusDir, "aac");

// Create the "aac" directory if it doesn't exist
if (!fs.existsSync(aacDir)) {
  fs.mkdirSync(aacDir);
}

// Get an array of all the .opus files in the directory
const opusFiles = fs
  .readdirSync(opusDir)
  .filter(file => path.extname(file) === ".opus");

// Convert each Opus file to AAC using the convertOpusToAac function
Promise.all(
  opusFiles.map(filename => {
    const opusPath = path.join(opusDir, filename);
    const aacPath = path.join(aacDir, path.parse(filename).name + ".aac");
    return convertOpusToAac(opusPath, aacPath);
  })
)
  .then(() => {
    console.log(
      `All ${opusFiles.length} Opus files converted to AAC successfully`
    );
  })
  .catch(err => {
    console.error(`Error during conversion: ${err}`);
  });

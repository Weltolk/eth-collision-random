const axios = require("axios");
const fs = require("fs");

const DEVICE_NAME = process.env.DEVICE_NAME ? process.env.DEVICE_NAME + ": \n" : process.env.DEVICE_NAME
const SLEEP_TIME = process.env.SLEEP_TIME ? process.env.SLEEP_TIME : 60 * 60
const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
if (!TELEGRAM_API_KEY || !TELEGRAM_CHAT_ID) {
  console.error("Please set TELEGRAM_API_KEY and TELEGRAM_CHAT_ID environment variables");
  process.exit(1);
}
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage`;

const FILE_PREFIX = "random";                                                                                                         
const YES_FILENAME = `yes-${FILE_PREFIX}.txt`;                                                                                        
const NO_FILENAME = `no-${FILE_PREFIX}.txt`;                                                                                          
const ERR_FILENAME = `err-${FILE_PREFIX}.txt`;

async function sendMessageViaTelegram(message) {
  try {
    await axios.post(TELEGRAM_API_URL, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    });
  } catch (error) {
    console.error("Failed to send message via Telegram:", error.message);
  }
}

function readCountFromFile(filePath) {
  try {
    return parseInt(fs.readFileSync(filePath, 'utf8'), 10);
  } catch (error) {
    return 0;  // If the file doesn't exist or there's any other error, return 0
  }
}

async function reportCounts() {
  try {
    const noCount = readCountFromFile(NO_FILENAME);
    const yesCount = await countLinesInFile(YES_FILENAME);  // We still count lines for "yes" because it contains detailed records
    const errCount = readCountFromFile(ERR_FILENAME);

    const reportMessage = `${DEVICE_NAME}No: ${noCount}\nYes: ${yesCount}\nErr: ${errCount}`;
    await sendMessageViaTelegram(reportMessage);
  } catch (error) {
    console.error("Error reporting counts:", error.message);
  }
}

function countLinesInFile(filePath) {
  return new Promise((resolve) => {
    let lineCount = 0;

    fs.createReadStream(filePath)
      .on("data", (chunk) => {
        for (let byte of chunk) {
          if (byte === 10) lineCount++;
        }
      })
      .on("end", () => resolve(lineCount))
      .on("error", () => resolve(0));
  });
}

reportCounts();
setInterval(reportCounts, SLEEP_TIME * 1000);

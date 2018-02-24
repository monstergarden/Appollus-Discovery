'use strict';



var crawlerParameters = {
    maxFanCount :500,
    maxFollowersCount : 500
}


const evaluater = require('./evaluater');
const crawler = require('./crawler');
const readline = require('readline');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});




function readLineAsync(message) {
    return new Promise((resolve, reject) => {
      rl.question(message, (answer) => {
        resolve(answer);
      });
    });
  } 

function logCyan(text) {
    console.log("\x1b[36m%s\x1b[0m", text)   
}
function logSuccess(text) {
    console.log("\x1b[32m%s\x1b[0m", text)   
}

 async function main() {
   
    const rootUserId = await readLineAsync("Enter userID you want to find similiar users to:")
    crawlerParameters.rootFolder = `data/${rootUserId}`
    crawlerParameters.fansFollowingFolder = `data/${rootUserId}/FansFollowing`

    try {
        logCyan("\nSTEP 1 - Executing crawler ...")
        await crawler.crawl(rootUserId, crawlerParameters)
    } catch (error) {
        console.log(error);    
    }

    await sleep(1000)
    logCyan("\nSTEP 2 - evaluateToDisk crawled data")
    
    const resultPath = `data/similarTo_${rootUserId}.json`
    
    evaluater.evaluateToDisk(resultPath, crawlerParameters.fansFollowingFolder)

    // console.log("find high LPS - Not implemented yet")
    logSuccess("\n- Finished - ");
    console.log(`Output: ${resultPath}`);
    process.exit()
}

main()



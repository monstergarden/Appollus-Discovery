
const liveme = require("./node_modules/liveme-api/index.js")
const fs = require('fs');
const path = require('path');


async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}
async function asyncForEachParallel(array, callback) {
    var tasks = []
    for (let index = 0; index < array.length; index++) {
        tasks.push(callback(array[index], index, array))
    }
    await Promise.all(tasks)
}

async function writeFile(filename, content) {
    await fs.writeFile(filename, content, (error) => { 
        if(error)
            console.log(`Error: ${error}`) 
    });
}

function tryMakeDir(filepath) {
    var dirname = path.dirname(filepath);

    if (!fs.existsSync(filepath)) {
        fs.mkdirSync(filepath);
    }
}

function flatten(arr2Dim) {
    return arr2Dim.reduce(function (a, b) { return a.concat(b); });
}




function getFanUserIds(userid, page) {
    return liveme.getFans(userid, page, 100)
        .then(res => res.map(user => user.uid))
}
function getFollowingUserIds(userid, page) {
    return liveme.getFollowing(userid, page, 100)
        .then(res => res.map(user => user.uid))
}

async function getMultiplePages(fromPage, maxPage, action) {
    var again = true
    var all = []
    var currentPage = fromPage
    try {
        while (again) {
            var ids = await action(currentPage)
            if (ids.length == 0 || currentPage >= maxPage)
                again = false
            all.push(ids)
            currentPage++
        }
    } catch (error) {

    }

    return all
}


async function getFollowingToDisk(userId, fanUserId, fromPage, toPage, folder) {
    const following = await getMultiplePages(fromPage, toPage,
        async (page) => await getFollowingUserIds(fanUserId, page));
    const flattened = flatten(following)
    const jsonFile = `${folder}/${fanUserId}_${(fromPage - 1) * 100}-${toPage * 100}.json`
    await writeFile(jsonFile, JSON.stringify(flattened));
}



function maxCountToPageCount(maxCount) {
    return Math.max(1, maxCount / 100)
}

async function getFansAndFollowingToDisk(userId, param) {
    var toPage = maxCountToPageCount(param.maxFanCount)

    var fans = await getMultiplePages(1, toPage,
        async (page) => await getFanUserIds(userId, page));
    fans = flatten(fans)

    var jsonFile = `${param.rootFolder}/Fans_0-${toPage * 100}.json`
    writeFile(jsonFile, JSON.stringify(fans))

    var totalCount = fans.length
    var finished = 0
    var maxFollowersPage = maxCountToPageCount(param.maxFollowersCount)
    await asyncForEachParallel(fans, async (fan) => {
        try {
            await getFollowingToDisk(userId, fan, 1, maxFollowersPage, param.fansFollowingFolder)  
            finished++        
            console.log(`[${finished}|${totalCount}] Got followers of ${fan}`);
        } catch (error) {
            finished++
            console.log(`[${finished}|${totalCount}] Failed to get Followings of ${fan}`);
        }
    })
}



async function crawl(userId, param) {

    tryMakeDir("data")
    tryMakeDir(param.rootFolder)
    tryMakeDir(param.fansFollowingFolder)
    
    console.log("start crawling. This can take a while...")
    await getFansAndFollowingToDisk(userId, param);
    console.log('done crawling.')
}

module.exports = { crawl }






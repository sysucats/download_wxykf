const fs = require("node:fs");
const path = require("path");
const CloudBase = require("@cloudbase/manager-node");
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

// 读取配置
const confPath = './config.json';
var conf = null;
var storage = null;
async function readConfig() {
    var dirExists = await checkFileExists(confPath);
    if (!dirExists) {
        return false;
    }
    conf = JSON.parse(fs.readFileSync(confPath, 'utf-8'));
    storage = new CloudBase({
        secretId: conf.secretId,
        secretKey: conf.secretKey,
        envId: conf.envId, // 云开发环境ID，可在腾讯云云开发控制台获取
    }).storage;
    return true;
}


// 记录下载错误的次数
var download_err_count = 0;

async function downloadFile(item) {
    var file = item.Key;
    if (file.Size == 0 || file === undefined || file == "undefined") {
        return;
    }
    var save_path = path.resolve(`${conf.saveDir}/${file}`);
    try {
        await storage.downloadFile({
            cloudPath: file,
            localPath: save_path,
        });
    } catch (error) {
        if (error.code === 'ERR_INVALID_URL') {
            console.error(`[ERR] Download file "${file}" to "${save_path}"`);
            download_err_count++;
        }
    }
}

async function checkFileExists(filePath) {
    try {
        await fs.promises.access(filePath);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}

// 递归创建目录 同步方法
async function mkdirsSync(dirPath) {
    var dirExists = await checkFileExists(dirPath);
    if (dirExists) {
      return;
    }
    // 递归创建
    var base = path.dirname(dirPath);
    await mkdirsSync(base);
    try {
        await fs.promises.mkdir(dirPath);
    } catch (error) {
        if (error.code != "EEXIST") {
            throw error;
        }
    }
    return;
  }

async function checkFileExistsWithMkdir(filePath) {
    var base = await path.dirname(filePath);
    await mkdirsSync(base);
    return await checkFileExists(filePath);
}

async function downloadList(file, threadID) {
    var count = 0;
    for (let item of file) {
        // 检查文件是否存在
        var localPath = `${conf.saveDir}/${item.Key}`
        var fileExists = await checkFileExistsWithMkdir(localPath);

        count ++;
        var doneStr = `[thread-${threadID}] ${count}/${file.length} done, file: ${item.Key}`;
        if (fileExists) {
            console.log(doneStr);
            continue;
        }
        // 开始下载
        await downloadFile(item);
        console.log(doneStr);
    }
}

async function waitKey(text) {
    return new Promise((resolve, _) => {
        readline.question(text, key => {
            readline.close();
            resolve(key);
        });
    });
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return;
  }

async function main() {
    const readSuccess = await readConfig();
    if (!readSuccess) {
        await waitKey(`\n======== [ERROR] "${confPath}" not exist! Press "Enter" to exit. ========`);
        return false;
    }

    const allFiles = await storage.listDirectoryFiles("");
    console.log(allFiles);
    await fs.promises.writeFile('./file_list.json', JSON.stringify(allFiles));
    var step = parseInt(allFiles.length / conf.parallelNum);

    var pool = [];
    shuffle(allFiles);
    for (let i = 0; i < conf.parallelNum; i++) {
        pool.push(downloadList(allFiles.slice(i*step, (i+1)*step), i));
    }

    await Promise.all(pool);
    
    console.log(`All Donwload Done, err count: ${download_err_count}`);

    await waitKey(`\n======== Press "Enter" to exit. ========`);
}

try {
    main();
} catch (error) {
    console.log(error);
    waitKey(`\n======== Press "Enter" to exit. ========`);
}

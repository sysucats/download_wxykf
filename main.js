import { constants, promises } from 'node:fs';
import { parse, dirname, resolve } from 'path';
import CloudBase from "@cloudbase/manager-node";
import conf from "./config.js";

// 本地文件保存位置
const save_dir = "./save";

// 并行下载的个数
const ParallelNum = 10;

const { storage } = new CloudBase({
    secretId: conf.secretId,
    secretKey: conf.secretKey,
    envId: conf.envId, // 云开发环境ID，可在腾讯云云开发控制台获取
});

async function downloadFile(item) {
    var file = item.Key;
    if (file.Size == 0 || file === undefined) {
        return;
    }
    var save_path = resolve(`${save_dir}/${file}`);
    // console.log(`Download file "${file}" to "${save_path}"`);
    await storage.downloadFile({
        cloudPath: file,
        localPath: save_path,
    });
}

async function checkFileExists(filePath) {
    try {
        await promises.access(filePath);
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
    var base = dirname(dirPath);
    await mkdirsSync(base);
    try {
        await promises.mkdir(dirPath);
    } catch (error) {
        if (error.code != "EEXIST") {
            throw error;
        }
    }
    return;
  }

async function checkFileExistsWithMkdir(filePath) {
    var base = await dirname(filePath);
    await mkdirsSync(base);
    return await checkFileExists(filePath);
}

async function downloadList(file, threadID) {
    var count = 0;
    for (let item of file) {
        // 检查文件是否存在
        var localPath = `${save_dir}/${item.Key}`
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
    const allFiles = await storage.listDirectoryFiles("");
    console.log(allFiles);
    await promises.writeFile('./file_list.json', JSON.stringify(allFiles));
    var step = parseInt(allFiles.length / ParallelNum);

    var pool = [];
    shuffle(allFiles);
    for (let i = 0; i < ParallelNum; i++) {
        pool.push(downloadList(allFiles.slice(i*step, (i+1)*step), i));
    }

    await Promise.all(pool);
    
    console.log("All Donwload Done.");
}

main();

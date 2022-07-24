import { constants, promises } from 'node:fs';
import { parse, dirname, resolve } from 'path';
import CloudBase from "@cloudbase/manager-node";
import conf from "./config.js";

const { storage } = new CloudBase({
    secretId: conf.secretId,
    secretKey: conf.secretKey,
    envId: conf.envId, // 云开发环境ID，可在腾讯云云开发控制台获取
});

async function main() {
    var file_str = await promises.readFile("./delete_file_list.json");
    const allFiles = JSON.parse(file_str);

    const step = 10
    var total_deleted = 0;
    var error_count = 0;
    for (let i = 0; i < (allFiles.length / step); i++) {
        var files = allFiles.slice(i*step, (i+1)*step);
        var delete_urls = files.map((x) => x.Key);
        console.log(delete_urls);
        try {
            await storage.deleteFile(delete_urls);
        } catch (error) {
            error_count++;
        }
        total_deleted += files.length;
        console.log(`[${total_deleted}/${allFiles.length}] Deleted, error_count=${error_count}.`);
    }
}

main();

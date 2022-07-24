import { constants, promises } from 'node:fs';
import { parse, dirname, resolve } from 'path';

class DefaultDict {
    constructor(defaultInit) {
      return new Proxy({}, {
        get: (target, name) => name in target ?
          target[name] :
          (target[name] = typeof defaultInit === 'function' ?
            new defaultInit().valueOf() :
            defaultInit)
      })
    }
  }
  

async function load_db_photo() {
    // 加载photo数据表导出文件
    var file_str = await promises.readFile("./db_photo.json", "utf8");
    var res = [];
    for (const item of file_str.trim().split('\n')) {
        res.push(JSON.parse(item));
    }
    return res;
}

async function load_file_list() {
    var file_str = await promises.readFile("./file_list.json");
    return JSON.parse(file_str);
}

async function get_file_path(cloud_id) {
    if (!cloud_id || !cloud_id.startsWith("cloud://")) {
        return cloud_id;
    }
    return cloud_id.split('/').slice(3).join('/');
}

async function log_dict_length(dict_obj, title) {
    if (title) {
        console.log(title);
    }
    // 打印一下
    for (const key in dict_obj) {
        const items = dict_obj[key];
        console.log(`"${key}" count: ${items.length}`);
    }
    return;
}

async function export_delete_json(file_list, file_name) {
    // 不应该删除的文件夹
    const exclude_dir = ["mpcode", "news", "orgAvatar", "orgCatPhoto", "orgmpcode", "系统"]
    // 先输出看看是哪些文件夹的
    var file_dir = new DefaultDict(Array);
    var final_file_list = [];
    for (const file of file_list) {
        var dir = file.Key.split('/')[0];
        if (exclude_dir.findIndex(v => v==dir) != -1) {
            continue;
        }
        final_file_list.push(file);
        file_dir[dir].push(file);
    }
    log_dict_length(file_dir, `=== ${file_name} ===`);

    var file_str = JSON.stringify(final_file_list);
    await promises.writeFile(file_name, file_str);
}

async function main() {
    // 读取文件
    var db_photo = await load_db_photo();
    console.log(`db photo count: ${db_photo.length}`);

    var file_list = await load_file_list();
    console.log(`file list count: ${file_list.length}`);

    // 遍历已有的照片类型
    var photo_type_map = {};
    for (const photo of db_photo) {
        var photo_id = await get_file_path(photo["photo_id"]);
        if (photo["photo_compressed"] && photo["photo_watermark"]) {
            // 已经有水印图和压缩图了
            var photo_compressed = await get_file_path(photo["photo_compressed"]);
            var photo_watermark = await get_file_path(photo["photo_watermark"]);
            photo_type_map[photo_compressed] = "photo_compressed";
            photo_type_map[photo_watermark] = "photo_watermark";
            // 表示原图是可以删除的
            photo_type_map[photo_id] = "deletable_photo_id";
        } else {
            photo_type_map[photo_id] = "photo_id";
        }
    }

    // 找出冗余照片
    var file_types = new DefaultDict(Array);
    for (const file of file_list) {
        var key = file.Key
        var file_type = photo_type_map[key];
        if (!file_type) {
            file_types["not_exist"].push(file);
            continue;
        }
        file_types[file_type].push(file);
    }
    log_dict_length(file_types, "=== file_types ===");

    // 导出准备用于删除请求
    await export_delete_json(file_types["not_exist"], "deletable_not_exist.json");
    await export_delete_json(file_types["deletable_photo_id"], "deletable_origin_photo.json");
}

main();

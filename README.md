    # 微信云开发-云存储文件下载备份


## 下载微信云开发里的内容（二进制执行）
0. 进入release页面，下载对应平台最新版二进制包`download_wxykf-xxx`
1. 下载完成后放置到一个空文件夹中，准备下载
2. 双击运行，根据提示输入`云环境信息`、`并行下载数`、`文件保存目录`

注意：
* `并行下载数`、`文件保存目录`不建议修改，直接回车即可使用默认值
* 配置输入后，会生成`config.json`文件，下次执行无需再次输入，如果输入错误，请**删除/修改**该文件
* 重复执行只会下载`文件保存目录`中没有的文件

## 下载微信云开发里的内容（源码执行）
0. 下载本仓库代码
1. 下载安装node js v16.x.x，并配置`PATH`环境变量，https://nodejs.org/zh-cn/
2. 将`config.sample.json`重命名为`config.json`，并按照注释填写云环境信息
3. 打开命令行，在本目录下，执行`npm install`安装依赖
4. 命令行启动`node main.js`，这一步会下载云存储里的**所有文件**，注意流量消耗

小提示：
* 刚开始需要加载所有文件的列表，会比较慢（1~2分钟），不要着急
* 本地文件会保存在`./save`目录下，多次执行`node main.js`只会下载本地没有的文件，不会重复下载，也就是说中间断了重启一次就好
### 详细教程
【腾讯文档】猫谱-云开发备份
https://docs.qq.com/doc/DSFdHUlR4Y0ZiWndo

## 保存云数据库文件
打开微信开发者工具，点击云开发，数据库，点击每个数据表，再点击`导出`，保存为json文件。

## 清理云存储文件
### 检查哪些文件是可以删除的
1. 云开发中，导出`photo`表，保存为`db_photo.json`文件放置到本目录
2. 执行下载文件后，会产生所有云存储的文件列表`file_list.json`
3. 执行`node gen_delete_files.js`，生成`deletable_not_exist.json`和`deletable_origin_photo.json`文件

说明：
* `deletable_not_exist.json`：photo表中不存在的文件，可能因为重复处理压缩图、数据库删除操作产生
* `deletable_origin_photo.json`：photo表中的原图文件，此原图已经用于产生压缩图和水印图
* 生成这两个文件时，会同时打印准备删除的文件来自于哪个文件夹（如下示例），**检查一下**是否会有误删的情况
* 如果有不想删除的文件夹文件，把该文件夹名加入到`gen_delete_files.js`的`exclude_dir`数组中，再重新执行
```
（示例）
=== delete_not_exist.json ===
"compressed" count: 13220
"watermark" count: 10886
"东校区" count: 17
"东校至善园" count: 25
"北校区" count: 1
"南校东区宿舍" count: 2
"南校区" count: 24
"深圳校区" count: 3
```

### 执行删除
#### 删除冗余照片
1. 修改`deletable_not_exist.json`文件为`delete_file_list.json`
2. 执行`node delete_files.js`进行删除

#### 删除原图
1. 修改`deletable_origin_photo.json`文件为`delete_file_list.json`
2. 执行`node delete_files.js`进行删除

小提示：
* 建议先下载全部图片后，再进行删除操作

## 关于
感谢你对中大猫谱项目的支持！

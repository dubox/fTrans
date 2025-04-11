const fs = require('fs');
const fsPromise = fs.promises;
const URLtoDOCX = require(AppPath + '/Lib/h2d');
const tar = require('tar');
const path = require('node:path');
const {json} = require(AppPath + '/request');
const tmpdir = AppPath+'/tmp';//require('os').tmpdir();console.log(tmpdir);
const OSS = require('ali-oss');
const { oss } = config;
const client = new OSS(oss.client);
const ossPath = oss.uploadPath + 'h2d/';


function getTime() {
    const date = new Date;
    return '' + date.getFullYear() + (date.getMonth() + 1) + date.getDate() + date.getHours() + date.getMinutes() + date.getSeconds() + (date.getTime() % 1000);
}

async function getDir(customName) {
    if(customName && typeof customName == 'string')return await fsPromise.mkdir(tmpdir + '/' + customName + ((new Date).getTime() % 1000) ,{recursive:true});
    return await fsPromise.mkdtemp(tmpdir + '/h2d' + getTime());
}

async function one(url, fileName) {
    const fileBuffer = await URLtoDOCX(url);
    await fsPromise.writeFile(fileName, new DataView(await fileBuffer.arrayBuffer()));
    return true;
}


function resp(data ,res){
    res.setHeader('Content-Type', 'application/json');
    return JSON.stringify(data);
}

module.exports = async function batch(req, res, data) {

    //data = JSON.parse(data); console.log(data);
    var task_start = (new Date).getTime();

    if(data.callback && !/^http/.test(data.callback)){
        throw new Error('Callback format err');
    }

    const dir = await getDir(data.packName || false);

    var promises = [],fileList = data.fileList;
    for (let i in fileList) {
        promises.push(one(fileList[i].url, `${dir}/${fileList[i].fileName}.docx`));
    }


    var pro =  Promise.all(promises).then(async (re) => {
        console.log(`start archive:${(new Date).getTime()}`);
        const archiveName = `${ossPath}${path.basename(dir)}.tar.gz`;
        // tar.c({gzip:{level:6}},[dir]).pipe(fs.createWriteStream(`./${archiveName}`));
        let result = await client.putStream(archiveName, tar.c({ gzip: { level: 6 } ,cwd:path.dirname(dir)+'/'}, ['./'+path.basename(dir)]));//通过将dir设为要打包的目录，fileList 为 . 可以去除打包后多余的目录层级
        console.log(result);
        fsPromise.rm(dir, { force: true, recursive: true });
        if (result.res.status == 200) {
            if(data.callback){
                let reOk =  await json(data.callback ,{result:{
                    ok: true,
                    code: 0,
                    msg: '',
                    duration: (new Date).getTime() - task_start,
                    path: archiveName,
                    url: result.res.requestUrls[0],
                },customData:data.customData});
                console.log(reOk);
                return reOk;
            }
            return resp({
                ok: true,
                code: 0,
                msg: '',
                path: archiveName,
                url: result.res.requestUrls[0],
            },res);
        }

        else
            throw new Error(result.res.statusMessage, { code: result.res.statusCode });
    }).catch(err=>{
        console.log('one err:',err);
        console.log(req.headers);
        try {
            fsPromise.rm(dir, { force: true, recursive: true });
        } catch (e){console.log(e);}
        if(data.callback){
            
            return json(data.callback ,{result:{
                ok:false,
                code:1,
                msg:err.message,
            },customData:data.customData}).catch(console.log);
        }else throw err;
    });

    if(data.callback){
        return resp({
            ok: true,
                code: 0,
            msg: '收到请求，将在处理完成后通知 callback',
        },res);
    }else{
        return pro;
    }
}


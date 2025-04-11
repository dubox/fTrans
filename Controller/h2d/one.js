const URLtoDOCX = require(AppPath + '/Lib/h2d');
const { Readable } = require('node:stream');

console.log('www');
module.exports = async function one(req, res) {
    const from = req._url.searchParams.get('from').replace(/#/g, '%23');console.log(from);
    const upToOss = req._url.searchParams.get('upToOss');
    const fileName = req._url.searchParams.get('fileName');
    if (!from || typeof from != 'string') throw new Error('Params err');
    //console.log(params);
    //res.end(await (await URLtoDOCX(url )).arrayBuffer());
    console.log(`start docx:${(new Date).getTime()}`)
    let docx = await URLtoDOCX(from); 
    console.log(`start arrbuff:${(new Date).getTime()}`)
    docx = await docx.arrayBuffer();
    console.log(`start buff:${(new Date).getTime()}`)
    docx = Buffer.from(docx)
    console.log(`start send:${(new Date).getTime()}`)
    if (upToOss) {
        res.setHeader('Content-Type', 'application/json');
        return await up2oss(docx,fileName);
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('content-Disposition', `attachment;filename=a.docx`);

    return docx;
}

async function up2oss(docx,fileName) {
    const OSS = require('ali-oss');
    const { oss } = require('../../config');
    const client = new OSS(config.oss.client);
    const ossPath = config.oss.uploadPath + 'h2d/' + (fileName || getTime())+'.docx';
    let result = await client.put(ossPath, docx);
    console.log(result);
    if (result.res.status == 200) {
        
        return JSON.stringify({
            "ok": true,
            "code": 0,
            msg: '',
            path: ossPath,
            url: result.res.requestUrls[0],
        });
    }

    else
        throw new Error(result.res.statusMessage, { code: result.res.statusCode });
}

function getTime() {
    const date = new Date;
    return '' + date.getFullYear() + (date.getMonth() + 1) + date.getDate() + date.getHours() + date.getMinutes() + date.getSeconds() + (date.getTime() % 1000);
}

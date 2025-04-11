/* eslint-disable no-console */
const { URL } = require('url');
const {request} = require('../request');
//const Buffer = require('buffer');
// FIXME: Incase you have the npm package
const HTMLtoDOCX = require('html-to-docx');
const path = require('node:path');
//const HTMLtoDOCX = require('../dist/html-to-docx.umd');


module.exports = function URLtoDOCX(url, options) {

    var htmlUrl = null;

    async function url2DataUri(url) {
        if(!/^http/.test(url)){
            if(/^\//.test(url)){
                url = htmlUrl.origin + url;
            }else{
                url = htmlUrl.origin + path.dirname(htmlUrl.pathname) +'/' + url;
            }
        }
        var headers = {};
        let img = await request(url,{},headers);
        return `data:${headers['content-type']};base64,` + img.toString('base64');
    }

    function processImg(htmlString) {
        var imgMap = {}, a = 0;

        var reg = new RegExp(`<img[^\/]*src=['"]([^'"]+)`, 'ig');
        var match;
        while (match = reg.exec(htmlString)) {
            if (match[1])
                imgMap[match[1]] = null;
        }
        var promises = [];
        for (let i in imgMap) {
            console.log(i)
            promises.push((async () => {
                let c = ++a
                let b = [
                    new RegExp(i.replace(/([\/\\\.\+\*\?\^\=\$\!\{\}\[\]\-])/g, "\\$1"), 'ig'),
                    await url2DataUri(i).catch(console.log)];
                return b;
            })());
        }

        return Promise.all(promises).then((res) => {//console.log(res);
            console.log(`start replace:${(new Date).getTime()}`);
            for (let i in res) {
                htmlString = htmlString.replace(res[i][0], res[i][1]);
            }
            return htmlString
        });
    }


    // return new Promise(async (resolve, reject)=>{

    return (async () => {
        console.log(`start request:${(new Date).getTime()}`);
        
        var htmlString = (await request(url))//.toString('utf8');

        htmlUrl = new URL(url);
        htmlString = await processImg(htmlString).catch(console.log);// console.log(htmlString);fs.writeFileSync('./a.html',htmlString);

        console.log(`start to docx:${(new Date).getTime()}`);
        options = Object.assign({
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
            margins:{top:'60px',bottom:'60px',left:'60px',right:'60px'}, //dpi=96,A4纸整宽约800px;
        }, options || {})

        const fileBuffer = await HTMLtoDOCX(htmlString, null, options).catch(err=>{
            console.log(url);
            throw err;
        });
        // console.log(fileBuffer);
        // resolve( fileBuffer);
        return fileBuffer;


    })();
    // });

}
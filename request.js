const https = require('https');
const http = require('http');
const streamConsumers = require('node:stream/consumers');
const contentType = require(AppPath+'/content_type');

const req = {
    get(url) {
        return req.request(url,{resType:'text'});
    },

    post(url ,postData) {
        return req.request(url,{options:{ method: 'POST' },postData:postData} );
    },

    json(url,postData) {
        if(typeof postData !== "string")postData = JSON.stringify(postData);
        return req.request(url, {options:{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        },postData:postData});
    },

    request(url, args ,headers) {
        const {options ,postData ,resType} = Object.assign({options:null,postData:null,resType:null}, args || {});
        const client = /^https/i.test(url) ? https : http;
        return new Promise( (resolve, reject) => {
            let req = client.request(url, Object.assign({ timeout: 5000 }, options || {}), (res) => {
                
                if (res.statusCode !== 200){
                    console.log(url);
                   reject(res.statusMessage,{code:res.statusCode});
                }

                streamConsumers[resType || contentType(res)](res).then(data=>{
                    if(typeof headers == 'object')Object.assign(headers , res.headers);
                    resolve(data);
                }).catch(e=>{reject(e);});

                // var bData = Buffer.alloc(0);
                // res.on('data', (chunk) => {
                //     bData = Buffer.concat([bData, chunk]);//streamConsumers.buffer(stream)
                // });
                // res.on('end', () => {
                //     resolve(bData);
                // });
            });
            req.on('error', (e) => {
                console.log(url);
                reject(e);
            });
            req.on('timeout', () => {
                req.destroy(new Error('timeout:'+url));
            });
            if(postData){
                req.write(postData);
            }
            req.end();
        });
    }
};

module.exports = req;

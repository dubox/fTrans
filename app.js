/* eslint-disable no-console */
const { URL } = require('url');
//import { mkdtemp,writeFile } from 'node:fs/promises';
//const fstream = require('fstream');
const fs = require('fs');
const http = require('http');
const streamConsumers = require('node:stream/consumers');
//const { pipeline } = require('node:stream');
//const zlib = require('node:zlib');
const path = require('node:path');
const myEmitter = require('./events');
const contentType = require('./content_type');
const process = require('node:process');

process.on("SIGTERM", function() {
    process.exit();
});  


 global.AppPath = __dirname;
 global.config = require('./config');


myEmitter.on('request',(req, res ,data)=>{

    (async ()=>{
        const url = new URL(req.url, `http://${req.headers.host}`);console.log(url);
        const route = './Controller'+path.normalize('/'+url.pathname);
        req._url = url;
        console.log(data);
        return await require(route)(req, res,data);
         
        //  res.statusCode = 404
        //  throw new Error('');
    })().then((resp)=>{
        if(res.writableEnded)return;

        res.end(resp);
    }).catch(err=>{
        console.log(err);
        if(res.writableEnded)return;

        var msg = err.code || err.message;
        //if(res.statusCode==200)res.statusCode = 500;
        if(err.code === 'MODULE_NOT_FOUND'){
            res.statusCode = 404;
            res.end();
            return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            ok:false,
            code:1,
            msg:msg,
        }));
    }).finally((...args)=>{console.log(args)});
});


myEmitter.on('error', (req, res,e)=>{
    console.error(e);
    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 500;
    res.end('Content type err');
});
const server = http.createServer((req, res) => {

    console.log(req.headers,req.method);
    if(req.method == 'GET'){
        myEmitter.emit('request',req, res);
    }else if(req.method == 'POST'){
        streamConsumers[contentType(req)](req).then(data=>{
            myEmitter.emit('request',req, res ,data);
        }).catch(e=>{myEmitter.emit('error',req, res,e);});

    }else{
        res.setHeader('Content-Type', 'text/html');
        res.statusCode = 500;
        res.end('Not support');
    }
    
    

    res.on('finish', () => {
        console.log(`over:${(new Date).getTime()}`)
    })

});

server.listen(8000);

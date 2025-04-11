const env = require('./env');

module.exports = merge({
    oss:{
        client:{
            // yourRegion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
            region: 'oss-cn-hangzhou',
            // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
            accessKeyId: '',
            accessKeySecret: '',
            bucket: '',
            endpoint:'',
            internal:true,
            cname:true,
            timeout:300000,
        },
        uploadPath:'fTrans/',
    }
},env);

function merge(obj1 ,obj2){
    for(let i in obj2){
        if(typeof obj1[i] == "object" && typeof obj2[i] == "object"){
            merge(obj1[i],obj2[i]);
        }else{
            obj1[i] = obj2[i];
        }
    }
    return obj1;
}


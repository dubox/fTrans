

module.exports = function(message){
    let cType = message.headers['content-type'];
    switch(0){
        //case cType.indexOf('text/html'):return 'text';
        //case cType.indexOf('text/plain'):return 'text';
        case cType.indexOf('text/'):return 'text';
        case cType.indexOf('application/json'):return 'json';
        case cType.indexOf('application/octet-stream'):return 'blob';
        default:return 'buffer';
    }
}
const { EventEmitter } = require( 'node:events');
class MyEmitter extends EventEmitter {
    
}

module.exports = new MyEmitter({ captureRejections: true });
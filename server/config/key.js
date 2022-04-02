
// 환경변수 확인 후 prod or dev exports 
if(process.env.NODE_ENV === 'production'){
    module.exports = require('./prod');
} else {
    module.exports = require('./dev');
}


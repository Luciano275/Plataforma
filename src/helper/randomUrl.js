module.exports.randomName = () => {
    let rango = 'abcdefghijkqlmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let res = '';
    for(let i = 0; i <= 64; i++){
        res += rango.charAt(Math.floor(Math.random() *  rango.length))
    }
    return res;
}
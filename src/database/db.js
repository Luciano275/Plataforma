const mysql = require('mysql');
const connection = mysql.createConnection({
    host: process.env.PORT || 3000,
    user: process.env.DBUSER || 'root',
    password: process.env.DBPASS || '',
    database: process.env.DBNAME || 'plataforma'
})

connection.connect((err) => {
    if(err) throw err;
    console.log('Connected to Mysql')
})

module.exports = connection;
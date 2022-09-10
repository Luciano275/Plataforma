const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const morgan = require('morgan');
const path = require('path');
const multer = require("multer")
const { randomName } = require('./helper/randomUrl');
const fs = require('fs-extra');
const dotenv = require("dotenv")
const connection = require('./database/db')

app.set('port', PORT);
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

dotenv.config({path: path.join(__dirname, 'env/.env')})

app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use('/api', express.static('public'))
app.use('/api', express.static(path.join(__dirname, 'public')))
app.use(morgan('dev'))
app.use(multer({
    dest: path.join(__dirname, 'public/tmp')
}).single('archivo'))

app.get('/', (req,res) => {
    connection.query('SELECT * FROM archivos', (err, data) => {
        if(err) throw err;
        if(data.length > 0){
            let exts = []
            data.forEach((d) => {
                d.fecha = `${d.fecha.getDate()} de ${process.env.Meses.split(',')[d.fecha.getMonth()]} de ${d.fecha.getFullYear()}`
                exts.push(path.extname(d.originalname).toLocaleLowerCase())
            })
            data.reverse()
            res.render('index', {
                datos: data,
                exts
            })
        }else{
            res.render('index')
        }
    })
})

app.post('/api-rest/add', (req,res) => {
    const saveImg = () => {
        let newUrl = randomName();
        connection.query(`SELECT * FROM archivos WHERE nombre = '${newUrl}'`, async(error, resultados) => {
            if(error) throw error;
            if(resultados.length > 0){
              saveImg()  
            }else{
                let nowPath = req.file.path;
                let extName = path.extname(req.file.originalname).toLocaleLowerCase();
                console.log(extName)
                let newPath = path.resolve(`src/public/upload/${newUrl}${extName}`)
        
                await fs.rename(nowPath, newPath)

                connection.query('INSERT INTO archivos (nombre, originalname) VALUES ?', [[
                    [`${newUrl}${extName}`,`${req.file.originalname}`]
                ]], (err,result) => {
                    if(err) throw err;
                    res.render('index', {
                        message: 'Archivo agregado!',
                        dir: '/'
                    })
                })
            }
        })      
    }
    saveImg()
})

app.get('/open/:id', (req,res) => {
    let id = req.params.id;
    connection.query(`SELECT * FROM archivos WHERE ID = '${id}'`, (err,resultados)=> {
        if(err) throw err;
        if(resultados.length > 0){
            let ext = ''
            resultados.forEach((d) => {
                d.fecha = `${d.fecha.getDate()} de ${process.env.Meses.split(',')[d.fecha.getMonth()]} de ${d.fecha.getFullYear()}`
                ext = path.extname(d.originalname).toLocaleLowerCase()
            })
            resultados.reverse()
            res.render('open', {
                nameFile: resultados[0].originalname,
                resultados: resultados[0],
                ext
            })
        }else{
            res.render('index')
        }
    })
})

app.listen(app.get('port'), () => console.log(`Served running on port ${PORT}`))
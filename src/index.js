const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const morgan = require("morgan");
const path = require("path");
const multer = require("multer");
const { randomName } = require("./helper/randomUrl");
const fs = require("fs-extra");
const dotenv = require("dotenv");
const connection = require("./database/db");
const regexExp = /([a-zA-Z]|[0-9]|[a-zA-Z][0-9]|[0-9][a-zA-Z]){4,}/;
const bcrypt = require("bcrypt");
const expressSession = require("express-session");
const SocketIO = require("socket.io");
let passTmp = "";
const os = require('os');
const http = require('http');
const server = http.createServer(app);
const CryptoJS = require('crypto-js');

app.set("port", PORT);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", true);

dotenv.config({ path: path.join(__dirname, "env/.env") });

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/api", express.static("public"));
app.use("/api", express.static(path.join(__dirname, "public")));
app.use(morgan("dev"));
app.use(
  multer({
    dest: path.join(__dirname, "public/tmp"),
  }).single("archivo")
);
app.use(
  expressSession({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.get("/register", (req, res) => {
  res.render("Register");
});

app.get("/", (req, res) => {
  if (typeof req.session.login != "undefined" && req.session.login) {
    connection.query(
      `SELECT * FROM usuarios WHERE password = ?`,
      req.session.pass,
      (rr, rrs) => {
        if (rr) throw rr;
        if (rrs[0].status === "online") {
          res.render("index", {
            nombre: req.session.name,
            apellido: req.session.surname,
            rol: req.session.rolcitope,
            password: req.session.pass,
          });
        } else {
          req.session.destroy();
          res.render("Login");
        }
      }
    );
  } else {
    res.render("Login");
  }
});

app.post("/api-rest/add", (req, res) => {
  let publicPrv = req.body.publicPrv.trim();
  if (req.body.publicPrv != "publico" && req.body.publicPrv != "privado") {
    publicPrv = "publico";
  }
  setTimeout(() => {
    const saveImg = () => {
      let newUrl = randomName();
      connection.query(
        `SELECT * FROM archivos WHERE nombre = '${newUrl}'`,
        async (error, resultados) => {
          if (error) throw error;
          if (resultados.length > 0) {
            saveImg();
          } else {
            let nowPath = req.file.path;
            let extName = path
              .extname(req.file.originalname)
              .toLocaleLowerCase();
            console.log(extName);
            let newPath = path.resolve(`src/public/upload/${newUrl}${extName}`);

            await fs.rename(nowPath, newPath);
            connection.query("SET NAMES 'utf8'");
            connection.query(
              "INSERT INTO archivos (nombre, originalname, publicprivate, de, psde) VALUES ?",
              [
                [
                  [
                    `${newUrl}${extName}`,
                    `${req.file.originalname.trim()}`,
                    publicPrv,
                    req.body.del,
                    req.body.psd,
                  ],
                ],
              ],
              (err, result) => {
                if (err) throw err;
                res.json({
                  message: "Archivo agregado",
                  dir: "/",
                  status: 200,
                });
              }
            );
          }
        }
      );
    };
    saveImg();
  }, 100);
});

app.get("/open/:id", (req, res) => {
  if (typeof req.session.login != "undefined" && req.session.login) {
    connection.query(
      `SELECT * FROM usuarios WHERE password = ?`,
      req.session.pass,
      (rr, rrs) => {
        if (rr) throw rr;
        if (rrs[0].status === "online") {
          let id = req.params.id;
          connection.query(
            `SELECT * FROM archivos WHERE nombre = '${id}'`,
            (err, resultados) => {
              if (err) throw err;
              if (resultados.length > 0) {
                let ext = "";
                resultados.forEach((d) => {
                  d.fecha = `${d.fecha.getDate()} de ${
                    process.env.Meses.split(",")[d.fecha.getMonth()]
                  } de ${d.fecha.getFullYear()}`;
                  ext = path.extname(d.originalname).toLocaleLowerCase();
                });
                resultados.reverse();
                res.render("open", {
                  nameFile: resultados[0].originalname,
                  resultados: resultados[0],
                  ext,
                });
              } else {
                res.render("index");
              }
            }
          );
        } else {
          req.session.destroy();
          res.redirect("/login/auth/perfect");
        }
      }
    );
  } else {
    res.redirect("/");
  }
});

app.post("/api-rest-user/register", (req, res) => {
  const { nombre, apellido, password, rol } = req.body;
  if (
    regexExp.test(nombre) &&
    regexExp.test(apellido) &&
    regexExp.test(password) &&
    (rol === "Profesor" || rol === "Alumno")
  ) {
    connection.query("SELECT * FROM usuarios", (err, datos) => {
      if (err) throw err;
      if (datos.length > 0) {
        let arrayTmp = [];

        datos.forEach((dato) => {
          bcrypt.compare(password, dato.password, (er, rs) => {
            arrayTmp.push(rs);
          });
        });

        setTimeout(() => {
          if (arrayTmp.includes(true)) {
            console.log(true);
            return res.json({
              status: 404,
            });
          } else {
            console.log(false);
            let encriptedPassword = "";
            bcrypt.hash(password, 10, function (error, hash) {
              encriptedPassword = hash;
            });
            setTimeout(() => {
              connection.query(
                "INSERT INTO usuarios (nombre, apellido, password, rol, status) VALUES ?",
                [[[nombre, apellido, encriptedPassword, rol, "offline"]]],
                (error, resultado) => {
                  if (error) {
                    throw error;
                  }
                }
              );

              return res.json({
                status: 200,
              });
            }, 300);
          }
        }, 100);
      } else {
        let encriptedPassword = "";
        bcrypt.hash(password, 10, function (error, hash) {
          encriptedPassword = hash;
        });
        setTimeout(() => {
          connection.query(
            "INSERT INTO usuarios (nombre, apellido, password, rol, status) VALUES ?",
            [[[nombre, apellido, encriptedPassword, rol, "offline"]]],
            (error, resultado) => {
              if (error) throw error;
              return res.json({
                status: 200,
              });
            }
          );
        }, 100);
      }
    });
  } else {
    return res.json({
      status: 500,
    });
  }
});

app.post("/api-rest-user/login", (req, res) => {
  const { nombre, password } = req.body;
  if (regexExp.test(nombre) && regexExp.test(password)) {
    connection.query("SELECT * FROM usuarios", (err, usu) => {
      if (err) throw err;
      if (usu.length > 0) {
        let arrayPasswords = [];
        let id = 0;

        usu.forEach((usuario) => {
          if (usuario.nombre == nombre) {
            bcrypt.compare(password, usuario.password, (er, rs) => {
              if (er) throw er;
              arrayPasswords.push(rs);
              if (rs) {
                id = usuario.ID;
              }
            });
          }
        });

        setTimeout(() => {
          if (arrayPasswords.includes(true)) {
            req.session.name = nombre;
            req.session.login = true;
            connection.query(
              `SELECT rol, apellido, password,status FROM usuarios WHERE ID = ?`,
              id,
              (elpincherror, elpincheid) => {
                if (elpincherror) throw elpincherror;
                if (elpincheid[0].status === "online") {
                  return res.json({
                    status: 402,
                  });
                } else {
                  req.session.rolcitope = elpincheid[0].rol;
                  req.session.surname = elpincheid[0].apellido;
                  req.session.pass = elpincheid[0].password;
                  passTmp = elpincheid[0].password;
                  setTimeout(() => {
                    connection.query(
                      `UPDATE usuarios SET status = 'online' WHERE password = ?`,
                      req.session.pass,
                      (unerror, unresultado) => {
                        if (unerror) throw unerror;
                        res.json({
                          status: 200,
                          lg: true,
                        });
                      }
                    );
                  }, 100);
                }
              }
            );
          } else {
            res.json({
              status: 404,
            });
          }
        }, 100);
      } else {
        res.json({
          status: 404,
        });
      }
    });
  } else {
    res.json({
      status: 500,
    });
  }
});

app.get("/api-rest/auth", (req, res) => {
  if (typeof req.session.login != "undefined" && req.session.login) {
    connection.query(
      `SELECT * FROM usuarios WHERE password = ?`,
      req.session.pass,
      (rr, rrs) => {
        if (rr) throw rr;
        if (rrs[0].status === "online") {
          res.json({
            status: 200,
          });
        } else {
          req.session.destroy();
          res.redirect("/login/auth/perfect");
        }
      }
    );
  } else {
    res.json({
      status: 404,
    });
  }
});

app.get("/login/auth/perfect", (req, res) => {
  if (typeof req.session.login != "undefined" && req.session.login) {
    connection.query(
      `SELECT * FROM usuarios WHERE password = ?`,
      req.session.pass,
      (rr, rrs) => {
        if (rr) throw rr;
        if (rrs[0].status === "online") {
          res.render("index", {
            nombre: req.session.name,
            apellido: req.session.surname,
            rol: req.session.rolcitope,
            password: req.session.pass,
            login: req.session.login,
          });
        } else {
          req.session.destroy();
          res.redirect("/");
        }
      }
    );
  } else {
    res.redirect("/");
  }
});

app.get("/api-rest/logout", (req, res) => {
  setTimeout(() => {
    let tmpArr = [];
    connection.query("SELECT status FROM usuarios", (a, r) => {
      if (a) throw a;
      r.forEach((st) => {
        tmpArr.push(st.status === "online" ? true : false);
      });
    });
    setTimeout(() => {
      if (tmpArr.includes(true)) {
        connection.query(
          `UPDATE usuarios SET status = ? WHERE password = ?`,
          ["offline", req.session.pass],
          (unerror, unresultado) => {
            if (unerror) throw unerror;
            req.session.destroy();
            res.json({
              status: 200,
            });
          }
        );
      } else {
        connection.query(
          "UPDATE usuarios SET status=? WHERE ?",
          ["offline", 1],
          req.session.pass,
          (unerror, unresultado) => {
            if (unerror) throw unerror;
            req.session.destroy();
            res.json({
              status: 200,
            });
          }
        );
      }
    }, 100);
  }, 100);
});

app.get("/login/auth/perfect/profesores", (req, res) => {
  setTimeout(() => {
    if (typeof req.session.login != "undefined" && req.session.login) {
      connection.query(
        `SELECT * FROM usuarios WHERE password = ?`,
        req.session.pass,
        (rr, rrs) => {
          if (rr) throw rr;
          if (rrs[0].status === "online") {
            res.render("Profesores", {
              nombre: req.session.name,
              apellido: req.session.surname,
              rol: req.session.rolcitope,
              password: req.session.pass,
              ID: rrs[0].ID
            });
          } else {
            req.session.destroy();
            res.redirect("/login/auth/perfect/profesores");
          }
        }
      );
    } else {
      res.redirect("/");
    }
  }, 100);
});

app.get("/login/auth/perfect/alumnos", (req, res) => {
  setTimeout(() => {
    if (typeof req.session.login != "undefined" && req.session.login) {
      connection.query(
        `SELECT * FROM usuarios WHERE password = ?`,
        req.session.pass,
        (rr, rrs) => {
          if (rr) throw rr;
          if (rrs[0].status === "online") {
            res.render("Alumnos", {
              nombre: req.session.name,
              apellido: req.session.surname,
              rol: req.session.rolcitope,
              password: req.session.pass,
              ID: rrs[0].ID
            });
          } else {
            req.session.destroy();
            res.redirect("/login/auth/perfect/alumnos");
          }
        }
      );
    } else {
      res.redirect("/");
    }
  }, 100);
});

server.listen(app.get("port"), () => {
  console.log(`Served running on port ${PORT}`);
  connection.query(
    "UPDATE usuarios SET status=? WHERE ?",
    ["offline", 1],
    (err, resultado) => {
      if (err) throw err;
      connection.query("SELECT status FROM usuarios", (error, usuarios) => {
        if (error) throw error;
        console.log(usuarios);
      });
    }
  );
});

const io = SocketIO(server);

io.on("connect", (socket) => {
  console.log(socket.id);
  let profesoresArray = [];
  let alumnosArray = [];
  socket.on("ineedprof", (da) => {
    connection.query("SELECT * FROM usuarios", (err, datos) => {
      if (err) throw err;
      if (datos.length > 0) {
        datos.forEach((dato) => {
          if (dato.rol === "Profesor") {
            profesoresArray.push(dato);
          } else if (dato.rol === "Alumno") {
            alumnosArray.push(dato);
          }
        });
      }
    });
    setTimeout(() => {
      io.sockets.emit("ineedprof", {
        profesoresArray,
        alumnosArray,
      });
      profesoresArray = [];
      alumnosArray = [];
    }, 100);
  });
  socket.on("ineeddata", (dat) => {
    let extsPb = [];
    let extsPv = [];
    let archivosArray = [];
    let archivosPrivados = [];
    connection.query(
      "SELECT * FROM archivos ORDER BY ID DESC",
      (err, resultados) => {
        if (err) throw err;
        if (resultados.length > 0) {
          resultados.forEach((resultado) => {
            resultado.fecha = `${resultado.fecha.getDate()} de ${
              process.env.Meses.split(",")[resultado.fecha.getMonth()]
            } de ${resultado.fecha.getFullYear()}`;
            if (resultado.publicprivate === "publico") {
              archivosArray.push(resultado);
              extsPb.push(path.extname(resultado.originalname).toLowerCase());
            } else if (resultado.publicprivate === "privado") {
              archivosPrivados.push(resultado);
              extsPv.push(path.extname(resultado.originalname).toLowerCase());
            }
          });
        } else {
          archivosArray = [];
          archivosPrivados = [];
          extsPb = [];
          extsPv = [];
        }
      }
    );
    setTimeout(() => {
      io.sockets.emit("ineeddata", {
        archivosPublicos: archivosArray,
        archivosPrivados,
        extsPb,
        extsPv,
      });
      archivosArray = [];
      archivosPrivados = [];
      extsPb = [];
      extsPv = [];
    }, 100);
  });
  socket.on('ineedauser', (data) => {
    connection.query('SELECT * FROM usuarios WHERE ID = ?', [data], (err, re) => {
      if(err) throw err;
      if(re.length > 0){
        socket.emit('ineedauser', ({
          status: 200,
          re
        }))
      }else{
        socket.emit('ineedauser', ({
          status: 404
        }))
      }
    })
  })
  socket.on('isendamessage', ({mensaj, de, para}) => {
    let encriptedMsg = CryptoJS.AES.encrypt(mensaj, 'mikeyofmsg').toString();
    connection.query('INSERT INTO chat (mensaje,de,para,ver) VALUES ?', [[[
      encriptedMsg,
      de,
      para,
      'sinver'
    ]]], (unerr, unres) => {
      if(unerr) throw unerr;
      io.sockets.emit('isendamessage', ({
        status: 200
      }))
    })
  })
  
  socket.on("ineedallmessage", (d) => {
    connection.query('SELECT * FROM chat', (err, resul) => {
      if(err) throw err;
      if(resul.length>0){
        resul.forEach((r) => {
          r.mensaje = CryptoJS.AES.decrypt(r.mensaje, 'mikeyofmsg').toString(CryptoJS.enc.Utf8);
          r.fecha = `${r.fecha.getDate()} - ${r.fecha.getMonth()+1} - ${r.fecha.getFullYear()}`;
        })
        setTimeout(() => {
          io.sockets.emit('ineedallmessage', ({
            status: 200,
            resul
          }))
        }, 100);
      }else{
        io.sockets.emit('ineedallmessage', ({
          status: 404
        }))
      }
    })
  })

  socket.on('seemessage', (data) => {
    connection.query("UPDATE chat SET ver = 'visto' WHERE de = ? AND para = ? OR de = ? AND para = ?", [data.de, data.para, data.para, data.de], (err, resu) => {
      if(err) throw err;
      connection.query('SELECT * FROM chat', (err, resul) => {
        if(err) throw err;
        let arrayPerFecha = [];
        if(resul.length>0){
          resul.forEach((r) => {
            r.mensaje = CryptoJS.AES.decrypt(r.mensaje, 'mikeyofmsg').toString(CryptoJS.enc.Utf8);
            r.fecha = `${r.fecha.getDate()} - ${r.fecha.getMonth()+1} - ${r.fecha.getFullYear()}`;
          })
          setTimeout(() => {
            io.sockets.emit('seemessage', ({
              status: 200,
              resul
            }))
          }, 100);
        }else{
          io.sockets.emit('seemessage', ({
            status: 404
          }))
        }
      })
    })
  })

});
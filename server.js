import express from "express";
import * as dotenv from "dotenv";

import { Server as HttpServer } from "http";

import session from "express-session";

import cluster from "cluster";
import { cpus } from "os";
import ParsedArgs from "minimist";
import logger from "./config/configLoggers.js";

import MongoStore from "connect-mongo";
import passport from "passport";
import { DBConnect } from "./config/configMongoDb.js";

import homeRouter from "./routers/home.js";
import mainProductos from "./routers/mainProductos.js";
import mainCarritos from "./routers/mainCarritos.js";

dotenv.config();
const app = express();
const httpServer = new HttpServer(app);
const cpu = cpus();

//LOGGUER -------------------------------------
app.use((req, res, next) => {
  logger.info(`Petición Recibida: Método: ${req.method} Ruta: ${req.url}`);
  next();
});

//MIDDLEWARES / VISTAS -----------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("views", "./views");
app.set("view engine", "ejs");

//SERVIDOR -----------------------------------------
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: "mongodb+srv://almamani:nodejs2022@cluster0.fl6igxt.mongodb.net/ecommerce?retryWrites=true&w=majority",
      //ttl: 600000
    }),

    secret: "apr491rta0087w",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 600000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

//RUTAS -----------------------------------------------------------
app.use(homeRouter);
app.use("/api/productos", mainProductos);
app.use("/api/carrito", mainCarritos);

// CONTROL RUTAS INVALIDAS ---------------------------------------------
app.all("*", (req, res) => {
  logger.warn(`Ruta Inexistente: Método ${req.method} Ruta: ${req.url}`);
  res.send({ error: true }).status(500);
});

// INICIO SERVIDOR -----------------------------------
const options = {
  alias: {
    m: "MODO",
  },
  default: {
    MODO: "FORK",
  },
};

const argv = process.argv.slice(2);
const { MODO } = ParsedArgs(argv, options);
const PORT = process.env.PORT || 8080;

if (MODO === "CLUSTER") {
  if (cluster.isPrimary) {
    console.log(`Primary: ${process.pid}`);
    for (let i = 0; i < cpu.length; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
      console.log(`Worker whit id: ${worker.process.pid} killed`);
      cluster.fork();
    });
  } else {
    DBConnect(() => {
      const connectedServer = httpServer.listen(PORT, () => {
        console.log(
          `Servidor http escuchando en el puerto ${
            connectedServer.address().port
          } en modo ${MODO} en el worker ${process.pid}`
        );
      });
      connectedServer.on("error", (error) =>
        console.log(`Error en servidor ${error}`)
      );
    });
  }
} else {
  DBConnect(() => {
    const connectedServer = httpServer.listen(PORT, () => {
      console.log(
        `Servidor http escuchando en el puerto ${
          connectedServer.address().port
        } en modo ${MODO} en el worker ${process.pid}`
      );
    });
    connectedServer.on("error", (error) =>
      console.log(`Error en servidor ${error}`)
    );
  });
}

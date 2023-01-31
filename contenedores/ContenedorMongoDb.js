import mongoose from "mongoose";
import Config from "../config/configDao.js";
import logger from "../config/configLoggers.js";

mongoose.set("strictQuery", true);
await mongoose.connect(Config.mongodb.cnxStr);

class ContenedorMongoDb {
  constructor(coleccion, esquema) {
    this.col = mongoose.model(coleccion, esquema);
  }

  // Traer todos los documentos de la BD
  async getAll() {
    try {
      const objets = await this.col.find();
      return objets;
    } catch (err) {
      console.error(err);
    }
  }

  // Traer un documento correspondiente a  un id
  async getById(id) {
    try {
      const objets = await this.col.findOne({ _id: id });
      return objets;
    } catch (err) {
      console.error(err);
    }
  }

  // Guardar un documento
  async save(objet) {
    try {
      await this.col.create(objet);
      const newId = await this.col
        .find({}, { _id: 1 })
        .sort({ _id: -1 })
        .limit(1);
      return newId;
    } catch (err) {
      console.error(err);
    }
  }

  // Actaulizar documento por Id
  async changeById(elem) {
    const { id } = elem;
    try {
      const found = await this.col.find({ _id: id });
      if (!found) {
        found = null;
      } else {
        await this.col.replaceOne({ _id: id }, elem);
      }
      return found;
    } catch (err) {
      console.error(err);
    }
  }

  //  Borrar documento por Id
  async deleteById(id) {
    let found = await this.col.find({ _id: id });
    try {
      if (!found) {
        found = null;
      } else {
        await this.col.deleteOne({ _id: id });
      }
      return found;
    } catch (err) {
      console.error(err);
    }
  }
}

export default ContenedorMongoDb;

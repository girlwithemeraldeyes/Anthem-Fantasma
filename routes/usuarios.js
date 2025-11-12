var express = require("express");
var mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); 
var router = express.Router();

const dotenv = require('dotenv');
dotenv.config();

var debug = require("debug")("moviesAppAuth:server");

// Modelo
var User = require("../models/Usuario.js");

mongoose.set("strictQuery", false);

// Middleware para verificar el token
function tokenVerify(req, res, next) {
    const authHeader = req.get('authorization');

    // Si no hay cabecera de autorización, corto aquí
    if (!authHeader) {
        return res.status(401).send({
            ok: false,
            message: "Token no proporcionado"
        });
    }

    const retrievedToken = authHeader.split(' ')[1];

    if (!retrievedToken) {
        return res.status(401).send({
            ok: false,
            message: "Token inválido"
        });
    }

    jwt.verify(retrievedToken, process.env.TOKEN_SECRET, function (err, decodedToken) {
        if (err) {
            return res.status(401).send({
                ok: false,
                message: "Token inválido"
            });
        } else {
            // Si pasa la verificación seguimos con la ruta
            next();
        }
    });
}

// GET seguro de todos los usuarios
router.get("/secure", tokenVerify, async function (req, res) {
    try {
        debug("Acceso seguro con token a los usuarios");
        const users = await User.find().sort("-creationdate").exec();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).send(err);
    }
});

// GET de todos los usuarios (sin token)
router.get("/", async function (req, res) {
    try {
        const users = await User.find().sort("-creationdate").exec();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).send(err);
    }
});

// GET seguro de un usuario por id
router.get("/secure/:id", tokenVerify, async function (req, res) {
    try {
        debug("Acceso seguro con token a un usuario");
        const userinfo = await User.findById(req.params.id).exec();
        res.status(200).json(userinfo);
    } catch (err) {
        res.status(500).send(err);
    }
});

// POST de un nuevo usuario (sin token)
router.post("/", async function (req, res) {
    try {
        // Con Mongoose nuevo no se puede pasar callback
        await User.create(req.body);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err);
    }
});

// POST de un nuevo usuario (con token)
router.post("/secure", tokenVerify, async function (req, res) {
    try {
        debug("Creación de un usuario segura con token");
        await User.create(req.body);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err);
    }
});

// PUT de un usuario (con token)
router.put("/secure/:id", tokenVerify, async function (req, res) {
    try {
        debug("Modificación segura de un usuario con token");
        await User.findByIdAndUpdate(req.params.id, req.body);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err);
    }
});

// DELETE de un usuario (con token)
router.delete("/secure/:id", tokenVerify, async function (req, res) {
    try {
        debug("Borrado seguro de un usuario con token");
        await User.findByIdAndDelete(req.params.id);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err);
    }
});

// DELETE de un usuario (sin token)
router.delete("/:id", async function (req, res) {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Login y generación de token
// Login y generación de token  (SIN callbacks, usando async/await)
router.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1) buscar usuario
    const user = await User.findOne({ username }).exec();
    if (!user) {
      return res.status(401).send({ message: "Usuario no existe" });
    }

    // 2) comparar password (hash)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({ message: "Password no coincide" });
    }

    // 3) generar token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.TOKEN_SECRET,
      { expiresIn: 3600 }
    );

    return res.status(200).send({ message: token });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error en login");
  }
});

module.exports = router;
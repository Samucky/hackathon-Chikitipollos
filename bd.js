const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());  // Habilitar CORS

// Configura la conexión a tu base de datos
const config = {
    user: 'Admin1234',
    password: 'Alumno2004',
    server: 'carcachitas-network2.database.windows.net',
    database: 'Chikitipollos',
    options: {
        encrypt: true // Usa esto si estás en Azure
    }
};

// Ruta para guardar la información del usuario
app.post('/register', async (req, res) => {
    const { nombre, correo, contraseña } = req.body;

    try {
        let pool = await sql.connect(config);
        console.log('Conexión exitosa');

        await pool.request()
            .input('Nombre', sql.VarChar, nombre)
            .input('Correo', sql.VarChar, correo)
            .input('Contraseña', sql.VarChar, contraseña)
            .query('INSERT INTO Personas (Nombre, Correo, Contraseña) VALUES (@Nombre, @Correo, @Contraseña)');

        res.status(200).send('Usuario registrado exitosamente');
        await pool.close();
    } catch (err) {
        console.error('Error de conexión o SQL:', err);
        res.status(500).send('Error al registrar el usuario: ' + err.message);
    }
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
    const { correo, contraseña } = req.body;

    try {
        let pool = await sql.connect(config);
        console.log('Conexión exitosa');

        const result = await pool.request()
            .input('Correo', sql.VarChar, correo)
            .input('Contrasena', sql.VarChar, contraseña)
            .execute('IniciarSesion');

        console.log('Resultado de la consulta:', result.recordset);

        if (result.recordset.length > 0) {
            const outputMessage = result.recordset[0].ResultMessage;

            if (outputMessage.includes('Inicio de sesión exitoso')) {
                res.status(200).send(outputMessage);
            } else {
                res.status(401).send(outputMessage);
            }
        } else {
            res.status(404).send('No se encontraron resultados');
        }

        await pool.close();
    } catch (err) {
        console.error('Error de conexión o SQL:', err);
        res.status(500).send('Error al iniciar sesión: ' + err.message);
    }
});


// Configuración HTTPS
const key = fs.readFileSync(path.join(__dirname, 'localhost-key.pem'));
const cert = fs.readFileSync(path.join(__dirname, 'localhost.pem'));
const httpsOptions = {
    key: key,
    cert: cert
};

// Inicia el servidor HTTPS
const PORT = process.env.PORT || 3000;
https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Servidor HTTPS en el puerto ${PORT}`);
});

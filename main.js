// TODO: Configurar las dependencias requeridas
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// TODO: Inicializa la aplicación de express
const app = express();

// TODO: Configurar conexión a MongoDB Atlas
mongoose.connect('mongodb+srv://anthonysaint1927:fFXwdnvWp9gzWRyY@cluster1.5vcrq6t.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', () => {
    console.log('Conexión exitosa a MongoDB Atlas');
});

// TODO: Definir esquemas de Mongoose para usuarios y tareas
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    completed: Boolean
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);

app.use(express.json());

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ userId: user._id }, '8oC4cO1FUbpt21x9', { expiresIn: '24h' });

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// TODO: Crear una ruta para el registro de usuarios y generación de token JWT
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, '8oC4cO1FUbpt21x9', { expiresIn: '24h' });

        res.status(201).json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});

// TODO: Crear middleware para verificar el token JWT
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Acceso no autorizado' });

    jwt.verify(token, '8oC4cO1FUbpt21x9', (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });

        req.user = user;
        next();
    });
};

// TODO: Definir rutas CRUD para las tareas utilizando Express Router y asegurarse de que requieran autenticación JWT
const taskRouter = express.Router();

taskRouter.use(authenticateToken);

taskRouter.post('/', async (req, res) => {
    try {
        const { title, description, completed } = req.body;
        const newTask = new Task({ title, description, completed });
        await newTask.save();

        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la tarea' });
    }
});

taskRouter.get('/', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las tareas' });
    }
});


// TODO: Implementar rutas para actualizar y eliminar tareas

// Ruta para actualizar una tarea por su ID
taskRouter.put('/:taskId', async (req, res) => {
    try {
        const { title, description, completed } = req.body;
        const taskId = req.params.taskId;

        // Encuentra la tarea por ID y actualiza los campos
        const updatedTask = await Task.findByIdAndUpdate(taskId, { title, description, completed }, { new: true });

        if (!updatedTask) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la tarea' });
    }
});


// Ruta para eliminar una tarea por su ID
taskRouter.delete('/:taskId', async (req, res) => {
    try {
        const taskId = req.params.taskId;

        // Encuentra la tarea por ID y elimínala
        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        res.json({ message: 'Tarea eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la tarea' });
    }
});


app.use('/tasks', taskRouter);

app.listen(3000, () => {
    console.log('Servidor ejecutándose en el puerto 3000');
});

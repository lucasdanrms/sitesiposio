const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Serve os arquivos estáticos (Seu HTML)
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do Pool de Conexão com MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db', // Nome do serviço no docker-compose
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'simposio_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Rota de Registro
app.post('/registrar', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' });
    }

    try {
        // Criptografar a senha antes de salva
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const [result] = await pool.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
            [nome, email, senhaHash]
        );

        res.status(201).json({ mensagem: 'Usuário registrado com sucesso!' });
    } catch (erro) {
        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ mensagem: 'E-mail já cadastrado.' });
        }
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    }
});

// Rota de Login
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        const usuario = rows[0];

        if (!usuario) {
            return res.status(401).json({ mensagem: 'E-mail ou senha incorretos.' });
        }

        // Comparar a senha digitada com o Hash do banco
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ mensagem: 'E-mail ou senha incorretos.' });
        }

        // Retorna os dados do usuário (sem a senha) para o front-end
        res.status(200).json({
            mensagem: 'Login realizado com sucesso',
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
        });
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs'); // 1. Importamos a ferramenta de segurança
const app = express();

app.use(express.json());
app.use(cors());

// --- CONFIGURAÇÃO DO BANCO DE DADOS ---
const db = new sqlite3.Database('./dados.db');

// Atualizamos a tabela para aceitar a coluna 'senha'
db.run(`
    CREATE TABLE IF NOT EXISTS inscritos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        senha TEXT NOT NULL 
    )
`);

// --- ROTA DE REGISTRO (Com Criptografia) ---
app.post('/registrar', async (req, res) => {
    const { nome, email, senha } = req.body; // Recebemos a senha do HTML

    try {
        // 2. Criptografamos a senha antes de salvar
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        const sql = `INSERT INTO inscritos (nome, email, senha) VALUES (?, ?, ?)`;
        
        db.run(sql, [nome, email, senhaCriptografada], function(err) {
            if (err) return res.status(500).send({ mensagem: "Erro ao salvar" });
            res.status(200).send({ mensagem: "Usuário registrado com segurança!" });
        });
    } catch (erro) {
        res.status(500).send({ mensagem: "Erro ao processar senha" });
    }
});

// --- ROTA DE LOGIN (Com Comparação Segura) ---
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    const sql = `SELECT * FROM inscritos WHERE email = ?`;

    db.get(sql, [email], async (err, row) => {
        if (err || !row) {
            return res.status(401).send({ mensagem: "E-mail ou senha incorretos." });
        }

        // 3. Comparamos a senha digitada com a criptografada que está no banco
        const senhaValida = await bcrypt.compare(senha, row.senha);

        if (senhaValida) {
            res.status(200).send({ mensagem: `Bem-vindo, ${row.nome}!` });
        } else {
            res.status(401).send({ mensagem: "E-mail ou senha incorretos." });
        }
    });
});

app.listen(3000, () => console.log("> Servidor rodando em http://localhost:3000"));
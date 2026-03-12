const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose(); // Importa o SQLite
const app = express();

app.use(express.json());
app.use(cors());

// --- CONFIGURAÇÃO DO BANCO DE DADOS ---

// Cria (ou abre) o arquivo chamado 'dados.db'
const db = new sqlite3.Database('./dados.db', (err) => {
    if (err) console.error("Erro ao abrir banco:", err.message);
    else console.log("> Arquivo de banco de dados pronto.");
});

// Cria a tabela de inscritos se ela ainda não existir
db.run(`
    CREATE TABLE IF NOT EXISTS inscritos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL
    )
`);

// --- ROTAS ---

app.post('/registrar', (req, res) => {
    const { nome, email } = req.body;

    // Comando SQL para inserir os dados com segurança
    const sql = `INSERT INTO inscritos (nome, email) VALUES (?, ?)`;
    
    db.run(sql, [nome, email], function(err) {
        if (err) {
            console.error("Erro ao salvar:", err.message);
            return res.status(500).send({ mensagem: "Erro no servidor" });
        }
        
        console.log(`Usuário salvo com ID: ${this.lastID}`);
        res.status(200).send({ mensagem: "Inscrição salva no banco de dados!" });
    });
});

// --- ROTA DE LOGIN ---
app.post('/login', (req, res) => {
    const { email } = req.body;

    // Procuramos o usuário pelo e-mail
    const sql = `SELECT * FROM inscritos WHERE email = ?`;

    db.get(sql, [email], (err, row) => {
        if (err) {
            return res.status(500).send({ mensagem: "Erro no servidor" });
        }
        
        if (row) {
            // Se encontrou o e-mail no banco
            res.status(200).send({ 
                mensagem: `Bem-vindo de volta, ${row.nome}!`,
                usuario: row 
            });
        } else {
            // Se não encontrou nada
            res.status(401).send({ mensagem: "E-mail não encontrado." });
        }
    });
});

app.listen(3000, () => {
    console.log("> Servidor rodando em http://localhost:3000");
});
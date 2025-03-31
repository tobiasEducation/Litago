const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: '*', // or specify your domain for security
  methods: ['GET', 'POST', 'DELETE']
}));
app.use(express.static(__dirname));

// Azure SQL Database Connection 
const dbConfig = {
    user: "CloudSAfc7981b5",
    password: "Sarapus14!",
    server: "litagodb.database.windows.net",
    database: "Litago_Database",
    options: { encrypt: true }
};

let pool;

// Connect To Database
async function connectToDatabase() {
    try {
        pool = await sql.connect(dbConfig);
        console.log("Connected to Azure SQL Database");
        pool.request().query("SELECT 1 as test")
            .then(() => console.log("Test query successful"))
            .catch(err => console.error("Test query failed:", err));
    } catch (err) {
        console.error("Database connection failed:", err);
    }
}

connectToDatabase();

async function callHttpTrigger() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:7071/api/HttpTrigger', (resp) => {
            let data = '';

            // A chunk of data has been received.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received.
            resp.on('end', () => {
                resolve(data);
            });

        }).on("error", (err) => {
            reject("Error: " + err.message);
        });
    });
}

app.get("/api/trigger", async (req, res) => {
    try {
        const response = await callHttpTrigger();
        res.send(response);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get("/api/books", async (req, res) => {
    try {
        console.log("📚 /api/books hit");

        if (!pool?.connected) {
            pool = await sql.connect(dbConfig);
            console.log("✅ Connected to DB");
        }

        const result = await pool.request().query("SELECT * FROM Books");
        console.log("📦 Query result:", result.recordset);

        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Error in /api/books:", err);
        res.status(500).json({ error: err.message });
    }
});

// Legg til en ny bok
app.post("/api/books", async (req, res) => {
    const { Title, Author } = req.body;
    if (!Title || !Author) {
        return res.status(400).json({ error: "Title and Author are required" });
    }

    console.log("POST /api/books called");
    try {
        if (!pool?.connected) {
            pool = await sql.connect(dbConfig);
        }
        await pool.request()
            .input("Title", sql.NVarChar, Title)
            .input("Author", sql.NVarChar, Author)
            .query("INSERT INTO Books (Title, Author) VALUES (@Title, @Author)");
        res.status(201).json({ message: "Book added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.delete("/api/books/:id", async (req, res) => {
    const bookId = req.params.id;
    console.log(`DELETE /api/books/${bookId} called`);

    try {
        if (!pool?.connected) {
            pool = await sql.connect(dbConfig);
        }
        const result = await pool.request()
            .input("bookId", sql.Int, bookId)
            .query("DELETE FROM Books WHERE BookID = @bookId");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Book not found" });
        }

        res.json({ message: "Book deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require("express");
const sql = require("mssql");
const cors = require("cors");

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
    user: process.env.DB_USER || "CloudSAfc7981b5",
    password: process.env.DB_PASSWORD || "Sarapus14!",
    server: process.env.DB_SERVER || "litagodb.database.windows.net",
    database: process.env.DB_NAME || "Litago_Database",
    options: { encrypt: true }
};

let pool;

async function connectToDatabase() {
    try {
        pool = await sql.connect(dbConfig);
        console.log("Connected to Azure SQL Database");
    } catch (err) {
        console.error("Database connection failed:", err);
    }
}

connectToDatabase();

app.get("/api/books", async (req, res) => {
    console.log("GET /api/books called");
    try {
        if (!pool?.connected) {
            pool = await sql.connect(dbConfig);
        }
        const result = await pool.request().query("SELECT * FROM Books");
        res.json(result.recordset);
    } catch (err) {
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

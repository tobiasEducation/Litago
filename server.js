const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// Azure SQL Database Connection 
const dbConfig = {
    user: "CloudSAfc7981b5",
    password: "Sarapus14!",
    server: "litagodb.database.windows.net",
    database: "Litago_Database",
    options: { encrypt: true }
};

async function connectToDatabase() {
    try {
        await sql.connect(dbConfig);
        console.log("Connected to Azure SQL Database");
    } catch (err) {
        console.error("Database connection failed:", err);
    }
}

connectToDatabase();

app.get("/api/books", async (req, res) => {
    console.log("GET /api/books called");
    try {
        const result = await sql.query("SELECT * FROM Books");
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
        await sql.query(
            `INSERT INTO Books (Title, Author) VALUES ('${Title}', '${Author}')`
        );
        res.status(201).json({ message: "Book added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.delete("/api/books/:id", async (req, res) => {
    const bookId = req.params.id;
    console.log(`DELETE /api/books/${bookId} called`);

    try {
        const result = await sql.query(`DELETE FROM Books WHERE BookID = ${bookId}`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Book not found" });
        }

        res.json({ message: "Book deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

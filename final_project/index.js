const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const axios = require('axios');
const routes = require('./router/friends.js');

let users = [];
let books = [
    {isbn: '012345678', title: 'Book 0', author: 'Author 0', reviews: []},
    {isbn: '123456789', title: 'Book 1', author: 'Author 1', reviews: []},
    {isbn: '234567890', title: 'The Great Adventure', author: 'John Doe', reviews: []},
    {isbn: '345678901', title: 'JavaScript Basics', author: 'Jane Smith', reviews: ['Excellent guide to JS!', 'Very informative and clear.']},
    {isbn: '456789012', title: 'The Mystery of Code', author: 'Emily White', reviews: ['A thrilling read for programmers.']},
    {isbn: '567890123', title: 'AI and Machine Learning', author: 'Sarah Green', reviews: ['In-depth exploration of AI concepts.']},
    {isbn: '678901234', title: 'The Tech Revolution', author: 'Mark Black', reviews: ['A must-read for tech enthusiasts.', 'A fascinating look into the future of technology.']},
    {isbn: '789012345', title: 'A Journey Through Time', author: 'Alice Brown', reviews: ['Captivating story of time travel!', 'Mind-bending narrative with great twists.']},
    {isbn: '890123456', title: 'The Future of Programming', author: 'George Grey', reviews: ['A visionary perspective on programming.', 'Great insights into where programming is headed.']},
    {isbn: '901234567', title: 'The Ultimate Web Developer', author: 'James Blue', reviews: ['Comprehensive guide for aspiring web developers.']},
];

const doesExist = (username) => users.some(user => user.username === username);
const authenticatedUser = (username, password) => users.some(user => user.username === username && user.password === password);

const app = express();

app.use(session({
    secret: "fingerprint",
    resave: false,
    saveUninitialized: true
}));

app.use(express.json());

app.use("/friends", function auth(req, res, next) {
    if (req.session.authorization) {
        let token = req.session.authorization['accessToken'];

        jwt.verify(token, "access", (err, user) => {
            if (!err) {
                req.user = user;
                next();
            } else {
                return res.status(403).json({ message: "User not authenticated" });
            }
        });
    } else {
        return res.status(403).json({ message: "User not logged in" });
    }
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    if (authenticatedUser(username, password)) {
        const accessToken = jwt.sign({ username }, 'access', { expiresIn: 60 * 60 });

        req.session.authorization = { accessToken, username };
        return res.status(200).json({ message: "User successfully logged in" });
    } else {
        return res.status(401).json({ message: "Invalid login. Check username and password" });
    }
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    if (!doesExist(username)) {
        users.push({ username, password });
        return res.status(201).json({ message: "User successfully registered. Now you can login" });
    } else {
        return res.status(409).json({ message: "User already exists!" });
    }
});

app.get('/books', (req, res) => res.json(books));

app.get('/books/isbn/:isbn', (req, res) => {
    const book = books.find(b => b.isbn === req.params.isbn);
    return book ? res.json(book) : res.status(404).json({ message: 'Book not found' });
});

app.get('/books/author/:author', (req, res) => {
    const authorBooks = books.filter(b => b.author.toLowerCase() === req.params.author.toLowerCase());
    return res.json(authorBooks);
});

app.get('/books/title/:title', (req, res) => {
    const titleBooks = books.filter(b => b.title.toLowerCase().includes(req.params.title.toLowerCase()));
    return res.json(titleBooks);
});

app.get('/books/:isbn/reviews', (req, res) => {
    const book = books.find(b => b.isbn === req.params.isbn);
    return book ? res.json(book.reviews) : res.status(404).json({ message: 'Book not found' });
});

app.post('/books/:isbn/reviews', (req, res) => {
    const { isbn } = req.params;
    const { reviewtext } = req.body;
    const book = books.find(b => b.isbn === isbn);

    if (book) {
        book.reviews.push(reviewtext);
        res.status(201).json({ message: 'Review added' });
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
});

app.delete('/books/:isbn/reviews', (req, res) => {
    const { isbn } = req.params;
    const book = books.find(b => b.isbn === isbn);

    if (book) {
        const { reviewtext } = req.body;
        const index = book.reviews.indexOf(reviewtext);
        if (index !== -1) {
            book.reviews.splice(index, 1);
            res.status(200).json({ message: 'Review deleted' });
        } else {
            res.status(404).json({ message: 'Review not found' });
        }
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
});

// Async/Await Endpoints
app.get("/async/books", async (req, res) => {
    try {
        const response = await axios.get('http://localhost:5000/books');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching books" });
    }
});

app.get("/async/books/isbn/:isbn", async (req, res) => {
    try {
        const response = await axios.get(`http://localhost:5000/books/isbn/${req.params.isbn}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching book details" });
    }
});

app.get("/async/books/author/:author", async (req, res) => {
    try {
        const response = await axios.get(`http://localhost:5000/books/author/${req.params.author}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching books by author" });
    }
});

app.get("/async/books/title/:title", async (req, res) => {
    try {
        const response = await axios.get(`http://localhost:5000/books/title/${req.params.title}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error fetching books by title" });
    }
});

const PORT = 5000;
app.use("/friends", routes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

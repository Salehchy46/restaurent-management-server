const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json())

app.get('/', (req, res) => {
    res.send('The Chefs are cooking, Come and take your food.');
})

app.listen(port, () => {
    console.log(`Foods are waiting at Chef's hand: ${port}`);
})
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server app is running  http://localhost:${port}`);
});


const products = [
   {
    id: "string",
    name: "string",
    description: "string",
    price: "number",
   }
];

app.get('/products', (req, res) => {
    res.json(products);
    print(products);
});

app.get('/products/:id', (req, res) => {
    const id = req.params.id;
    const product = products.find(product => product.id === id);
    res.json(product);
});



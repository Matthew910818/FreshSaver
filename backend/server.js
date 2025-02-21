const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require("axios");
require("dotenv").config();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '../images')));

mongoose.connect('mongodb://localhost:27017/healthy_market', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Product = mongoose.model('Product', new mongoose.Schema({
  name: String,
  category: String,
  imageUrl: String,
  price: Number
}));

console.log("OpenAI API Key:", process.env.OPENAI_API_KEY ? "Loaded ✅" : "❌ Missing");

app.post("/api/getRecipes", async (req, res) => {
    try {
        const ingredients = req.body.ingredients;

        if (!ingredients) {
            return res.status(400).json({ error: "No ingredients provided" });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: "Missing OpenAI API key" });
        }

        // ✅ Updated Prompt for Structured Output
        const prompt = `I have these ingredients: ${ingredients}. 
        Suggest 3 dishes I can make.
        Provide the response in JSON format with an array of objects. 
        Each object should contain:
        - "dish_name": The name of the dish.
        - "required_ingredients": A list of ingredients needed.
        
        Example Output:
        [
            { "dish_name": "Stir-Fried Chicken", "required_ingredients": ["Chicken", "Garlic", "Soy Sauce"] },
            { "dish_name": "Vegetable Soup", "required_ingredients": ["Carrots", "Onions", "Tomato"] }
        ]`;

        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        // ✅ Extract structured JSON response
        const responseText = response.data.choices[0].message.content;
        let recipes;
        try {
            recipes = JSON.parse(responseText); // Convert to JSON format
        } catch (error) {
            return res.status(500).json({ error: "Failed to parse OpenAI response" });
        }

        res.json({ recipes });

    } catch (error) {
        console.error("❌ Error calling OpenAI API:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to get recipes" });
    }
});




app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.get('/test', (req, res) => {
    res.send('Server is working!');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
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

// ✅ Serve Images Correctly
app.use('/images', express.static(path.join(__dirname, '../images')));

// ✅ Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/healthy_market', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ✅ Define Product Schema
const Product = mongoose.model('Product', new mongoose.Schema({
  name: String,
  category: String,
  imageUrl: String,
  price: Number
}));

console.log("OpenAI API Key:", process.env.OPENAI_API_KEY ? "Loaded ✅" : "❌ Missing API Key");

// ✅ Recipe Generation Endpoint
app.post("/api/getRecipes", async (req, res) => {
    try {
        const { ingredients, user } = req.body;

        if (!ingredients || !user) {
            return res.status(400).json({ error: "Missing ingredients or user data" });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: "Missing OpenAI API key" });
        }

        // ✅ Optimized Prompt
        const prompt = `I have these ingredients: ${ingredients}. 
        Suggest 3 dishes I can make.
        User info:
        - Age: ${user.age}
        - Gender: ${user.gender}
        - Height: ${user.height} cm
        - Weight: ${user.weight} kg
        
        Respond ONLY in valid JSON format:
        [
            { 
                "dish_name": "Dish Name", 
                "required_ingredients": [
                    { "name": "Ingredient Name", "amount_g": 100 }
                ],
                "portion_size": "200g"
            }
        ]`;

        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1000
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        console.log("🔍 OpenAI Raw Response:", JSON.stringify(response.data, null, 2));

        let aiResponseText = response.data.choices[0]?.message?.content;

        if (!aiResponseText) {
            return res.status(500).json({ error: "OpenAI returned an empty response" });
        }

        // ✅ Remove unwanted markdown
        aiResponseText = aiResponseText.replace(/```json|```/g, '').trim();

        try {
            let recipes = JSON.parse(aiResponseText);
            res.json({ recipes });
        } catch (error) {
            console.error("❌ JSON Parse Error:", error.message);
            
            // Try to fix incomplete JSON by adding missing closing brackets
            try {
                // Count opening and closing brackets to see if they're balanced
                const openBrackets = (aiResponseText.match(/\[/g) || []).length;
                const closeBrackets = (aiResponseText.match(/\]/g) || []).length;
                const openBraces = (aiResponseText.match(/\{/g) || []).length;
                const closeBraces = (aiResponseText.match(/\}/g) || []).length;
                
                let fixedJson = aiResponseText;
                
                // Add missing closing braces
                for (let i = 0; i < openBraces - closeBraces; i++) {
                    fixedJson += '}';
                }
                
                // Add missing closing brackets
                for (let i = 0; i < openBrackets - closeBrackets; i++) {
                    fixedJson += ']';
                }
                
                console.log("🔧 Attempting to fix JSON:", fixedJson);
                let recipes = JSON.parse(fixedJson);
                res.json({ recipes });
            } catch (fixError) {
                console.error("❌ Could not fix JSON:", fixError.message);
                return res.status(500).json({ 
                    error: "Failed to parse OpenAI response", 
                    responseText: aiResponseText 
                });
            }
        }

    } catch (error) {
        console.error("❌ OpenAI API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to get recipes" });
    }
});

// ✅ Fetch Products from Database
app.get('/api/products', async (req, res) => {
  try {
      const products = await Product.find();
      res.json(products);
  } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ✅ Health Check Endpoint
app.get('/test', (req, res) => {
    res.send('✅ Server is running fine!');
});

// ✅ Start the Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
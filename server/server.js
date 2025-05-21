const express = require('express');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.listen(4000, () => {
    console.log("server started on port 4000");
    console.log("Loaded API key:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Not loaded");
});

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


const generateImage = async (prompt) => {
    try {
        console.log("Generating image with prompt:", prompt);

        const response = await client.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        if (response && response.data && response.data[0]?.url) {
            return response.data[0].url;
        } else {
            throw new Error("No image URL in response.");
        }
    } catch (err) {
        console.error("Error generating image:", err);
        throw err;
    }
};


const generateAnimalName = async (namePrompt) => {
    try {
        console.log("Generating name with prompt:", namePrompt);

        const response = await client.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a creative zoologist who invents names for new animal species." },
                { role: "user", content: namePrompt }
            ],
            temperature: 0.9,
            max_tokens: 20,
        });

        const name = response.choices[0]?.message?.content?.trim();
        return name || "Unknown Creature";
    } catch (err) {
        console.error("Error generating name:", err);
        throw err;
    }
};


app.post("/generateImages", async (req, res) => {
    try {
        const { animalPrompt, environmentPrompt, namePrompt } = req.body;

        if (!animalPrompt || !environmentPrompt || !namePrompt) {
            return res.status(400).send({ error: "All prompts are required." });
        }

        const [animalImage, environmentImage, name] = await Promise.all([
            generateImage(animalPrompt),
            generateImage(environmentPrompt),
            generateAnimalName(namePrompt)
        ]);

        res.send({ animalImage, environmentImage, name });
    } catch (err) {
        res.status(500).send({ error: "Failed to generate content." });
    }
});
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

const isUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

app.post('/generate-quiz', async (req, res) => {
  try {
    let { inputText, numQuestions } = req.body;

    if (!inputText) {
      return res.status(400).json({ error: 'inputText is required' });
    }

    if (isUrl(inputText)) {
      const response = await axios.get(inputText);
      const $ = cheerio.load(response.data);
      inputText = $('body').text(); // A simple approach to get all text
    }

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: `Create a multiple choice quiz with ${numQuestions || 5} questions based on the following text. Each question should have 4 options, with only one correct answer. Format the output as a JSON array of objects, where each object has "question", "options" (an array of strings), and "answer" (the correct option string). Only return the JSON array, with no other text or explanation. Text: ${inputText}` }],
    });

    // Use a regex to find and parse the JSON array from the response
    const responseText = msg.content[0].text;
    const jsonMatch = responseText.match(/(\[[\s\S]*\])/);

    if (jsonMatch && jsonMatch[0]) {
      try {
        const quiz = JSON.parse(jsonMatch[0]);
        res.json(quiz);
      } catch (parseError) {
        console.error('Failed to parse JSON from response:', parseError);
        res.status(500).json({ error: 'Failed to parse quiz data from AI response.' });
      }
    } else {
      console.error('No JSON array found in the AI response.');
      res.status(500).json({ error: 'No quiz data found in AI response.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

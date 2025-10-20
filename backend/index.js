require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const puppeteer =require('puppeteer');

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

async function scrapeContent(url) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  let content = await page.evaluate(() => {
    const mainContent = document.querySelector('main');
    return mainContent ? mainContent.innerText : document.body.innerText;
  });

  await browser.close();

  // Clean up and truncate the content
  content = content.replace(/\s\s+/g, ' ').trim();
  return content.substring(0, 4000);
}

app.post('/generate-quiz', async (req, res) => {
  try {
    let { inputText, numQuestions } = req.body;

    if (!inputText) {
      return res.status(400).json({ error: 'inputText is required' });
    }

    if (isUrl(inputText)) {
      inputText = await scrapeContent(inputText);
    }

    const prompt = `Based on the text below, generate a valid JSON array of ${numQuestions || 5} multiple-choice questions. Each object in the array must have a "question" string, an "options" array of 4 strings, and an "answer" string that matches one of the options. Ensure the entire output is a single, complete, and valid JSON array.

Text: "${inputText}"`;

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = msg.content[0].text;

    // Find the start and end of the JSON array
    const startIndex = responseText.indexOf('[');
    const endIndex = responseText.lastIndexOf(']');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const jsonString = responseText.substring(startIndex, endIndex + 1);
      try {
        const quiz = JSON.parse(jsonString);
        res.json(quiz);
      } catch (parseError) {
        console.error('Failed to parse JSON from response:', parseError);
        console.error('Extracted JSON String:', jsonString);
        res.status(500).json({ error: 'Failed to parse quiz data from AI response.' });
      }
    } else {
      console.error('No JSON array found in the AI response.');
      console.error('AI Response Text:', responseText);
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

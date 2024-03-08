const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Handle JSON Parse Error
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON');
    return res.status(400).send('Error: Malformed JSON syntax.');
  }
  next();
});

// Initialize basePath with a command-line argument
const basePath = process.argv[2] || '';

// Validate the base path
if (!basePath || !fs.existsSync(basePath) || !fs.statSync(basePath).isDirectory()) {
  console.error('Error: Invalid base path provided. Please restart the server with a valid directory as a base path.');
  process.exit(1);
}

console.log(`Base folder path set to: ${path.resolve(basePath)}`);

// REST API endpoint to accept log file path and message
app.post('/log', (req, res) => {
  const { filePath, message } = req.body;
  const fullPath = path.join(basePath, filePath);

  try {
    // Ensure the directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    // Append the message to the log file
    fs.appendFileSync(fullPath, message + '\n', 'utf8');
    res.send('Log message saved.');
  } catch (error) {
    console.error('Failed to save log message:', error);
    res.status(500).send('Error: Failed to save log message.');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

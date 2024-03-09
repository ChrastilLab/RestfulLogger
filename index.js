const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const minimist = require('minimist');

const app = express();

// Middleware to parse request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Parse command-line arguments
const argv = minimist(process.argv.slice(2), {
  string: ['port', 'output'], // Treat these as strings
  alias: { p: 'port', x: 'output', d: 'output' }, // -p is an alias for --port, -x for --output
  default: { port: 3000 } // Default port if none is provided
});

const port = argv.port;
let basePath = argv.output || ''; // Use provided base path or default to empty string

// Validate the base path
if (!basePath || !fs.existsSync(basePath) || !fs.statSync(basePath).isDirectory()) {
  console.error('Error: Invalid base path provided. Please provide a valid directory as a base path.');
  process.exit(1);
}

console.log(`Server will listen on port: ${port}`);
console.log(`Base folder path set to: ${path.resolve(basePath)}`);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON');
    return res.status(400).send('Error: Malformed JSON syntax.');
  }
  next();
});


// REST API endpoint to check server status
app.get('/status', (req, res) => {
  res.json({ status: 'ok', message: 'Server is working' });
});

// REST API endpoint to accept log file path and message
app.post('/log', (req, res) => {
  const { filePath, message } = req.body;
  const fullPath = path.join(basePath, filePath);

  try {
    // Ensure the directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    // Append the message to the log file
    fs.appendFileSync(fullPath, message + '\n', 'utf8');
    res.json({status: 'ok', message: 'Log message saved successfully.'});
  } catch (error) {
    console.error('Failed to save log message:', error);
    res.status(500).json({status: 'error', message: 'Failed to save log message.'});
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

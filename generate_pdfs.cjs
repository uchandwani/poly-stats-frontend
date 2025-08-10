const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Customize these
const LOGIN_URL = 'http://localhost:3000';
const EXERCISE_CODES = ['Basics_01', 'Basics_02', 'Basics_03', 'Basics_04'];
const BASE_URL = 'http://localhost:3000/exercise/';
const DOWNLOAD_DIR = './pdfs';
const USERNAME = 'Student2';
const PASSWORD = 'student2pass';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Go to login page
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' });

  // Wait for login form and enter credentials
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', USERNAME);

  await page.waitForSelector('input[name="password"]');
  await page.type('input[name="password"]', PASSWORD);

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);

  console.log("✅ Logged in successfully");

  // Ensure output folder exists
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
  }

  // Loop through all exercises
  for (const code of EXERCISE_CODES) {
    const url = `${BASE_URL}${code}`;
    await page.goto(url, { waitUntil: 'networkidle0' });

    const filePath = path.join(DOWNLOAD_DIR, `${code}.pdf`);
    await page.pdf({ path: filePath, format: 'A4', printBackground: true });

    console.log(`📄 Saved: ${filePath}`);
  }

  await browser.close();
  console.log("🎉 All PDFs generated!");
})();

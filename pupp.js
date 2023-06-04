import puppeteer from "puppeteer";
import Tesseract from 'tesseract.js'

import fs from "fs"
import fetch from 'node-fetch'

let fileName = "images/" + generateRandomInteger() + ".png";
let SECRET;


let name = ""
let password = ""


async function run() {
    // Create Browser
    const browser = await puppeteer.launch({
        headless: false,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Go to GIRIS PAGE
    await page.goto("https://kutuphane.yildirim.bel.tr/yordam/?p=2&dil=0#girisFormKapsayan");

    // Get Cookies
    let PHPSESSID = (await page.cookies()).filter(x => x.name == "PHPSESSID")[0].value;
    console.log("PHP SESSION ID: " + PHPSESSID);

    // Fetch Captcha & save from Server
    await fetch("https://kutuphane.yildirim.bel.tr/yordam/inc/captcha.php?form=girisForm", {
        headers: {
            cookie: `key=value; PHPSESSID=${PHPSESSID}`
        }
    }).then(res => res.body.pipe(fs.createWriteStream(fileName)) && console.log("File saved as: " + fileName));

    // Image to text with Tesseract
    await Tesseract.recognize(
        fileName,
        'eng',
        {}
    ).then(async ({ data: { text } }) => {
        SECRET = text;
        console.log("SECRET: " + SECRET)

        // writes on inputs
        await page.$eval('input[name=aSifre]', (el, value) => el.value = value, password);
        await page.$eval('input[name=uyeKodKN]', (el, value) => el.value = value, name);
        await page.$eval('input[name=code_girisForm]', (el, value) => el.value = value, text);

        // Clicks on submit button
        await page.$('[type="submit"]').then(x => x.click());

        // Wait for navigation
        await page.waitForNavigation();
        await console.log("Page URL: " + page.url());

        // Go to REZERVASYON PAGE
        await page.goto("https://kutuphane.yildirim.bel.tr/yordam/?p=7&dil=0", { waitUntil: 'networkidle2' });

        await console.log("Page URL: " + page.url());
        await page.evaluate(() => {
            document.querySelector(`.krokiSec`).selectedIndex = 1;
        });

        await page.evaluate(() => {
            document.querySelector(`.tarihSec`).selectedIndex = 1;
        });
        await page.evaluate(() => {
            document.querySelector(`.saatSec`).selectedIndex = 2;
        });

        // Wait 30seconds  
        await page.screenshot({ path: 'example.png' });

        await page.waitForNavigation();

        await browser.close();
    })
}

(async () => {
    await run();
})();

function generateRandomInteger(max) {
    return Math.floor(Math.random() * 151515151515) + 1;
}




/*
import ReadText from "text-from-image";

ReadText(fileName)
  .then((text) => {
    console.log(text);
  })
  .catch((err) => {
    console.log(err);
  });

*/

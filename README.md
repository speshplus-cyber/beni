<p align="center"><img src="beni-logo.svg" width="96" alt="Beni logo"></p>

# Beni

A medical and nursing assistant for nursing students. Ask any health or nursing question and get an answer in plain, everyday language, or upload an assignment (PDF, text or photos) and get a clear draft to edit and save as a PDF.

## Features

- **Ask anything**: anatomy, diseases, drugs, lab values, ECGs, dosage calculations (with every step shown), exam questions, and follow-up questions in the same thread.
- **Assignment modes**: answer questions, essay or paper, care plan, case study, reflection, and "Explain it to me" for studying.
- **Uploads**: PDFs (text is read in the browser with pdf.js), text files and photos.
- **Options**: length, reference style (APA 7, Harvard, Vancouver) and year of study.
- **Editable draft** with word count, copy, and Save as PDF (jsPDF).
- **PowerPoint slides**: builds a deck from a topic or upload. Every title, bullet and speaker note can be edited in the page; slides can be reordered, duplicated, deleted, or redone one at a time or all together; pick a look and download a real .pptx (PptxGenJS).

## How it runs

The same page works in two places:

- **On Vercel (its own website):** the page sends questions to `api/ask.js`, a serverless function that calls the Claude API with your Anthropic API key and streams the answer back.
- **Inside Claude (as a Claude artifact):** the page uses the viewer's own Claude account instead, and no server is needed.

## Deploy to Vercel

1. Get an API key at [console.anthropic.com](https://console.anthropic.com) and add some credit. Each question costs a few cents, paid from that account.
2. On [vercel.com](https://vercel.com), choose **Add New → Project**, import `speshplus-cyber/beni`, and leave the build settings as they are (no framework, no build command).
3. Under **Environment Variables**, add:
   - `ANTHROPIC_API_KEY`: your key (required)
   - `BENI_PASSCODE`: an access code (strongly recommended, so strangers who find the link can't spend your credit)
   - `BENI_MODEL`: optional. Defaults to `claude-opus-5-5`. Set `claude-sonnet-5-5` or `claude-haiku-5-5` to make it cheaper.
4. Click **Deploy**. The site opens at `https://<project>.vercel.app`.

If you set a passcode, the page asks for it the first time and remembers it on that device.

## Files

- `beni.html`: the app (served at `/`)
- `api/ask.js`: the Vercel function that talks to Claude
- `vercel.json`: routes `/` to the app and gives the function up to 5 minutes for long drafts
- `beni-logo.svg`: the logo

## Note

Beni is a study aid. It does not replace a mentor, a prescriber or local policy, and drafts should be read and rewritten in your own words before you hand them in.

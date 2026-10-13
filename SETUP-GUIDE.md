# brok.enstrokes: setup guide

Do these once. After that you only ever use your private admin page.
Everything here is free. Total time: about 30–40 minutes.

What you will end up with:

- A live website at `https://YOUR-USERNAME.github.io/sketch-portfolio/`
- A private admin page at `.../sketch-portfolio/admin/` where you drag in a sketch, type the title, and press Save. The site updates by itself in about a minute.
- A heart button on every sketch, with a shared like counter.

What each free service does:

| Service | Job |
|---|---|
| GitHub | Stores your website files and hosts the website (GitHub Pages) |
| Supabase | Remembers how many likes each sketch has |

---

## Part 0: Before you start (5 min)

1. **Back up** your current `D:\sketch-portfolio` folder (copy it somewhere safe).
2. Unzip this project. Copy your pictures into its `image` folder.
   File names: lowercase, no spaces, e.g. `jungkook.png`. The first sketch in `data/works.json` expects `image/jungkook.png`.
3. Optional preview on your PC: open the folder in VS Code → install the **Live Server** extension → right-click `index.html` → **Open with Live Server**.
   (Double-clicking `index.html` will show an error message. That is normal, browsers block data files on `file://`. The live website does not have this problem.)

---

## Part 1: Put the files on GitHub (10 min)

1. Go to **github.com** → **Sign up** (free). Verify your email.
2. Click **+** (top right) → **New repository**.
   - Repository name: `sketch-portfolio`
   - Choose **Public** (free hosting needs public)
   - Leave "Add a README file" unticked
   - Click **Create repository**.
3. On the empty repo page click **uploading an existing file**.
4. Open the unzipped project folder. Select everything **inside** it (`index.html`, `style.css`, `script.js`, `config.js`, `supabase.sql`, `SETUP-GUIDE.md`, and the `admin`, `data`, `image` folders) and drag it into the GitHub page.
   Drag the contents, not the outer folder, so `index.html` ends up at the top level.
5. Wait for the upload bar, then click **Commit changes**.

## Part 2: Turn on the website (3 min)

1. In your repo: **Settings** → **Pages** (left menu).
2. Under **Build and deployment** → **Source**: **Deploy from a branch**.
3. **Branch**: `main`, folder `/ (root)` → **Save**.
4. Wait 1–2 minutes and refresh. A box at the top shows **Your site is live at …**
   That link is your website address. It never changes.

## Part 3: Tell the admin page which repo is yours (2 min)

1. In your repo open `admin` → `config.yml` → click the **pencil** icon (Edit).
2. Change this line:
   `repo: YOUR-GITHUB-USERNAME/sketch-portfolio`
   to your real username, e.g. `repo: priotush/sketch-portfolio`
3. **Commit changes**.

## Part 4: Make your admin key (5 min)

This key is what makes you the only person who can edit the site.

1. GitHub → click your profile picture → **Settings** → bottom of the left menu **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Token name: `portfolio admin`. Expiration: 1 year (put a reminder in your phone to make a new one then).
3. **Repository access** → **Only select repositories** → pick `sketch-portfolio`.
4. **Permissions** → **Repository permissions** → **Contents** → **Read and write**.
5. **Generate token**. **Copy it now**, GitHub shows it only once. Keep it private like a password.

## Part 5: Log in to your admin page (2 min)

1. Open `https://YOUR-USERNAME.github.io/sketch-portfolio/admin/`
2. Choose **Sign in with GitHub**, then **Sign in with token** (the wording may differ slightly), and paste your token.
   Your browser remembers it, so you only do this once per device.
3. You will see **Portfolio** → **My work** and **Name, about & contact**.

### Adding a new sketch

1. **My work** → **Add Piece** (new pieces go to the top).
2. Pick **Where does it go?** (Sketches, Scribbles, Stickers or Process), type the **Title**, **Medium** and **Year**.
3. Click **Picture** and drag your image in.
   Tip: shrink big phone photos first (about 1600 px wide, under ~1 MB, e.g. at squoosh.app) so the site stays fast.
4. Press **Save**. After about a minute it is live. Refresh with **Ctrl + F5**.

The six "Sketch 02…06" pieces and the Scribbles, Stickers and Process pieces are placeholders. Open each one to add a real picture, or delete it.

Fill in **Name, about & contact** too, so the About page has your real text, email and Instagram.

---

## Part 6: Turn on the like counters (10 min)

1. Go to **supabase.com** → **Start your project** → sign in with GitHub.
2. **New project**: name `portfolio`, make a database password (save it), pick the region closest to you, **Create**. Wait ~2 minutes.
3. Left menu → **SQL Editor** → **New query**. Open `supabase.sql` from this project, copy everything, paste, click **Run**. You should see "Success".
4. Left menu → **Project Settings** → **API** (or **API Keys**). Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - the **anon** key, or the **publishable** key
   Never use the "secret" or "service_role" key.
5. In your GitHub repo open `config.js` → pencil icon → paste the two values between the quotes → **Commit changes**.
6. After a minute, open your website and tap a heart. Check the number goes up.

To see your counts: Supabase → **Table Editor** → `likes`. On the site, choose **Most liked** in the sort box.

---

## Good to know

- **Cost:** GitHub Pages and Supabase free plans are enough for a portfolio. A custom address like `yourname.com` is the only thing that costs money (~$10–15/year). Optional, later.
- **Supabase pause:** a free Supabase project pauses after 7 days with no activity. The site still works, but likes stop. Log in to Supabase and press **Restore**.
- **Likes and renaming:** a piece's likes are tied to its picture file. Replace the picture with a different file (or rename a piece that has no picture) and its likes start again from 0.
- **Cheating:** each visitor can like once per device. Someone with technical skill could add extra likes. For a portfolio that is a fair trade.
- **Deleting a piece** removes it from the site, but its picture file stays in the `image` folder (harmless).
- **Token safety:** never post your token anywhere. If it leaks, delete it in GitHub (Developer settings) and make a new one.

## If something goes wrong

| Problem | Fix |
|---|---|
| Picture is a broken icon | Name in `image/…` must match exactly (letters, capitals, `.png` vs `.jpg`). Uploading through the admin does this for you. |
| Site shows old content | Press **Ctrl + F5**. GitHub takes up to ~1–2 min to publish. |
| `/admin/` shows 404 | Check Part 2 finished and the `admin` folder is in the repo's top level. |
| Admin says repo not found / can't save | Part 3 repo name is wrong, or the token lacks **Contents: Read and write** on that repo, or it expired. |
| Hearts work but numbers don't add up for everyone | `config.js` values missing or wrong (keep the quotes), or the SQL in Part 6 step 3 was not run. Press **F12** → Console for the error. |

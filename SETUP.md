# Shopping Man — shared list setup

This version keeps one live list in the cloud (Google Firebase) instead of sending
links back and forth. Nobody needs a Google account; each phone just enters a name
and a list code once.

Until `firebase-config.js` is filled in, the app runs in **demo mode** (list stays
on one phone) so nothing breaks.

## 1. Create the Firebase project (about 10 minutes, free)

1. Go to <https://console.firebase.google.com> and click **Create a project**.
   Name it something like `shopping-man`. You can turn Google Analytics **off**.
2. On the project home page click the **Web** icon (`</>`), give the app a nickname
   (`Shopping Man`), and skip Firebase Hosting. Firebase shows a `firebaseConfig = { ... }`
   block. **Copy it.**
3. Left menu → **Build → Authentication** → **Get started** → **Sign-in method** tab →
   **Anonymous** → enable → **Save**.
4. Still in Authentication → **Settings** tab → **Authorized domains** → **Add domain** →
   `smccormack-blip.github.io`.
5. Left menu → **Build → Firestore Database** → **Create database** → pick a US location
   (e.g. `nam5`) → **Start in production mode** → **Create**.
6. In Firestore, open the **Rules** tab, replace everything with the contents of
   `firestore.rules` from this repo, and click **Publish**.

## 2. Plug it into the app

Open `firebase-config.js`, replace `null` with the block you copied, so it reads
`export const firebaseConfig = { apiKey: "...", ... };`, and commit.

(These values are not secret. They only identify your project; the rules in
`firestore.rules` are what keep other people out of your list.)

## 3. First use

- **First person:** open the app → enter your name → **Start new list** → tap
  **Invite someone** and text the link to the family.
- **Everyone else:** open the link → enter their name → **Join list**.
  Joining needs internet once; after that it works offline.
- Tap the list name at the top any time to see the code, who's on the list,
  invite more people, change your name, or join/start another list.

## How it behaves

- Changes appear on every phone within a second or two.
- No signal in the store? Keep checking things off. The bar under the list name says
  *Offline · changes saved, will sync*, and everything uploads when signal returns.
- Removed items stay crossed out with *added by … · removed by …* for a week, with a
  **Restore** button. Bought items show *got by …* until the next shopping trip.
- **Activity** (on the list screen) is the full family log: every add, removal,
  restore, and shopping trip.
- **Undo** appears for a few seconds after adding or removing, for slips.
- When anyone taps **Fulfilled Food Duties**, everyone gets the victory video.

## Separate lists for other groups

Each list has its own code. Start a second list (e.g. "Camp Kitchen") from the list
menu and invite just those people; members of one list can't see the other. A phone
can belong to several lists and switch between them from the list menu.

## Free-tier limits

The free Firebase plan allows roughly 50,000 reads and 20,000 writes a day, far more
than a family list uses.

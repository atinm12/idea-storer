# Idea Storer 💡

Idea Storer is an iOS app for saving ideas the second you have them and sorting them by topic. I picked this because I get random ideas all the time, like a table that cleans itself using UV light, and they always end up lost in my Notes app or in texts to myself. Now every idea gets a home.

**Demo video:** _add link here_
**Open it from GitHub (Expo Snack):** _add Snack link here_

## Screens

**Home**
This is the first thing you see. It shows how many ideas you have and how many topics, then a grid of topic cards. Every card has an emoji, a name, and an idea count. It starts with 5 topics: 🏠 Home, 📚 School, 💼 Work, 💻 Tech, and 🎲 Random. You can tap a card to open that topic, tap **+ Topic** in the top right to make your own topic, or tap the yellow **+ New Idea** button at the bottom to save an idea right away.

**Topic**
This shows every idea in one topic, newest first. Each row has the title, a preview of the details, and the date. You can tap an idea to edit it, or tap **+ Add idea here** to add one with that topic already picked. Topics you made yourself have a **Delete** button. Deleting one moves its ideas to 🎲 Random so you never lose anything.

**Idea Editor**
This is where you write the idea. There's a title (required), details (optional), and a row of topic chips to pick from. Save stays grayed out until there's a title. If you're editing an old idea, you can change its topic or delete it.

**New Topic**
This pops up as a sheet. You type a name and pick an emoji. It won't let you make two topics with the same name, even if the capitalization is different.

Everything saves on your phone with AsyncStorage, so your ideas are still there after you fully close the app and open it again.

## How to run it

**What I used:** Expo **SDK 58** (`create-expo-app@latest` used the `default@sdk-58` template), Expo Router, TypeScript, and Expo Go on the **iOS Simulator** on my MacBook Air.

You need Node 22.13 or newer, Xcode (for the iOS Simulator), and a free Expo account.

```bash
git clone https://github.com/atinm12/idea-storer.git
cd idea-storer
npm install
npx expo login     # same account you're signed into in Expo Go
npx expo start
```

Then press **i** in the terminal. Expo opens the iOS Simulator and installs Expo Go on it for you. On a real phone, you can scan the QR code with Expo Go instead.

## How I built it

1. I wrote `SPEC.md` first, with 20 acceptance criteria, and committed it before any code existed.
2. I gave the spec to an AI agent and let it build the whole app. That's the "Raw agentic build output" commit, untouched.
3. I opened a brand new agent session that had never seen the build. It reviewed the code against my spec and wrote `REVIEW.md`. I left that file exactly the way it came out.
4. I fixed the findings that mattered ("Fixes after AI review" commit), then tested and polished it in the simulator.

## What I did with the review

The review had 32 PASS, 0 FAIL, and 19 WARN. 0 FAIL made me a little suspicious, so I went through the WARNs one by one.

**Fixed:**
- **#32:** If the saved data was broken, the app would start fresh and the next save would wipe the old data for good. Now it backs up the broken data under a separate key first, and it retries a failed read once.
- **#33:** It now logs a warning when it has to skip bad data while loading.
- **#34:** Custom topics would disappear if I ever changed the emoji list. Now any emoji is accepted when loading.
- **#35:** Double-tapping Save really fast could make the same idea twice. The guard uses a ref now, so the second tap gets blocked right away.
- **#36 and #37:** If a save failed, the app still showed the change and left the screen, so it looked saved when it wasn't. Now the change gets undone, you stay on the screen, and you can hit Save again.
- **#38:** Hitting "next" on the keyboard after the title now jumps to the details box.
- **#41 and #42:** The small text was 13pt, so I bumped it to 15pt to match my spec. The topic name counter now only shows up when you're close to the 24 character limit.

**Didn't fix, on purpose:**
- **#39 (splash screen hangs if storage never answers):** On iOS, AsyncStorage just reads a local file and doesn't hang in practice. Adding a timeout would have meant starting with empty data, and that brings back the wipe problem from #32.
- **#40 (no "discard changes?" warning when you back out):** This isn't in my spec. For quick idea capture, I think it's fine.
- **#43 and #44 (header style and title timing):** These are small visual things that looked fine to me in the simulator.
- **#45 (blank screen during delete):** It only lasts a split second, so I didn't change it.
- **#46 (emoji count as 2 characters):** That's just how JavaScript counts strings. For an 80 character title, it doesn't matter.
- **#47 to #49 (repeated code):** Fair point, but the app is small enough that pulling these out into helpers wasn't worth the risk this close to the deadline.
- **#50 (leftover starter dependencies):** The unused packages don't get bundled into the app, and removing them could break things in Expo Go, so I left them.

## What surprised me

The thing that surprised me most was how much of "mobile" is just layout and safe areas. I expected the hard part to be the phone stuff. Instead it was things like making sure the + New Idea button doesn't sit under the home indicator, and learning that a `View` is a native view and not a div. I was also surprised that every file in `src/app/` automatically becomes a screen. Navigation felt way simpler than I thought it would be.

## Files
- `SPEC.md`: my spec, written before any code
- `REVIEW.md`: the second agent's review, unedited
- `prompt_log.md`: the key prompts I used
- `src/app/`: the screens (Expo Router)
- `src/lib/`: data types, storage, and the shared store
- `src/components/`: buttons, the character counter, and the not-found screen

# Prompt Log: Idea Storer (HW: Mobile App with Expo)

## AI tools used
- **Claude (Opus 5.5) in the Claude app**, linked to my Mac. It acted as the coordinator: it created the Expo project, wrote the spec from my answers, and ran the commands.
- **Build agent:** a separate Claude agent that got only the build prompt and implemented SPEC.md.
- **Review agent:** a brand new Claude agent that had never seen the build conversation. It got only the review prompt and wrote REVIEW.md.
- **Expo's AGENTS.md / Claude plugin settings** that ship with the SDK 58 template. Both agents read AGENTS.md, which tells them to use `npx expo install` and the versioned SDK 58 docs.

The prompts below are verbatim. For the concept questions, I wrote a short summary of the answer I got under each one.

---

## Phase 1: Planning and setup

### Prompt 1: Kicking off the project (to Claude)
> do this on the ios simulator on mac, not on a phone. i want to make an idea storer, which stores ideas that a user may have at any given time by topic. for example, if a user wants to make a table that cleans itself using a specfiic technology, it would be in the home section. for any documentation besides the prompt log, make it in my tone. i want to be able to open the app from a github link. make a public repo as well. give 17 prompts to build the assingment. before you do, ask me any questions you have.

### Prompt 2: Answering Claude's clarifying questions
> You build it on my Mac. Topics: presets + custom (Home, School, Work, Tech, Random, and I can add my own). GitHub link: Expo Snack link in the README. Already set up: GitHub CLI/Desktop signed in, Node 22.13+.

Claude ran `npx create-expo-app@latest` with no `--template` flag. It picked `default@sdk-58`.

### Prompt 3: Do I need Xcode?
> do i need to download xcode because i am doing the simulator on mac and not actually making an ios app

**What I learned:** Yes. The iOS Simulator only ships inside Xcode, and there's no separate download. You don't write any Xcode code, though. Expo uses the simulator to install Expo Go and run the JS bundle. A real iPhone with Expo Go is the free backup if Xcode is too slow.

**What actually happened:** The simulator download failed with "Insufficient space available. Requires 8.34 GB," so I switched to Expo Go on my iPhone. I scanned the QR code from `npx expo start` with the Camera app.

---

## Phase 2: Learning the basics (Step 2)

### Prompt 4
> I'm brand new to React Native. Can you explain at a high level how these files create a working app?

**What I learned:** `package.json` points `main` at `expo-router/entry`. Expo Router scans `src/app/` and turns every file into a route. `_layout.tsx` wraps all the screens, and in my app it's a Stack navigator. Metro bundles the TypeScript into one JS bundle, and Expo Go downloads it and runs it with real native views.

### Prompt 5
> What's the difference between React Native and a regular website? How is a View different from a div?

**What I learned:** There's no DOM or HTML. `<View>` turns into a real native iOS view (UIView), and `<Text>` into a native text view. Every piece of text has to be inside a `<Text>`. Styling is a JS object with Flexbox, and the default direction is column, not row like on the web. There's no CSS cascade, so styles don't pass down to children.

### Prompt 6
> How do I add a button and a text input to a React Native screen? Show me a simple example and explain the useState hook.

**What I learned:** `const [title, setTitle] = useState('')` gives you the current value and a setter. A `TextInput` with `value={title}` and `onChangeText={setTitle}` is a "controlled input." Every keystroke updates state, and React re-renders the screen with the new value. That's how my Save button knows to stay disabled while `title.trim()` is empty.

### Prompt 7
> This project uses Expo Router. How does a file in src/app/ become a screen, and what is _layout.tsx for?

**What I learned:** The file path is the URL. `index.tsx` is `/`, `topic/[id].tsx` is `/topic/:id`, and the brackets make it dynamic. `topic/new.tsx` beats `topic/[id].tsx` because static names win over dynamic ones. `_layout.tsx` sets up the navigator and default header styles, and it's where I made New Topic open as a modal with `presentation: 'modal'`.

---

## Phase 3: Spec (Step 3)

### Prompt 8: Writing the spec
> Write SPEC.md for the idea storer in my tone. Two main screens plus an editor and a new-topic modal, presets Home/School/Work/Tech/Random plus custom topics, AsyncStorage persistence, light mode with a warm off-white, indigo, and lightbulb-yellow palette. The acceptance criteria need to be numbered and checkable just by using the app, like "Typing X and tapping Save returns to Home and the Home card shows 1."

I went through the spec before it was committed (commit `Add SPEC.md before any code`).

---

## Phase 4: Agentic build (Step 4)

### Prompt 9: Build prompt (to the build agent)
> Read SPEC.md in this project. Implement the full mobile app exactly as specified.
> This is an Expo project using Expo Router, so screens belong in src/app/.
> Check package.json for the exact Expo SDK version and write code for that version.
> Create all necessary files, components, and navigation. Make sure that appropriate data is persistent.
> Avoid security risks for sensitive data. Include proper error handling.
> Make sure the app starts without errors and displays the home screen correctly.
>
> Extra context: read AGENTS.md first and follow it (use `npx expo install` for packages; the Expo docs for the SDK are at https://docs.expo.dev/versions/v58.0.0/ if you can fetch them). The app will be run in Expo Go on the iOS Simulator, so only use modules bundled in Expo Go. There is no simulator in this environment, so verify with `npx tsc --noEmit`, `npx expo lint`, and `npx expo export --platform ios --output-dir /tmp/export-check` (that last one confirms the bundle builds). Remove starter files that are no longer used (Explore screen, tab layout, unused components/assets references) so nothing references deleted routes. When done, report a short list of files created/changed and the verification results.

The output was committed untouched as `Raw agentic build output`.

**Manual intervention:** None to the code. The agent hit a network block on `api.expo.dev` and worked around it with `EXPO_OFFLINE=1 npx expo install`. I checked that the AsyncStorage version (2.2.0) matches what SDK 58 bundles in `expo/bundledNativeModules.json`.

---

## Phase 5: Review (Step 5)

### Prompt 10: Review prompt (to a fresh agent)
> Review the React Native/Expo code in this project against the spec in SPEC.md.
> For each acceptance criterion in the spec, verify whether the code actually implements it correctly.
> Also check for:
> - Bugs or logic errors
> - Missing error handling
> - Code quality issues (unclear naming, repeated code, etc.)
> - Best practices for React Native or other technologies
>
> Format your review as a numbered list of findings, each marked as [PASS], [FAIL], or [WARN].
> Be specific. Reference file names and line numbers.
> Do not fix anything in this session. Report only.
> Export the review as REVIEW.md at the root of the project.
>
> Context: Expo SDK 58 (see package.json), Expo Router, runs in Expo Go on the iOS Simulator. No simulator is available to you, so judge by reading code; you may run `npx tsc --noEmit` and `EXPO_OFFLINE=1 npx expo lint`. Be skeptical; do not mark something PASS unless the code clearly does it.

Result: 32 PASS, 0 FAIL, 19 WARN. It was committed unedited as `Add REVIEW.md from second agent (unedited)`.

### Prompt 11: Deciding what to fix
> 0 FAIL feels too clean. Go through the 19 WARNs and tell me which ones are real bugs a user could hit vs style stuff. Fix #32-38, #41, #42. For the rest, give me one sentence each on why we're skipping it so I can put it in the README.

These fixes became the `Fixes after AI review` commit. The skip reasons are in the README.

### Prompt 12: Understanding the biggest bug
> Explain #32 like I'm new to this. How could a broken load end up wiping my saved ideas?

**What I learned:** When loading fails, the app falls back to the default data in memory. The next time you add anything, `saveData` writes that default data plus the new idea over the one storage key, so the old ideas are gone. The fix copies the broken JSON to a backup key before starting fresh.

### Prompt 13: Refs vs state
> Why does using a ref instead of useState stop the double-tap duplicate save in #35?

**What I learned:** `setBusy(true)` doesn't change `busy` until the next render. If two taps land before React re-renders, both see `busy === false` and both save. `useRef` changes `.current` right away, so the second tap sees `true` and stops. Rule of thumb: use state for things the screen shows, and a ref for instant flags the UI doesn't need to display.

---

## Phase 6: More concept questions while reading the code

### Prompt 14
> What does AsyncStorage actually do, and why does the store JSON.stringify everything under one key?

**What I learned:** It's a key-value store that only holds strings, like localStorage on the web. On iOS, it's saved in the app's own sandboxed files, so it survives closing the app. Keeping `{ topics, ideas }` under one key (`idea-storer/v1`) means every save is one write, so topics and ideas can't get out of sync. The `v1` leaves room to change the format later.

### Prompt 15
> Why do I need useSafeAreaInsets? Why not just put padding at the bottom?

**What I learned:** Different iPhones have different notches and home indicator heights. `useSafeAreaInsets()` gives the real numbers for the current device, so the + New Idea button uses `paddingBottom: Math.max(insets.bottom, 16)`. A hard-coded number would look right on one phone and wrong on another.

### Prompt 16
> Why is there a StoreProvider context wrapping the whole app instead of each screen loading its own data? And why FlatList instead of .map()?

**What I learned:** If every screen loaded its own data, the Home counts would go stale after you saved an idea in the editor. A React context keeps one shared copy, and every screen using `useStore()` re-renders when it changes. `FlatList` only renders the rows that are on screen and handles the 2-column grid with `numColumns={2}`. `.map()` inside a ScrollView renders everything at once.

---

## Phase 7: Polish and docs

### Prompt 17: Polish and docs
> Walk through every acceptance criterion with me on my iPhone and fix anything that looks off. Then write the README in my tone: what the app does, each screen, how to run it (SDK 58, Expo Go on iPhone), what I did with every review finding, and one thing that surprised me. Add an Expo Snack link so people can open the app from the GitHub repo.

# SPEC.md: Idea Storer

## What this is
Idea Storer is a small iOS app for saving ideas the second you have them and sorting them by topic. I get random ideas all the time, like a table that cleans itself with some specific technology, and they end up scattered across Notes, texts to myself, and my head. This app gives every idea a home. That table idea goes under **Home**. A study app idea goes under **School**.

## Platform and setup
- Expo SDK 58 (whatever `package.json` says), Expo Router, TypeScript.
- Runs in Expo Go on the iOS Simulator on my Mac.
- Navigation is a **stack**, not tabs. Remove the starter tab layout and the starter Explore screen.
- Local storage uses `@react-native-async-storage/async-storage`, installed with `npx expo install`.
- No backend, no accounts, no network calls.

## Data
There are two kinds of things: topics and ideas.

**Topic**
- `id`: string
- `name`: string, 1 to 24 characters
- `emoji`: a single emoji picked from a short preset list
- `isPreset`: boolean

**Idea**
- `id`: string
- `title`: string, required, 1 to 80 characters
- `details`: string, optional, up to 1000 characters
- `topicId`: string, matches a topic id
- `createdAt`: number (ms timestamp)
- `updatedAt`: number (ms timestamp)

**Preset topics** (created on first launch, can't be deleted or renamed):
🏠 Home, 📚 School, 💼 Work, 💻 Tech, 🎲 Random

Everything is saved under one AsyncStorage key (`idea-storer/v1`) as JSON: `{ topics: Topic[], ideas: Idea[] }`. The app saves after every change, so nothing depends on a Save All button.

## Screens

### 1. Home (`src/app/index.tsx`)
- Header title: "Idea Storer".
- A short line under the header with the total count, like "12 ideas across 6 topics".
- A grid (2 columns) of topic cards. Each card shows the emoji, the topic name, and how many ideas are in it.
- Tapping a topic card opens the Topic screen for that topic.
- A big yellow "+ New Idea" button pinned at the bottom of the screen. It opens the Idea Editor with no topic picked.
- A small "+ Topic" button in the header's right side. It opens the New Topic screen.
- If there are zero ideas total, show a friendly empty message above the grid: "No ideas yet. Tap + New Idea when one hits."

### 2. Topic (`src/app/topic/[id].tsx`)
- Header title is the topic emoji and name.
- A list of ideas in this topic, newest first (sorted by `createdAt`, newest at the top).
- Each row shows the idea title (1 line, cut off with "..."), the first line of details if there are any (1 line, gray), and a short date like "Nov 22".
- Tapping a row opens the Idea Editor for that idea.
- A "+ Add idea here" button at the bottom. It opens the Idea Editor with this topic already picked.
- If the topic has no ideas, show: "Nothing in [Topic name] yet."
- For a custom topic only, the header right has a "Delete" button. It shows a confirm alert. On confirm, the topic is deleted, its ideas move to 🎲 Random, and the app goes back to Home.

### 3. Idea Editor (`src/app/idea/[id].tsx`, where `id` is `new` for a new idea)
- Header title is "New Idea" or "Edit Idea".
- A title text input (required) with placeholder "What's the idea?" It gets focus automatically on a new idea.
- A multiline details text input with placeholder "Details, how it would work, why it matters..."
- A topic picker shown as a horizontal row of chips (emoji + name). The picked chip is filled in with the main color.
- A "Save" button. It's disabled (faded) while the title is empty or only spaces.
- For an existing idea, a red "Delete idea" text button at the bottom with a confirm alert.
- Character counters under each input once you get within 20 characters of the limit.

### 4. New Topic (`src/app/topic/new.tsx`, shown as a modal)
- A name text input with placeholder "Topic name".
- A row of about 12 emoji choices to pick from. One is picked by default.
- A "Create" button, disabled while the name is empty.
- Can't make a topic with the same name as an existing one (not case sensitive). Show an inline red message "You already have a topic called [name]."

## Look and feel
- Light mode only, so it looks the same everywhere.
- Colors: background `#FAF7F0` (warm off-white), main `#3D3B8E` (indigo), accent `#FFC857` (lightbulb yellow), text `#1F1D36`, gray text `#6B6880`, danger `#D64545`.
- Cards and rows have rounded corners (12 to 16), white backgrounds, and a light shadow.
- Text is at least 15pt for body and 28pt bold for the Home header.
- Buttons are at least 44pt tall so they're easy to tap.
- Respect the safe area (notch and home indicator).

## Error handling
- If loading from storage fails or the JSON is broken, the app starts with just the preset topics and doesn't crash. It logs the error with `console.warn`.
- If saving fails, show an alert: "Couldn't save. Try again." The change stays on screen.
- If a screen gets an id that doesn't exist (like a deleted idea), show "This idea doesn't exist anymore" or "This topic doesn't exist anymore" with a button back to Home instead of crashing.
- Ideas with a `topicId` that doesn't match any topic show up under 🎲 Random.

## Acceptance criteria
1. On first launch, Home shows exactly 5 topic cards: Home, School, Work, Tech, Random, each with the right emoji and a count of 0.
2. On first launch, Home shows "No ideas yet. Tap + New Idea when one hits."
3. Tapping "+ New Idea" on Home opens the Idea Editor titled "New Idea" with an empty title field that has keyboard focus.
4. In the Idea Editor, the Save button is disabled when the title is empty or only spaces, and tapping it does nothing.
5. Typing "Self-cleaning table" as the title, "Uses UV-C light under the surface" as details, picking 🏠 Home, and tapping Save returns to the previous screen, and the Home card for Home now shows 1.
6. Tapping the Home topic card opens a screen titled "🏠 Home" that lists "Self-cleaning table" with its details preview and today's date.
7. When a topic has 2 or more ideas, the most recently created one is at the top of the list.
8. Tapping "+ Add idea here" on the School topic screen opens the Idea Editor with 📚 School already picked.
9. Tapping an existing idea opens "Edit Idea" with its title, details, and topic filled in. Changing the topic to 💻 Tech and saving moves it, so it disappears from the old topic list and shows up in Tech.
10. Tapping "Delete idea" and confirming removes the idea from its topic list and lowers the count on Home by 1. Tapping Cancel keeps it.
11. Tapping "+ Topic" on Home opens the New Topic screen. Entering "Music", picking 🎸, and tapping Create returns to Home with a new 🎸 Music card showing 0.
12. Trying to create a topic called "home" (any capitalization) shows "You already have a topic called home." and does not create it.
13. The Create button is disabled when the topic name is empty.
14. A custom topic screen shows a Delete button. Preset topic screens do not.
15. Deleting a custom topic that has 2 ideas moves both ideas into 🎲 Random (Random's count goes up by 2) and returns to Home without the deleted card.
16. After adding ideas and a custom topic, fully closing Expo Go and reopening the app shows all the same topics, ideas, and counts.
17. The Home summary line shows the right totals, like "3 ideas across 6 topics", and uses "1 idea" (singular) when there is one.
18. Titles longer than 80 characters can't be typed. Details longer than 1000 can't be typed.
19. Nothing on any screen is hidden under the notch or the home indicator on an iPhone simulator.
20. The app opens with no red error screen and no yellow warning about missing routes or the removed Explore tab.

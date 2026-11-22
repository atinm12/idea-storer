# Code Review: Idea Storer vs SPEC.md

Reviewed: 2026-11-22. Scope: everything under `src/`, plus `app.json` and `package.json`.

How I checked it: I read the code. No simulator was available, so nothing was run on a device.
- `npx tsc --noEmit`: no errors.
- `EXPO_OFFLINE=1 npx expo lint`: no errors or warnings.

Anything that only shows up at runtime (warnings, layout, focus behavior) is judged from the code and says so.

Legend: **[PASS]** the code clearly does it. **[FAIL]** the code does not do it, or does it wrong. **[WARN]** it works, but there is a risk, a gap, or a quality problem.

---

## A. Acceptance criteria

1. **[PASS] AC1: five preset cards with count 0 on first launch.**
   - `src/lib/types.ts:30-36` defines Home, School, Work, Tech and Random with the right emoji.
   - On first launch `loadData` (`src/lib/storage.ts:102`) returns `defaultData()` (`storage.ts:19-21`).
   - `src/app/index.tsx:68` renders each card with `counts.get(id) ?? 0`, which shows as "0 ideas" (`index.tsx:93`).
   - Five cards is an odd number, so a blank spacer is added to keep the grid even (`index.tsx:27,70`). It is invisible.

2. **[PASS] AC2: empty message on first launch.**
   - `index.tsx:37-42` shows exactly "No ideas yet. Tap + New Idea when one hits." when `loaded && ideas.length === 0`.
   - It sits in the list header, above the grid, as the spec asks.

3. **[PASS] AC3: "+ New Idea" opens "New Idea" with a focused, empty title field.**
   - `index.tsx:29-30` pushes `/idea/new`.
   - `src/app/idea/[id].tsx:115` sets the header title to "New Idea" when there is no idea.
   - The title starts empty (`[id].tsx:69`) and has `autoFocus={!idea}` (`[id].tsx:133`).
   - Not verified at runtime that the keyboard actually appears in Expo Go.

4. **[PASS] AC4: Save disabled for an empty or spaces-only title.**
   - `canSave = title.trim().length > 0 && !busy` (`[id].tsx:76`).
   - `PrimaryButton` passes `disabled` to `Pressable` and fades it to opacity 0.4 (`src/components/primary-button.tsx:29,34,56-58`).
   - `handleSave` also returns early when `!canSave` (`[id].tsx:80`).

5. **[PASS] AC5: save "Self-cleaning table" under Home; Home card shows 1.**
   - `addIdea` (`src/lib/store.tsx:97-115`) adds the idea and waits for the storage write.
   - On success the editor goes back (`[id].tsx:94`).
   - Home counts come from live store data (`index.tsx:17-24`).
   - Both scroll views use `keyboardShouldPersistTaps="handled"` (`[id].tsx:118,162`), so tapping a chip while the keyboard is open selects it on the first tap.

6. **[PASS] AC6: Home topic screen lists the idea with its details preview and date.**
   - The title is `${emoji} ${name}`, i.e. "🏠 Home" (`src/app/topic/[id].tsx:79`).
   - Each row shows the title on one line with "..." (`topic/[id].tsx:129`) and the first details line in gray on one line (`topic/[id].tsx:132-136`, `src/lib/format.ts:15-17`).
   - The date is `shortDate` (`format.ts:4-9`), which gives "Nov 22" for the current year.

7. **[PASS] AC7: newest first.**
   - `topic/[id].tsx:24-26` filters, then sorts by `b.createdAt - a.createdAt`.
   - `filter` returns a new array, so the store array is not mutated.

8. **[PASS] AC8: "+ Add idea here" opens the editor with School already picked.**
   - `topic/[id].tsx:111` passes `topicId`.
   - `[id].tsx:37-41` checks that the topic exists and uses it as the starting pick.

9. **[PASS] AC9: edit an idea and move it to Tech.**
   - The form is prefilled from the idea (`[id].tsx:69-71`). If the idea's topic no longer exists, Random is shown as picked (`[id].tsx:38`).
   - `updateIdea` (`store.tsx:117-132`) changes `topicId`.
   - Both topic lists are worked out from live store data, so the idea disappears from the old list and appears in Tech.

10. **[PASS] AC10: delete an idea, with a working Cancel.**
    - There is a confirm alert with a Cancel button (`[id].tsx:99-110`).
    - Confirming calls `deleteIdea` (`store.tsx:134-140`), and Home's count drops by one.
    - Cancel uses `style: 'cancel'`, which only closes the alert.
    - See finding 25 for what happens when the save fails.

11. **[PASS] AC11: create a "Music" topic with 🎸.**
    - `/topic/new` is shown as a modal (`src/app/_layout.tsx:59-62`). The static route `topic/new` takes priority over `topic/[id]`.
    - 🎸 is in `TOPIC_EMOJIS` (`types.ts:39-41`).
    - Create calls `addTopic` and then `close()` (`src/app/topic/new.tsx:37-49`).
    - The new card shows "0 ideas".

12. **[PASS] AC12: "home" in any capitalization is rejected.**
    - `findTopicByName` compares lowercased, trimmed names (`store.tsx:46-49`).
    - The message is `You already have a topic called ${trimmed}.` in `Colors.danger` (`new.tsx:33-34,80-84,159-162`). For "home" this is exactly "You already have a topic called home."
    - Create is disabled while there is a duplicate (`new.tsx:35`), and `addTopic` checks again (`store.tsx:150-152`).

13. **[PASS] AC13: Create disabled while the name is empty.**
    - `canCreate` requires `trimmed.length > 0` (`new.tsx:35`), and `handleCreate` checks it (`new.tsx:38`).

14. **[PASS] AC14: Delete button only on custom topics.**
    - `onDelete` is `undefined` for preset topics (`topic/[id].tsx:60`), and `headerRight` is only set when `onDelete` exists (`topic/[id].tsx:80-89`).
    - The store also refuses to delete presets (`store.tsx:164`).

15. **[PASS] AC15: deleting a custom topic with 2 ideas.**
    - `deleteTopic` moves every idea with that `topicId` to `RANDOM_TOPIC_ID` and removes the topic (`store.tsx:160-173`).
    - The screen then goes Home with `goHome()`, which uses `router.dismissTo('/')` (`src/components/not-found.tsx:8-14`).
    - The alert also tells the user how many ideas will move (`topic/[id].tsx:35-40`).

16. **[PASS] AC16: data survives fully closing and reopening Expo Go.**
    - The whole state is written to `idea-storer/v1` after every change (`storage.ts:12,110-112`; `store.tsx:77-90`), and writes are queued so they land in order (`store.tsx:80-81`).
    - Save and Create wait for the write before going back, so a force-quit right after navigating does not lose data.
    - On launch the data is loaded and validated (`storage.ts:65-108`). Presets always come from code.
    - Not verified at runtime.

17. **[PASS] AC17: summary line with correct totals and singular "1 idea".**
    - `index.tsx:35` uses `pluralize` for both counts (`format.ts:11-13`), so it reads "1 idea across 6 topics" and "3 ideas across 6 topics".
    - The idea total includes ideas whose topic no longer exists, which matches the per-card totals because those ideas are counted under Random.

18. **[PASS] AC18: 80-character title and 1000-character details limits.**
    - Both inputs set `maxLength` (`[id].tsx:132,148`).
    - The store also cuts long values (`store.tsx:99,105,119,123`).
    - Note: `maxLength` counts UTF-16 code units, so an emoji counts as 2 (see finding 30).

19. **[PASS] AC19: nothing hidden under the notch or home indicator (judged from code).**
    - The top is handled by the native stack header on every screen.
    - The bottom bars use `Math.max(insets.bottom, 16)` (`index.tsx:74`, `topic/[id].tsx:107`).
    - The list content adds `56 + insets.bottom + 32` so the last row is not covered by the bar (`index.tsx:65`, `topic/[id].tsx:97`).
    - The editor, New Topic and NotFound screens pad by `insets.bottom` (`[id].tsx:123`, `new.tsx:61`, `not-found.tsx:19`).
    - Not checked on a simulator. On iOS, scroll views may also add their own bottom inset automatically. That would only add extra space; it would not hide anything.

20. **[PASS] AC20: no red error screen and no warning about missing routes or the Explore tab (static checks only).**
    - There is no `(tabs)` folder, no `explore` file, and no "tabs" or "explore" anywhere in `src/` or `app.json`.
    - Every `Stack.Screen name` in `_layout.tsx:50-62` matches a real file.
    - tsc and lint are both clean.
    - Runtime warnings can't be ruled out without running the app.

## B. Other spec requirements

21. **[PASS] Stack navigation; the starter tabs and Explore screen are gone.** `_layout.tsx:41-63` uses `Stack`.

22. **[PASS] AsyncStorage dependency.** `@react-native-async-storage/async-storage@2.2.0` matches `expo/bundledNativeModules.json`, which means it was installed with an Expo-compatible version.

23. **[PASS] Storage format.** One key, `idea-storer/v1`, holding JSON `{ topics, ideas }` (`storage.ts:12,110-112`). The app makes no network calls.

24. **[PASS] Preset topics can't be deleted or renamed.** There is no rename UI, `deleteTopic` refuses presets (`store.tsx:164`), and presets are always rebuilt from code on load (`storage.ts:65-96`).

25. **[PASS] Loading errors are caught.** A storage error or broken JSON is caught, logged with `console.warn`, and the app starts with just the presets (`storage.ts:99-108`). See findings 31 and 32 for the gaps.

26. **[PASS] Save failure in the editor.** `commit` shows `Alert.alert("Couldn't save. Try again.")` (`store.tsx:85-88`). The editor stays open with the user's text (`[id].tsx:93-94`), and a retry updates the same idea instead of making a copy (`[id].tsx:73,84-91`).

27. **[PASS] Ids that don't exist.** The editor shows "This idea doesn't exist anymore" (`[id].tsx:35`) and the Topic screen shows "This topic doesn't exist anymore" (`topic/[id].tsx:32`), each with a "Back to Home" button (`not-found.tsx:23`).

28. **[PASS] Ideas whose topic doesn't exist show under Random.** `effectiveTopicId` (`store.tsx:52-54`) is used for both the Home counts (`index.tsx:20`) and the topic lists (`topic/[id].tsx:25`).

29. **[PASS] Look and feel.**
    - Light mode only (`app.json:9`, `StatusBar style="dark"` in `_layout.tsx:39`).
    - The colors in `src/constants/theme.ts:1-10` match the spec exactly.
    - Corner radii are 16 and 12, backgrounds are white, and there is a light shadow (`theme.ts:12-16,28-34`).
    - Tap targets are at least 44pt: buttons 56 (`primary-button.tsx:45`), header buttons, chips and the delete button 44, emoji buttons 52.

30. **[PASS] Editor details.**
    - The placeholders are exactly as written in the spec (`[id].tsx:130,146`).
    - The picked chip is filled with the main color (`[id].tsx:262-265`).
    - The red "Delete idea" button only appears for existing ideas (`[id].tsx:198-205`).
    - The counters appear at `length >= max - 20` (`src/components/char-counter.tsx:7`).
    - If no topic is picked, a hint says the idea will go in 🎲 Random (`[id].tsx:182-186`). The spec doesn't say what should happen, so this is a reasonable choice.

31. **[PASS] New Topic details.** The placeholder is "Topic name" (`new.tsx:70`). There are exactly 12 emoji choices (`types.ts:39-41`), and 💡 is picked by default (`new.tsx:24`).

## C. Bugs, error handling and robustness

32. **[WARN] A failed load can lead to all saved data being overwritten.**
    - If `AsyncStorage.getItem` fails once or the JSON is unreadable, `loadData` falls back to `defaultData()` (`storage.ts:104-107`).
    - The first change after that calls `commit`, which writes the near-empty state over the stored data (`store.tsx:77-80`).
    - The spec allows starting fresh, but nothing keeps the original data. Consider copying the raw string to a backup key before the first overwrite, or not saving until a load has succeeded.

33. **[WARN] Data with the wrong shape is dropped without a log.**
    - The spec says broken data should be logged with `console.warn`. JSON that parses but has the wrong shape is not logged:
      - `null`, an array, or `{}` (`storage.ts:67`)
      - a topic that fails `parseTopic` (`storage.ts:75-76`)
      - an idea that fails `parseIdea` (`storage.ts:89-90`)
    - All of these are dropped silently, and the trimmed result is saved on the next change.

34. **[WARN] Changing the emoji list later would delete custom topics.**
    - `parseTopic` rejects any custom topic whose emoji is not in `ALLOWED_EMOJIS` (`storage.ts:14-17,34`).
    - If `TOPIC_EMOJIS` is ever edited, existing topics with a removed emoji disappear on the next launch. Their ideas fall back to Random, and that is saved permanently on the next change.
    - Checking only that the emoji is a non-empty string would be safer.

35. **[WARN] A fast double-tap on Save can create a duplicate idea.**
    - The guard uses React state: `busy` and `savedId` (`[id].tsx:73-92`). Both are only seen after the next render.
    - Two taps in the same frame both see `savedId === null`, so `addIdea` runs twice. `addIdea` updates `dataRef` right away, so the second call adds a second copy.
    - Fix: track "in flight" and "saved id" in a `useRef`.
    - New Topic is safe from this because `addTopic` checks for duplicate names against `dataRef`.

36. **[WARN] When a save fails after delete or create, the screen leaves anyway and the change exists only in memory.**
    - Delete idea (`[id].tsx:104-107`), delete topic (`topic/[id].tsx:45-51`) and create topic (`new.tsx:46-48`) all ignore the result and navigate away.
    - The alert says "Try again", but there is nothing left to retry.
    - The change is lost if the app is closed, or saved silently with the next successful write. The spec's "the change stays on screen" is only really met in the editor.

37. **[WARN] A failed first save leaves a half-saved idea.**
    - When the first save of a new idea fails, the idea is already in the store (`store.tsx:110-112`) and appears on Home and in topic lists.
    - The editor still says "New Idea" and has no Delete button.
    - If the user goes back instead of retrying, the idea stays in memory but is not stored. It survives only if some later write succeeds.

38. **[WARN] The title's "next" key does nothing useful.**
    - The title input sets `returnKeyType="next"` (`[id].tsx:134`) but has no `onSubmitEditing` or ref to move focus to the details field.
    - Pressing "next" just closes the keyboard, which is misleading.

39. **[WARN] The splash screen can stay up forever.**
    - The splash hides only when `loaded` becomes true (`_layout.tsx:25-33`).
    - `loadData` handles errors, but if `getItem` never returns there is no timeout, so the splash never goes away.

40. **[WARN] Unsaved edits are lost on back.**
    - Swiping back or tapping back in the editor throws away typed text with no warning.
    - The spec doesn't require a warning, but for an app built to capture ideas the moment you have them, losing one by accident is a real risk.

## D. UI and spec details

41. **[WARN] Some text is smaller than the 15pt minimum.** `CharCounter` uses 13pt (`char-counter.tsx:21`), and the "No topic picked yet" hint uses 13pt (`[id].tsx:275`). The spec says body text should be at least 15pt.

42. **[WARN] The topic name counter is almost always visible.**
    - The limit is 24, so `CharCounter` appears once 4 characters are typed (`new.tsx:85`, `char-counter.tsx:7`).
    - The spec only asks for counters in the Idea Editor. Here it is just noise.

43. **[WARN] The 28pt Home title is squeezed into a standard iOS nav bar.**
    - `_layout.tsx:54` sets `fontSize: 28` on a regular header, which sits next to "+ Topic".
    - It meets the spec literally, but `headerLargeTitle` is the native way to get a large title. Check that it isn't clipped on small iPhones.

44. **[WARN] Header titles appear late.**
    - The layout sets `title: ''` for `topic/[id]` and `idea/[id]` (`_layout.tsx:57-58`). The real title is only set from inside the screen (`topic/[id].tsx:77-79`, `[id].tsx:115`).
    - The header can be blank for a moment during the push animation.

45. **[WARN] The screen goes blank while a delete is running.**
    - `leaving` makes the screen return `null` (`[id].tsx:29-31`, `topic/[id].tsx:17,31`), so the body is empty while the delete waits for storage.
    - This avoids a flash of the NotFound screen, but shows an empty screen with an old header instead.

46. **[WARN] Character limits count UTF-16 code units, not characters.**
    - `maxLength` and the `.length` checks (`new.tsx:72`, `storage.ts:33`, `store.tsx:147`) count code units.
    - An emoji or accented character in a topic name uses up 2 or more of the 24.

## E. Code quality

47. **[WARN] Navigation helpers are duplicated and in the wrong place.**
    - `goBack` (`[id].tsx:21-24`) and `close` (`new.tsx:14-17`) are the same function.
    - `goHome` is a navigation helper, but it lives in the UI component file `src/components/not-found.tsx:8-14`.
    - Moving them to `src/lib/navigation.ts` would fix both.

48. **[WARN] The bottom bar is duplicated.**
    - `bottomBar` styles and layout are copied in `index.tsx:74-76,164-172` and `topic/[id].tsx:107-114,196-204`.
    - The padding `56 + insets.bottom + Spacing.xl` (`index.tsx:65`, `topic/[id].tsx:97`) hard-codes `PrimaryButton`'s `minHeight: 56` (`primary-button.tsx:45`). Changing the button height would silently break the padding.
    - A shared `<BottomBar>` component would fix this.

49. **[WARN] Other duplicated logic.**
    - `resolveTopicId` (`store.tsx:92-95`) and `effectiveTopicId` (`store.tsx:52-54`) do the same thing.
    - The text input and field/label styles are copied between `[id].tsx:220-235` and `new.tsx:136-155`.

50. **[WARN] Starter leftovers.**
    - `package.json` still lists packages nothing in `src/` imports: `@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-image`, `expo-device`, `expo-web-browser`, `react-native-reanimated`/`react-native-worklets`, and `react-native-gesture-handler`.
    - `app.json:24` keeps `"web": { "output": "server" }`.
    - `README.md` is still the create-expo-app boilerplate.
    - None of these break the iOS app, but they add noise.

51. **[PASS] TypeScript and lint are clean.** Strict TypeScript has no errors and ESLint has no findings. All hooks run before any early return, the store validates every action against `dataRef`, and the components have accessibility roles and labels.

---

## Summary

- **PASS: 32** (all 20 acceptance criteria, 11 other spec requirements, and clean TypeScript and lint)
- **FAIL: 0**
- **WARN: 19**

The biggest risks are:
- **Findings 32 and 34:** saved data can be permanently lost, either after a single failed load or after a future change to the emoji list.
- **Finding 35:** a fast double-tap on Save can create a duplicate idea.
- **Finding 36:** some failed saves leave changes only in memory, so they can disappear without the user knowing.

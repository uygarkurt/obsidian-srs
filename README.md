# obsidian-srs

A spaced repetition plugin for [Obsidian](https://obsidian.md/). Track your notes and review them on a schedule — the plugin shows you each note in full and asks you to grade how well you recalled it. The review interval is then adjusted automatically based on your response.

This is a fork of [martin-jw/obsidian-recall](https://github.com/martin-jw/obsidian-recall), significantly reworked with a single-sided review model and various improvements.

---

## How it works

1. **Track** the notes you want to memorize.
2. **Review** them when they come due — the full note is shown and you grade yourself.
3. The algorithm schedules the next review based on your grade.

Tracking data is stored in a separate `tracked_files.json` file, so your notes themselves are never modified.

---

## Installation

The plugin is not available in the Obsidian community plugin directory yet. Install it manually:

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/uygarkurt/obsidian-srs/releases).
2. In your vault, navigate to `.obsidian/plugins/` and create a folder called `obsidian-srs`.
3. Place the three downloaded files into that folder.
4. Open Obsidian → Settings → Community plugins → enable **obsidian-srs**.

---

## File explorer indicators

Every tracked note displays a small colored dot to the left of its name in the file explorer. The dot reflects how well you know that note based on its Anki ease value:

| Dot | Meaning |
|---|---|
| Gray | Never reviewed yet |
| Red | Struggling — ease below 1.9, or currently in the repeat queue |
| Orange | Hard — ease 1.9–2.3 |
| Blue | Good — ease 2.3–2.8 |
| Green | Easy — ease above 2.8 |

**Example:**

```
> Mathematics
    > Calculus
          Chain Rule               (no dot — untracked)
        🔴 Integration by Parts    (red — struggling)
        🟠 Taylor Series           (orange — hard)
        🔵 Limits                  (blue — good)
        🟢 Derivatives             (green — easy)
        ⚪ Fourier Transform        (gray — never reviewed)
```

The dot updates whenever the queue is built or a review session is completed.

---

## Tracking notes

Right-click any note or folder in the file explorer:

| Action | Description |
|---|---|
| **Track Note** | Add the note to the SRS |
| **Untrack Note** | Remove the note and reset all its progress |
| **Track All Notes** | Recursively track every note in a folder |
| **Untrack All Notes** | Recursively untrack every note in a folder |

Untracking a note permanently removes its review history.

---

## Ribbon button

A brain icon (🧠) in the left ribbon provides quick access to all plugin actions. Click it to open a dropdown menu:

| Item | Description |
|---|---|
| **Start Review** | Build the queue and begin a review session |
| **Show Tracked Notes** | Open the tracked notes list |
| **Build Queue** | Rebuild the review queue |
| *Queue: N due* | Current number of cards due (informational) |

> If the ribbon is not visible, enable it in **Settings → Appearance → Show ribbon**.

---

## Commands

All commands are available via the Command Palette (`Cmd/Ctrl + P`) under the `SRS:` prefix and can be bound to hotkeys in Settings → Hotkeys.

| Command | Description |
|---|---|
| **SRS: Review** | Build the queue and open the review view |
| **SRS: Track Note** | Track the currently active note |
| **SRS: Untrack Note** | Untrack the currently active note |
| **SRS: Update Note** | Refresh item data for the currently active note |
| **SRS: Build Queue** | Rebuild the review queue manually |
| **SRS: Show Tracked Notes** | Open a list of all tracked notes with their review status |

---

## Review

Run **SRS: Review** to start a session. The full note is shown and you grade yourself using the buttons at the bottom. The available grades depend on the algorithm selected:

- **Anki / SM2**: Again, Hard, Good, Easy
- **Leitner**: Wrong, Correct

The next review date is calculated automatically after each grade.

### Status bar

The status bar shows context-aware information:

- Viewing a **tracked note**: shows when it is next due for review.
- Viewing an **untracked note**: shows the total number of notes in the queue.
- **During review**: shows the number of items remaining in the session.

---

## Algorithms

Choose your algorithm in Settings → Algorithm. Switching algorithms after you have existing items may alter review intervals and requires a plugin reload.

### Anki

An implementation of the [Anki algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm.html). Shares its data format with SM2, so switching between the two is safe.

### SM2

An implementation of [SuperMemo's SM2](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2), the basis for Anki's algorithm. No additional settings. Shares data format with Anki.

### Leitner

An implementation of the [Leitner System](https://en.wikipedia.org/wiki/Leitner_system). Notes are sorted into stages, each with its own review interval. Correct answers advance a note to the next stage; incorrect answers return it to the first stage.

**Settings:**
- **Stages** — Number of stages.
- **Reset When Incorrect** — Move back to stage 1 on incorrect, or just one stage back.
- **Timings** — Review interval for each stage.

---

## Settings

| Setting | Description |
|---|---|
| **New Per Day** | Maximum number of new (never reviewed) notes added to the queue each day. Set to `-1` for unlimited. |
| **Repeat Items** | Re-queue items marked incorrect until they are answered correctly in the same session. |
| **Shuffle Queue** | Randomize the order of the review queue. |
| **Data Location** | Where to store `tracked_files.json` — in the vault root or the plugin folder. |
| **Algorithm** | Which SRS algorithm to use. |

---

## Credits

Based on [obsidian-recall](https://github.com/martin-jw/obsidian-recall) by [martin-jw](https://github.com/martin-jw), licensed under MIT.

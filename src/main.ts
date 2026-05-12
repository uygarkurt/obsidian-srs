import { TFolder, TFile, Plugin, Menu } from "obsidian";
import { DataStore } from "./data";
import { REVIEW_VIEW_TYPE, ReviewView } from "./view";
import SrsAlgorithm from "./algorithms";
import SrsSettingTab from "./settings";
import { SrsPluginSettings, DEFAULT_SETTINGS, algorithms } from "./settings";
import Commands from "./commands";
import { ItemSelector, SelectorType } from "./selection";

const DEBUG: boolean = true;

export default class ObsidianSrsPlugin extends Plugin {
    settings: SrsPluginSettings;
    store: DataStore;
    algorithm: SrsAlgorithm;

    commands: Commands;

    barItem: HTMLElement;
    private explorerObserver: MutationObserver | null = null;

    async onload() {
        console.log("Loading Obsidian Recall...");
        if (DEBUG) console.log("DEBUG");

        await this.loadSettings();

        this.algorithm = algorithms[this.settings.algorithm];
        this.algorithm.updateSettings(this.settings.algorithmSettings);

        this.store = new DataStore(this);
        await this.store.load();
        this.store.buildQueue();

        this.commands = new Commands(this);
        this.commands.addCommands();
        if (DEBUG) {
            this.commands.addDebugCommands();
        }

        this.barItem = this.addStatusBarItem();
        this.updateStatusBar();

        this.addRibbonIcon("brain", "Recall", (evt: MouseEvent) => {
            const menu = new Menu();

            menu.addItem((item) =>
                item
                    .setTitle("Start Review")
                    .setIcon("play")
                    .onClick(() => this.commands.startReview())
            );

            menu.addItem((item) =>
                item
                    .setTitle("Show Tracked Notes")
                    .setIcon("list")
                    .onClick(() => this.commands.showTrackedNotes())
            );

            menu.addItem((item) =>
                item
                    .setTitle("Build Queue")
                    .setIcon("refresh-cw")
                    .onClick(() =>
                        this.store.buildQueue().then(() => {
                            this.decorateFileExplorer();
                        })
                    )
            );

            menu.addSeparator();

            const queueSize = this.store.queueSize() + this.store.repeatQueueSize();
            menu.addItem((item) =>
                item
                    .setTitle(`Queue: ${queueSize} due`)
                    .setIcon("info")
                    .setDisabled(true)
            );

            menu.showAtMouseEvent(evt);
        });

        this.addSettingTab(new SrsSettingTab(this.app, this));

        this.registerEvents();

        this.registerView(REVIEW_VIEW_TYPE, (leaf) => {
            return new ReviewView(leaf, this);
        });

        this.registerInterval(
            window.setInterval(() => this.store.save(), 5 * 60 * 1000)
        );

        this.app.workspace.onLayoutReady(() => {
            this.decorateFileExplorer();
            this.observeFileExplorer();
        });
    }

    onunload() {
        console.log("Unloading Obsidian Recall. Saving tracked files...");
        this.store.save();
        this.explorerObserver?.disconnect();
    }

    async loadSettings() {
        this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());

        // Cast selectors to actual selector instances for suitable methods.
        // There's probably some better way to do this, maybe?
        let selectors: ItemSelector[] = [];
        this.settings.itemSelectors.forEach((selector) => {
            selectors.push(Object.assign(new ItemSelector(), selector));
        });

        this.settings.itemSelectors = selectors;
        if (DEBUG) {
            console.log("Loaded settings: ", this.settings);
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    updateStatusBar() {
        let view = this.app.workspace.getActiveViewOfType(ReviewView);
        this.barItem.removeClasses(["srs-bar-tracked"]);
        if (view) {
            let text =
                "Remaining: " +
                (this.store.queueSize() + this.store.repeatQueueSize());

            this.barItem.setText(text);
        } else {
            let file = this.app.workspace.getActiveFile();
            let text = "Queue: " + (this.store.queueSize() + this.store.repeatQueueSize());

            if (file == null) {
                this.barItem.setText("");
            } else {
                if (!this.store.isTracked(file.path)) {
                    this.barItem.setText("");
                } else if (this.store.isTracked(file.path)) {
                    const items = this.store.getItemsOfFile(file.path);
                    let mostRecent = Number.MAX_SAFE_INTEGER;
                    items.forEach((item) => {
                        if (item.nextReview < mostRecent) {
                            mostRecent = item.nextReview;
                        }
                    });

                    const now = new Date();
                    let diff = (mostRecent - now.getTime()) / (1000 * 60 * 60);
                    if (diff <= 0) {
                        text = "Next Review: Now!";
                    } else {
                        if (diff >= 24) {
                            diff /= 24;
                            text = "Next Review: " + diff.toFixed(1) + " days";
                        } else {
                            text = "Next Review: " + diff.toFixed(1) + " hours";
                        }
                    }

                    this.barItem.setText(text);
                    this.barItem.addClass("srs-bar-tracked");
                }
            }
        }
    }

    decorateFileExplorer() {
        setTimeout(() => {
            document
                .querySelectorAll(".srs-dot")
                .forEach((el) => el.remove());

            document
                .querySelectorAll<HTMLElement>(".nav-file-title")
                .forEach((el) => {
                    const path =
                        el.getAttribute("data-path") || el.dataset.path;
                    if (!path) return;
                    const cls = this.store.getFileIndicatorClass(path);
                    if (cls) {
                        const dot = document.createElement("span");
                        dot.className = `srs-dot ${cls}`;
                        const titleContent = el.querySelector(
                            ".nav-file-title-content"
                        );
                        if (titleContent) {
                            el.insertBefore(dot, titleContent);
                        } else {
                            el.prepend(dot);
                        }
                    }
                });
        }, 50);
    }

    observeFileExplorer() {
        const container = document.querySelector(".nav-files-container");
        if (!container) return;

        this.explorerObserver = new MutationObserver((mutations) => {
            const hasNewFiles = mutations.some((m) =>
                Array.from(m.addedNodes).some(
                    (n) =>
                        n instanceof HTMLElement &&
                        (n.classList.contains("nav-file-title") ||
                            n.querySelector(".nav-file-title"))
                )
            );
            if (hasNewFiles) this.decorateFileExplorer();
        });

        this.explorerObserver.observe(container, {
            childList: true,
            subtree: true,
        });
    }

    registerEvents() {
        this.registerEvent(
            this.app.workspace.on("file-open", (f) => {
                this.updateStatusBar();
            })
        );

        this.registerEvent(
            this.app.workspace.on("layout-change", () => {
                this.decorateFileExplorer();
            })
        );

        this.registerEvent(
            this.app.workspace.on("file-menu", (menu, file, source, leaf) => {
                if (file instanceof TFolder) {
                    const folder = file as TFolder;

                    menu.addItem((item) => {
                        item.setIcon("plus-with-circle");
                        item.setTitle("Track All Notes");
                        item.onClick((evt) => {
                            this.store.trackFilesInFolder(folder);
                            this.decorateFileExplorer();
                        });
                    });

                    menu.addItem((item) => {
                        item.setIcon("minus-with-circle");
                        item.setTitle("Untrack All Notes");
                        item.onClick((evt) => {
                            this.store.untrackFilesInFolder(folder);
                            this.decorateFileExplorer();
                        });
                    });
                } else if (file instanceof TFile) {
                    if (this.store.isTracked(file.path)) {
                        menu.addItem((item) => {
                            item.setIcon("minus-with-circle");
                            item.setTitle("Untrack Note");
                            item.onClick((evt) => {
                                this.store.untrackFile(file.path);
                                this.decorateFileExplorer();
                            });
                        });
                    } else {
                        menu.addItem((item) => {
                            item.setIcon("plus-with-circle");
                            item.setTitle("Track Note");
                            item.onClick((evt) => {
                                this.store.trackFile(file.path);
                                this.decorateFileExplorer();
                            });
                        });
                    }
                }
            })
        );

        this.registerEvent(
            this.app.vault.on("rename", (file, old) => {
                this.store.renameTrackedFile(old, file.path);
            })
        );

        this.registerEvent(
            this.app.vault.on("delete", (file) => {
                this.store.untrackFile(file.path);
            })
        );
    }
}

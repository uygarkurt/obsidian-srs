import {
    FileView,
    WorkspaceLeaf,
    ViewStateResult,
    ButtonComponent,
    MarkdownRenderer,
    TFile,
} from "obsidian";
import ObsidianSrsPlugin from "./main";

export const REVIEW_VIEW_TYPE = "store-review-view";
export type ReviewMode = "single" | "empty";

function openFile(view: ReviewView) {
    const leaf = view.app.workspace.getUnpinnedLeaf();
    leaf.setViewState({
        type: "markdown",
        state: {
            file: view.file.path,
        },
    });
    view.app.workspace.setActiveLeaf(leaf);
}

function reviewItem(view: ReviewView, option: string) {
    view.plugin.store.reviewId(view.item, option);
    const item = view.plugin.store.getNext();
    const state: any = { mode: "empty" };
    if (item != null) {
        const path = view.plugin.store.getFilePath(item);
        if (path != null) {
            state.file = path;
            state.item = view.plugin.store.getNextId();
            state.mode = "single";
        }
    }
    view.leaf.setViewState({
        type: REVIEW_VIEW_TYPE,
        state: state,
    });
}

export class ReviewView extends FileView {
    plugin: ObsidianSrsPlugin;

    wrapperEl: HTMLElement;

    singleSidedSubView: ReviewSingleSidedView;
    emptySubView: ReviewEmptyView;

    currentSubView: ReviewSubView;
    mode: ReviewMode;
    item: number;

    constructor(leaf: WorkspaceLeaf, plugin: ObsidianSrsPlugin) {
        super(leaf);

        this.plugin = plugin;

        let contentEl = this.containerEl.querySelector(
            ".view-content"
        ) as HTMLElement;
        this.wrapperEl = contentEl.createDiv("srs-review-wrapper");

        this.singleSidedSubView = new ReviewSingleSidedView(this);
        this.emptySubView = new ReviewEmptyView(this);

        this.currentSubView = this.emptySubView;
    }

    async setState(state: any, result: ViewStateResult): Promise<void> {
        this.mode = state.mode as ReviewMode;
        this.item = state.item;
        await super.setState(state, result);

        if (!this.file) {
            this.mode = "empty";
        }

        if (this.mode == null || this.mode == "empty") {
            this.currentSubView.hide();
            this.currentSubView = this.emptySubView;
            this.currentSubView.show();
            return;
        }

        this.currentSubView.hide();
        this.currentSubView = this.singleSidedSubView;
        this.currentSubView.show();

        this.app.vault.cachedRead(this.file).then(
            (content) => {
                this.currentSubView.set(this.file, content.trim());
            },
            (err) => {
                console.log("Unable to read item: " + err);
            }
        );
    }

    getState(): any {
        let state = super.getState();
        state.mode = this.mode;
        return state;
    }

    getViewType(): string {
        return REVIEW_VIEW_TYPE;
    }
}

export interface ReviewSubView {
    set(file: TFile, fullContent: string): void;
    show(): void;
    hide(): void;
}

export class ReviewEmptyView implements ReviewSubView {
    containerEl: HTMLElement;

    constructor(view: ReviewView) {
        this.containerEl = view.wrapperEl.createDiv("srs-review-empty");
        this.containerEl.hidden = true;
        this.containerEl.innerText = "Your queue is empty!";
    }

    set(file: TFile, fullContent: string) {}

    show() {
        this.containerEl.hidden = false;
    }

    hide() {
        this.containerEl.hidden = true;
    }
}

function registerLinkClickHandler(el: HTMLElement, view: ReviewView) {
    el.addEventListener("click", (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const anchor = target.closest("a");
        if (!anchor) return;

        const href = anchor.getAttribute("data-href") || anchor.getAttribute("href");
        if (!href) return;

        event.preventDefault();
        event.stopPropagation();

        if (anchor.classList.contains("internal-link")) {
            view.app.workspace.openLinkText(href, view.file?.path ?? "", false);
        } else {
            window.open(href, "_blank");
        }
    });
}

export class ReviewSingleSidedView implements ReviewSubView {
    containerEl: HTMLElement;
    noteEl: HTMLElement;
    titleEl: HTMLElement;
    bodyEl: HTMLElement;
    buttons: ButtonComponent[];
    view: ReviewView;

    constructor(view: ReviewView) {
        this.view = view;
        this.containerEl = view.wrapperEl.createDiv("srs-review-single");
        this.containerEl.hidden = true;

        this.noteEl = this.containerEl.createDiv("srs-full-note-content");
        this.titleEl = this.noteEl.createDiv("srs-full-note-title");
        this.bodyEl = this.noteEl.createDiv("srs-full-note-body markdown-preview-view markdown-rendered");
        registerLinkClickHandler(this.noteEl, view);

        let buttonDiv = this.containerEl.createDiv("srs-button-div");

        let buttonRow = buttonDiv.createDiv("srs-flex-row");
        let openFileRow = buttonDiv.createDiv("srs-flex-row");

        this.buttons = [];
        view.plugin.algorithm.srsOptions().forEach((s: string) => {
            this.buttons.push(
                new ButtonComponent(buttonRow)
                    .setButtonText(s)
                    .setCta()
                    .onClick(() => reviewItem(view, s))
                    .setClass("srs-review-button")
            );
        });

        new ButtonComponent(openFileRow)
            .setButtonText("Open File")
            .onClick(() => openFile(view))
            .setClass("srs-review-button");
    }

    set(file: TFile, fullContent: string) {
        this.titleEl.empty();
        this.bodyEl.empty();

        this.titleEl.createEl("h1", {
            text: file.basename,
        });

        MarkdownRenderer.renderMarkdown(
            fullContent,
            this.bodyEl,
            file.path,
            this.view
        );
    }

    show() {
        this.containerEl.hidden = false;
    }

    hide() {
        this.containerEl.hidden = true;
    }
}

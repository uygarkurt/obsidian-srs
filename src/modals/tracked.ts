import { ButtonComponent, Modal, TFile } from "obsidian";
import ObsidianSrsPlugin from "../main";
import { TrackedReviewItem } from "../data";

export class TrackedItemsModal extends Modal {
    plugin: ObsidianSrsPlugin;

    constructor(plugin: ObsidianSrsPlugin) {
        super(plugin.app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        const items = this.plugin.store.getTrackedReviewItems();

        contentEl.empty();
        contentEl.addClass("srs-tracked-modal");
        contentEl.createEl("h2", { text: "Tracked Notes" });

        if (items.length == 0) {
            contentEl.createEl("p", {
                text: "No notes are currently tracked.",
            });
            return;
        }

        const summary = contentEl.createDiv("srs-tracked-summary");
        summary.setText(
            items.length +
                " tracked " +
                (items.length == 1 ? "card" : "cards") +
                ", " +
                items.filter((item) => item.due).length +
                " due"
        );

        const list = contentEl.createDiv("srs-tracked-list");
        items.forEach((item) => this.addItemRow(list, item));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.removeClass("srs-tracked-modal");
    }

    private addItemRow(containerEl: HTMLElement, item: TrackedReviewItem) {
        const row = containerEl.createDiv("srs-tracked-item");

        const main = row.createDiv("srs-tracked-item-main");
        const title = main.createDiv("srs-tracked-title");
        title.setText(item.title);

        const path = main.createDiv("srs-tracked-path");
        path.setText(item.path);

        const meta = main.createDiv("srs-tracked-meta");
        meta.createSpan({
            text: this.formatReviewState(item),
            cls: item.due ? "srs-tracked-due" : "srs-tracked-not-due",
        });
        meta.createSpan({ text: this.formatStats(item) });

        const actions = row.createDiv("srs-tracked-actions");
        new ButtonComponent(actions)
            .setButtonText("Open")
            .onClick(() => this.openItem(item));
    }

    private openItem(item: TrackedReviewItem) {
        const file = this.app.vault.getAbstractFileByPath(item.path);
        if (!(file instanceof TFile)) {
            return;
        }

        const leaf = this.app.workspace.getUnpinnedLeaf();
        leaf.setViewState({
            type: "markdown",
            state: {
                file: file.path,
            },
        });
        this.app.workspace.setActiveLeaf(leaf);
        this.close();
    }

    private formatReviewState(item: TrackedReviewItem): string {
        if (item.repeating) {
            return "Repeat queue";
        }

        if (item.nextReview == 0) {
            return "New";
        }

        if (item.due) {
            return "Due now";
        }

        return "Next: " + this.formatRelativeTime(item.nextReview);
    }

    private formatStats(item: TrackedReviewItem): string {
        if (item.timesReviewed == 0) {
            return "Not reviewed yet";
        }

        return (
            item.timesCorrect +
            "/" +
            item.timesReviewed +
            " correct, streak " +
            item.errorStreak
        );
    }

    private formatRelativeTime(timestamp: number): string {
        const diffMs = timestamp - new Date().getTime();
        const absMs = Math.abs(diffMs);
        const hourMs = 1000 * 60 * 60;
        const dayMs = hourMs * 24;

        if (absMs < hourMs) {
            const minutes = Math.max(1, Math.round(absMs / (1000 * 60)));
            return diffMs >= 0 ? "in " + minutes + "m" : minutes + "m ago";
        }

        if (absMs < dayMs) {
            const hours = Math.round(absMs / hourMs);
            return diffMs >= 0 ? "in " + hours + "h" : hours + "h ago";
        }

        const days = Math.round(absMs / dayMs);
        return diffMs >= 0 ? "in " + days + "d" : days + "d ago";
    }
}

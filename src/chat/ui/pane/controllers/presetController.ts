/** Preset controller: persists and updates chat model preset selection. */
import { getSelectedPresetId, setSelectedPresetId } from "../../prefs/prefController";
import { buildPresetMenu } from "../elements/presetMenu";

/** Wraps the preset dropdown widget, syncing toolbar UI with stored prefs. */
export class PresetController {
  private widget: ReturnType<typeof buildPresetMenu>;

  constructor(
    doc: Document,
    toolbarRow: HTMLDivElement,
    onSelect: (id: string) => void,
  ) {
    const currentId = getSelectedPresetId();
    this.widget = buildPresetMenu(doc, currentId, (id) => {
      setSelectedPresetId(id);
      try {
        this.widget.setValue(id);
        this.widget.updateLabel(id);
      } catch {}
      onSelect(id);
    });
    toolbarRow.appendChild(this.widget.wrapper);
  }

  set(id: string): void {
    setSelectedPresetId(id);
    try {
      this.widget.setValue(id);
      this.widget.updateLabel(id);
    } catch {}
  }

  get(): string {
    return this.widget.getValue();
  }

  toggle(): void {
    this.widget.toggle();
  }
}

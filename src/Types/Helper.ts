
function SetPosition(Parent: HTMLElement, ContextMenu: HTMLElement): void {
    var box = Parent.getBoundingClientRect()
    ContextMenu.style.top = (box.height / 2) + "px";
}

function ShowContextMenu(Element: HTMLElement, ClickElement: HTMLElement) {
    if (Element.style.display == "block") {
        Element.style.display = 'none';
    } else {
        SetPosition(ClickElement, Element);
        Element.style.display = 'block';

        var ClickHandler = (evt: Event) => {
            var Target = evt.target as HTMLElement;
            window.removeEventListener('mousedown', ClickHandler);
            if (!Element.contains(Target) && Target != ClickElement && !ClickElement.contains(Target))
                ClickElement.dispatchEvent(new Event("click"));
        }
        window.addEventListener('mousedown', ClickHandler);
    }
}

function UpdateExcludeText(ContextMenuButton: HTMLElement, ContextMenu: HTMLElement): string {
    let IncludedTypes: string[] = JSON.parse(ContextMenuButton.dataset.included_types);
    Array.from(ContextMenu.children).forEach((ContextMenuItem: HTMLElement) => { ContextMenuItem.dataset.active = (IncludedTypes.includes(ContextMenuItem.dataset.type) ? "true" : ""); });
    if (IncludedTypes.length == 0) {
        return "nothing"
    } else if (IncludedTypes.length >= ContextMenu.children.length) {
        return "everything"
    } else if (IncludedTypes.length < (ContextMenu.children.length / 2)) {
        var IncludedTypeNames = Array.from(ContextMenu.children).filter((x: HTMLElement) => IncludedTypes.includes(x.dataset.type)).map((x: HTMLElement) => x.innerText + "s");
        return IncludedTypeNames.join(", ") + " only";
    }
    else {
        var IncludedTypeNames = Array.from(ContextMenu.children).filter((x: HTMLElement) => !IncludedTypes.includes(x.dataset.type)).map((x: HTMLElement) => x.innerText + "s");
        return "everything except " + IncludedTypeNames.join(", ")
    }
}

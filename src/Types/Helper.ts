
function SetPosition(Parent: HTMLElement, ContextMenu: HTMLElement): void {
    var box = Parent.getBoundingClientRect()
    ContextMenu.style.top = (box.top + window.scrollY + parseFloat(getComputedStyle(Parent).paddingBottom) + parseFloat(getComputedStyle(Parent).paddingTop) + 1).toString() + "px";
    ContextMenu.style.left = (box.left).toString() + "px";
}

function ShowContextMenu(Element: HTMLElement, ClickElement: HTMLElement) {
    if (Element.style.display == "block") {
        Element.style.display = 'none';
    } else {
        SetPosition(ClickElement, Element);
        Element.style.display = 'block';

        var ClickHandler = (evt: Event) => {
            var Target = evt.target as HTMLElement;
            if (!Element.contains(Target)) {
                window.removeEventListener('mousedown', ClickHandler);
                if (Target != ClickElement)
                    ClickElement.dispatchEvent(new Event("click"));
            }
        }
        window.addEventListener('mousedown', ClickHandler);
    }
}

function UpdateExcludeText(ContextMenuButton: HTMLElement, ContextMenu : HTMLElement) : string{
    let ExcludedTypes : string[] = JSON.parse(ContextMenuButton.dataset.excluded_types);
    Array.from(ContextMenu.children).forEach((ContextMenuItem: HTMLElement) => { ContextMenuItem.dataset.active = (ExcludedTypes.includes(ContextMenuItem.dataset.type) ? "" : "true");});
    if (ExcludedTypes.length == 0) {
        return "everything"
    } else if (ExcludedTypes.length >= ContextMenu.children.length) {
        return "nothing"
    } else if (ExcludedTypes.length > (ContextMenu.children.length / 2)) {
        var IncludedTypeNames = Array.from(ContextMenu.children).filter((x: HTMLElement) => !ExcludedTypes.includes(x.dataset.type)).map((x: HTMLElement) => x.innerText + "s");
        return IncludedTypeNames.join(", ") + " only";
    }
    else {
        var ExcludedTypeNames = Array.from(ContextMenu.children).filter((x: HTMLElement) => ExcludedTypes.includes(x.dataset.type)).map((x: HTMLElement) => x.innerText + "s");
        return "everything except " + ExcludedTypeNames.join(", ")
    }


}

class PastureKeyHandler {
    constructor() {
        this.arrowHandlerMap = {
            ArrowUp: () => this.onArrowUp(),
            ArrowDown: () => this.onArrowDown(),            
            ArrowLeft: () => this.onArrowLeft(),
            ArrowRight: () => this.onArrowRight()
        }

        window.addEventListener('keydown', e => this.__documentOnKeyDown(e), true)
    }

    __documentOnKeyDown(e) {
        if (this.arrowHandlerMap[e.code]) {
            this.arrowHandlerMap[e.code]()
            e.stopPropagation()
        }

        if (e.code === "Backquote") {
            if (e.shiftKey)
                this.onArrowLeft()
            else
                this.onArrowRight()

            e.stopPropagation()
        }
    }
}

let tabs = undefined
let selectedIndex = undefined

let tabList = document.createElement('div')
tabList.classList.add('tab-list')
document.body.appendChild(tabList)

chrome.windows.getCurrent(window => {
    chrome.runtime.getBackgroundPage(function ({tabShepherd}) {
        chrome.tabs.query({}, actualTabs => {
            tabShepherd.actualize(actualTabs)
            tabs = tabShepherd.getTabs(window.id)
            tabs.forEach((tab, index) => tabList.appendChild(createTabItem(tab, index)))
            selectNewTabItem(tabList.children.length > 1 ? 1 : 0)
        })
    })    
})

var pastureKeyHandler = new PastureKeyHandler()
pastureKeyHandler.onArrowRight = () => selectNextTab() 
pastureKeyHandler.onArrowLeft = () => selectPreviousTab() 
pastureKeyHandler.onArrowUp = () => selectTabOnPreviousRow()
pastureKeyHandler.onArrowDown = () => selectTabOnNextRow()

function selectNextTab() {
    selectNewTabItem(selectedIndex + 1)
}

function selectPreviousTab() {
    selectNewTabItem(selectedIndex - 1)
}

function selectTabOnPreviousRow() {
    let newIndex = findClosestTab(true)
    newIndex !== undefined && selectNewTabItem(newIndex)
}

function selectTabOnNextRow() {
    let newIndex = findClosestTab(false)
    newIndex !== undefined && selectNewTabItem(newIndex)
}

function selectNewTabItem(index) {
    let newSelectedTabItem = tabList.children[index]
    if (!newSelectedTabItem)
        return

    let selectedTabItem = tabList.children[selectedIndex]
    if (selectedTabItem) 
        selectedTabItem.classList.remove('tab-list-item-selected')

    newSelectedTabItem.classList.add('tab-list-item-selected')
    newSelectedTabItem.scrollIntoView({
        behavior: "smooth",     //"auto"  | "instant" | "smooth",
        block:    "end"         //"start" | "end",
    })
    selectedIndex = index    
}

function findClosestTab(below) {
    let index, 
        start = below ? 0 : selectedIndex + 1,
        end = below ? selectedIndex - 1 : tabs.length - 1, 
        distance = Number.MAX_VALUE,
        selectedRect = tabList.children[selectedIndex].getBoundingClientRect(),
        heightRow = selectedRect.bottom - selectedRect.top

    for (let i = start; i <= end; i++) {
        let rect = tabList.children[i].getBoundingClientRect()
        if (Math.abs(selectedRect.top - rect.top) < heightRow)
            continue
        let newDistance = Math.sqrt(Math.pow(selectedRect.left - rect.left, 2) +  Math.pow(selectedRect.top - rect.top, 2))
        if (newDistance < distance) {
            index = i
            distance = newDistance 
        }
    }
    return index
}

function createTabItem(tab, index) {
    let tabItem = document.createElement('div')
    tabItem.classList.add('tab-list-item')
    tabItem.appendChild(createTitleContainer(tab))
    tab.screenShotDataUrl && tabItem.appendChild(createScreenShot(tab))
    tabItem.onclick = () => selectNewTabItem(index)
    return tabItem
}

function createTitleContainer(tab) {
    let title = document.createElement('div')
    title.classList.add('tab-list-item-title')

    let favicon = document.createElement('img')
    favicon.classList.add('tab-list-item-title-favicon')

    if (tab.favIconUrl) {
        favicon.src = tab.favIconUrl
        title.appendChild(favicon)    
    }

    let titleText = document.createElement('span')
    titleText.innerText = tab.title
    title.appendChild(titleText)
    return title
}

function createScreenShot(tab) {
    let screenShot = document.createElement('img')
    screenShot.classList.add('tab-list-item-screen-shot')
    screenShot.src = tab.screenShotDataUrl;
    return screenShot
}
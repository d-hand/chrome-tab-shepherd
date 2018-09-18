(async () => {

    class PastureKeyHandler {
        constructor() {
            this.arrowHandlerMap = {
                ArrowUp: () => this.onArrowUp(),
                ArrowDown: () => this.onArrowDown(),            
                ArrowLeft: () => this.onArrowLeft(),
                ArrowRight: () => this.onArrowRight()
            }
    
            window.addEventListener('keydown', e => this.__onKeyDown(e), true)
            window.addEventListener('keyup', e => this.__onKeyUp(e), true)
        }
    
        __onKeyDown(e) {
            if (this.arrowHandlerMap[e.code]) 
                this.arrowHandlerMap[e.code]()
            
            if (e.code === "Backquote" && e.shiftKey) 
                this.onArrowLeft()               
            
            if (e.code === "Backquote" && !e.shiftKey)
                this.onArrowRight()
        }
    
        __onKeyUp(e) {
            if (e.key === "Control") 
                this.onControlUp()
        }    
    }


    let tabs = undefined
    let selectedIndex = undefined
    
    let tabList = document.createElement('div')
    tabList.classList.add('tab-list')
    document.body.appendChild(tabList);
    

    let {tabShepherd} = await browser.runtime.getBackgroundPage()
    tabs = await tabShepherd.getTabs()
    tabs.forEach((tab, index) => tabList.appendChild(createTabItem(tab, index)))
    selectNewTabItem(tabList.children.length > 1 ? 1 : 0)

    let pastureKeyHandler = new PastureKeyHandler()
    pastureKeyHandler.onArrowRight = () => selectNextTab() 
    pastureKeyHandler.onArrowLeft = () => selectPreviousTab() 
    pastureKeyHandler.onArrowUp = () => selectTabOnPreviousRow()
    pastureKeyHandler.onArrowDown = () => selectTabOnNextRow()
    pastureKeyHandler.onControlUp = () => switchBrowserTab()
    
    async function switchBrowserTab() {
        if (tabs && tabs[selectedIndex]) {        
            let activeTabs = await browser.tabs.query({active: true, currentWindow: true})
            browser.tabs.sendMessage(activeTabs[0].id, { switchTab: { id: tabs[selectedIndex].id } })
        }        
    }
    
    function selectNextTab() {
        selectNewTabItem(selectedIndex + 1)
    }
    
    function selectPreviousTab() {
        selectNewTabItem(selectedIndex - 1)
    }
    
    function selectTabOnPreviousRow() {
        let newIndex = findhClosestTab(0, 
                                       selectedIndex - 1, 
                                       (rect, selectedRect) => rect.bottom > selectedRect.top)
        selectNewTabItem(newIndex)
    }
    
    function selectTabOnNextRow() {
        let newIndex = findhClosestTab(selectedIndex + 1, 
                                       tabs.length - 1, 
                                       (rect, selectedRect) => rect.top < selectedRect.bottom)
        selectNewTabItem(newIndex)
    }
    
    function selectNewTabItem(index) {
        let newSelectedTabItem = tabList.children[index]
        if (!newSelectedTabItem)
            return
    
        newSelectedTabItem.focus()
        selectedIndex = index    
    }
    
    function findhClosestTab(start, end, excludeCallback) {
        let index, 
            minDistance = Number.MAX_VALUE,
            selectedRect = tabList.children[selectedIndex].getBoundingClientRect()
    
        for (let i = start; i <= end; i++) {
            let rect = tabList.children[i].getBoundingClientRect()
            if (excludeCallback(rect, selectedRect))
                continue
            let newDistance = Math.sqrt(Math.pow(selectedRect.left - rect.left, 2) +  Math.pow(selectedRect.top - rect.top, 2))
            if (newDistance < minDistance) {
                index = i
                minDistance = newDistance 
            }
        }
        return index
    }
    
    function createTabItem(tab, index) {
        let tabItem = document.createElement('button')
        tabItem.classList.add('tab-list-item')
        tabItem.appendChild(createTitleContainer(tab))
        tab.screenShotDataUrl && tabItem.appendChild(createScreenShot(tab))
        tabItem.onclick = () => {
            selectNewTabItem(index)
            setTimeout(() => switchBrowserTab(), 100)
        }
        return tabItem
    }
    
    function createTitleContainer(tab) {
        let title = document.createElement('div')
        title.classList.add('tab-list-item-title')
    
        let favicon = document.createElement('img')
        favicon.classList.add('tab-list-item-title-favicon')
        favicon.src = tab.favIconDataUrl ? tab.favIconDataUrl : "images/default-favicon.ico"
        title.appendChild(favicon)    
    
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

})();
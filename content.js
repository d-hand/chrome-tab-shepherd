class TabShepherdKeyHandler {
    static __init() {
        TabShepherdKeyHandler.onShow = () => {}
        TabShepherdKeyHandler.onHide = () => {}
        TabShepherdKeyHandler.onArrowRight = () => {}
        TabShepherdKeyHandler.onArrowLeft = () => {}
        TabShepherdKeyHandler.onArrowUp = () => {}
        TabShepherdKeyHandler.onArrowDown = () => {}                

        TabShepherdKeyHandler.__wasShowed = false
        TabShepherdKeyHandler.arrowHandlerMap = {
            ArrowUp: () => TabShepherdKeyHandler.onArrowUp(),
            ArrowDown: () => TabShepherdKeyHandler.onArrowDown(),            
            ArrowLeft: () => TabShepherdKeyHandler.onArrowLeft(),
            ArrowRight: () => TabShepherdKeyHandler.onArrowRight()
        }

        window.addEventListener('keydown', TabShepherdKeyHandler.__documentOnKeyDown, true)
        window.addEventListener('keyup', TabShepherdKeyHandler.__documentOnKeyUp, true)
    }

    static __documentOnKeyDown(e) {
        if (e.code === "Backquote" && e.ctrlKey === true && !TabShepherdKeyHandler.__wasShowed) {
            TabShepherdKeyHandler.__wasShowed = true
            TabShepherdKeyHandler.onShow()
            e.stopPropagation()
        }

        if (TabShepherdKeyHandler.__wasShowed && e.code === "Backquote") {
            if (e.shiftKey)
                TabShepherdKeyHandler.onArrowLeft()
            else
                TabShepherdKeyHandler.onArrowRight()

            e.stopPropagation()
        }

        if (TabShepherdKeyHandler.__wasShowed && TabShepherdKeyHandler.arrowHandlerMap[e.code]) {
            TabShepherdKeyHandler.arrowHandlerMap[e.code]()
            e.stopPropagation()
        }
    }

    static __documentOnKeyUp(e) {
        if (TabShepherdKeyHandler.__wasShowed &&  e.key === "Control") {
            TabShepherdKeyHandler.__wasShowed = false
            TabShepherdKeyHandler.onHide()
        }
    }
}
TabShepherdKeyHandler.__init()

/*
    TODO 
        - тормозит когда много вкладок =(
        - переписать это говно на риакт (c Webpack-окм кончено)
        - подобрать огненный шрифт        
        - подумать над установкой (обновить все вкладки или фоном выполнить скрипт или...)
*/

let tabs = undefined
let selectedIndex = undefined

let iframe = document.createElement('iframe')
iframe.style.cssText = `
    position: fixed;
    top: 5%;
    left: 5%;
    width: 90%;
    height: 90%;
    z-index: 2147483647;
    background: rgba(128, 128, 128, 0.8);
    border-radius: 15px;
`

let style = document.createElement('style');
style.type = 'text/css';
style.appendChild(document.createTextNode(`
    body {
        overflow: hidden;
    }

    .loader {
        border: 16px solid #f3f3f3;
        border-radius: 50%;
        border-top: 16px solid #3498db;
        width: 120px;
        height: 120px;  
        animation: spin 2s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .tab-list {
        width: 100%;
        min-height: 100%;
        background:  rgba(0, 0, 0, 0.0);    

        display: flex;
        flex-direction: row;                
        flex-wrap: wrap;                    /* Переносить элементы wrap или нет nowrap (еще бывыает wrap-reverse) */
        justify-content: space-around;      /* выравнивает flex-элементы по главной оси текущей строки flex-контейнера */
        align-items: center;                /* Flex-ЭЛЕМЕНТЫ могут быть выровнены вдоль поперечной оси текущей строки flex-контейнера, подобно justify-content, но в перпендикулярном направлении.*/
        align-content: space-around;        /* Выравнивает СТРОКИ flex-контейнера во flex-контейнере, когда есть дополнительное пространство по поперечной оси, подобно тому,  как justify-content выравнивает отдельные элементы по главной оси. */   
    }

    .tab-list-item {                
        width: 20%;
        border: 2px solid black;
        background: #cecece;
        border-radius: 15px;
        margin: 10px;
    }

    .tab-list-item-selected {
        background: white !important;
        border-color: white !important;
        box-shadow: 0px 0px 50px 30px rgba(255,255,255,0.8);
    }

    .tab-list-item-title {        
        height: 24px;
        padding: 3%;
        white-space: nowrap;        /* Запрещаем перенос строк */
        overflow: hidden;           /* Обрезаем все, что не помещается в область */
        text-overflow: ellipsis;    /* Добавляем многоточие */
    }

    .tab-list-item-title-favicon {
        height: 100%;
        margin-right: 4px;
        vertical-align: middle;
    }

    .tab-list-item-screen-shot {
        border-bottom-left-radius: inherit;
        border-bottom-right-radius: inherit;
        width: 100%;
        height: auto;
    }    
`));

let loader = document.createElement('div')
loader.classList.add('loader')

let tabList = document.createElement('div')
tabList.classList.add('tab-list')

iframe.onload = function() {    
    iframe.contentDocument.getElementsByTagName("head")[0].appendChild(style);    
    iframe.contentDocument.body.appendChild(tabList)    
    tabList.appendChild(loader);

    chrome.runtime.sendMessage(chrome.runtime.id, {getTabs: true}, (response) => {        
        tabs = response
        tabList.removeChild(loader)
        tabs.forEach((tab, index) => tabList.appendChild(createTabItem(tab, index)))
        selectNewTabItem(tabList.children.length > 1 ? 1 : 0)
    });                            
};

TabShepherdKeyHandler.onShow = () => activateTabShepherd()
TabShepherdKeyHandler.onHide  = () => switchBrowserTab()
TabShepherdKeyHandler.onArrowRight = () => selectNextTab() 
TabShepherdKeyHandler.onArrowLeft = () => selectPreviousTab() 
TabShepherdKeyHandler.onArrowUp = () => selectTabOnPreviousRow()
TabShepherdKeyHandler.onArrowDown = () => selectTabOnNextRow()

function activateTabShepherd() {
    document.body.appendChild(iframe)
}

function switchBrowserTab() {
    tabList.innerHTML = ''
    document.body.removeChild(iframe)
    if (tabs && tabs[selectedIndex])
        setTimeout(() => chrome.runtime.sendMessage(chrome.runtime.id, { selectedTabId: tabs[selectedIndex].id }), 100)
}

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
    tabItem.onclick = () => {
        selectNewTabItem(index)
        setTimeout(switchBrowserTab, 100)

    }      
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
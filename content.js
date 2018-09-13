class TabShepherdKeyHandler {
    constructor() {
        this.onShow = () => {}
        this.onHide = () => {}
        this.__wasShowed = false        

        window.addEventListener('keydown', e => this.__documentOnKeyDown(e), true)
        window.addEventListener('keyup', e => this.__documentOnKeyUp(e), true)
    }

    __documentOnKeyDown(e) {
        if (e.code === "Backquote" && e.ctrlKey === true && !this.__wasShowed) {
            this.__wasShowed = true
            this.onShow()
            e.stopPropagation()
        }
    }

    __documentOnKeyUp(e) {
        if (this.__wasShowed &&  e.key === "Control") {
            this.__wasShowed = false
            this.onHide()
        }
    }
}

/*
    TODO 
        - тормозит когда много вкладок =(
        - переписать это говно на риакт (c Webpack-окм кончено)
        - подобрать огненный шрифт        
        - подумать над установкой (обновить все вкладки или фоном выполнить скрипт или...)
*/

let iframe = document.createElement('iframe')
iframe.src = chrome.extension.getURL('pasture.html')
iframe.style.cssText = `
    position: fixed;
    top: 5%;
    left: 5%;
    width: 90%;
    height: 90%;
    z-index: 2147483647;
    background: rgba(128, 128, 128, 0.8);
    border-radius: 15px;
    /*webkit-border-radius: 15px;*/
`

iframe.onload = function() {    
};

var pastureKeyHandler = new TabShepherdKeyHandler()
pastureKeyHandler.onShow = () => activateTabShepherd()
pastureKeyHandler.onHide  = () => switchBrowserTab()

function activateTabShepherd() {
    document.body.appendChild(iframe)
}

function switchBrowserTab() {
    document.body.removeChild(iframe)
    // if (tabs && tabs[selectedIndex])
    //     setTimeout(() => chrome.runtime.sendMessage(chrome.runtime.id, { selectedTabId: tabs[selectedIndex].id }), 100)
}
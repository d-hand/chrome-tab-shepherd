/*
    TODO 
        - разобраться с ошибками
        - если работать в нескольких окнах теряются скриншоты
        - div -> button
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
`
iframe.onload = () => iframe.focus()

window.addEventListener('keydown', e => {
    if (e.code === "Backquote" && e.ctrlKey === true) {
        if (!document.body.contains(iframe)) {
            document.body.appendChild(iframe)            
        }
        e.stopPropagation()
    }    
}, true)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.hideTabShepherd) {
        document.body.removeChild(iframe)
    }
})
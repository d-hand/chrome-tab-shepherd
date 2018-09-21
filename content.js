/*
    TODO
        - переписать это говно на риакт (c Webpack-окм кончено)
        - в 3 версии добавить строку поиска
*/
if (!document.getElementById('tab-shepherd-alreadyinjected')) {
let d = document.createElement('div')
d.id='tab-shepherd-alreadyinjected'
d.style.display='none'
document.body.appendChild(d)

let  iframe = document.createElement('iframe')
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
    if (message.switchTab) {
        document.body.removeChild(iframe)
        chrome.runtime.sendMessage(chrome.runtime.id, message)
    }
})
}
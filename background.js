class TabShepherd {
    constructor() {
        this.__tabs = [];
        chrome.runtime.onMessage.addListener(message => {
            if (message.switchTab) 
                chrome.tabs.update(message.switchTab.id, {active: true, highlighted: true});                
        })
        chrome.windows.onCreated.addListener(() => 
            this.__actualize({})
        )
        chrome.tabs.onCreated.addListener(tab => 
            this.__actualize({tabId: tab.id})
        )        
        chrome.tabs.onActivated.addListener(({tabId}) => 
            this.__actualize({tabId: tabId, makeScreenShot: true})
        )
        chrome.tabs.onUpdated.addListener((tabId, changeInfo) => 
            changeInfo.status === 'complete' && this.__actualize({tabId: tabId, makeScreenShot: true, fetchFavIcon: true})
        )
        chrome.tabs.onDetached.addListener(tabId => 
            this.__actualize({tabId: tabId})
        )
        chrome.tabs.onAttached.addListener(tabId => 
            this.__actualize({tabId: tabId})
        )        
        chrome.tabs.onRemoved.addListener(tabId => 
            this.__actualize({tabId: tabId})
        )
    }

    getTabs(callback) {
        chrome.windows.getCurrent(window => {
            let tabs = this.__tabs.filter(tab => tab.windowId === window.id)
                                  .sort((tab1, tab2) => tab2.timestamp - tab1.timestamp)
            callback(tabs)
        })
    }    

    __actualize({tabId, makeScreenShot, fetchFavIcon}) {
        chrome.tabs.query({}, chromeTabs => {
            this.__tabs = this.__tabs.filter(tab => !!chromeTabs.find(actualTab => tab.id === actualTab.id))
            for (const chromeTab of chromeTabs) {
                let tab = this.__tabs.find(x => x.id === chromeTab.id)
                if (!tab) {
                    tab = {id: chromeTab.id}
                    this.__tabs.push(tab)
                }
                
                tab.windowId = chromeTab.windowId
                tab.title = chromeTab.title
                tab.url = chromeTab.url
    
                if (tab.id === tabId && fetchFavIcon || !tab.favIconDataUrl)
                    this.__setFavIconDataURL(tab, chromeTab.favIconUrl)
    
                if (tab.id === tabId && makeScreenShot)
                    this.__makeScreenShot(tab, chromeTab)
    
                if (tab.id === tabId)
                    tab.timestamp = Date.now()
            }    
        })
    }

    __makeScreenShot(tab, chromeTab) {        
        chrome.tabs.captureVisibleTab(chromeTab.windowId, { format: 'jpeg', quality: 100 }, dataUrl => {
            if(chrome.runtime.lastError) {
                console.info("Не удалось сделать скриншот", chromeTab)
                return
            }
            tab.screenShotDataUrl = dataUrl
        })
    }

    __setFavIconDataURL(tab, favIconUrl) {        
        if (!favIconUrl)             
            return

        let xhr = new XMLHttpRequest();
        xhr.open('GET', favIconUrl);
        xhr.responseType = 'blob';            
        xhr.onload = () => {
            let reader = new FileReader();
            reader.onloadend = () => {
                tab.favIconDataUrl = reader.result
            }
            reader.readAsDataURL(xhr.response);
        };

        xhr.send();
    }
}

var tabShepherd = new TabShepherd();
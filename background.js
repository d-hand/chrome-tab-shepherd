class TabShepherd {
    constructor() {
        this.__tabs = [];

        browser.runtime.onInstalled.addListener(async () => {
            let tabs = await browser.tabs.query({}) 
            tabs.filter(tab => tab.url !== "" && !tab.url.includes("chrome://"))
                .forEach(tab => browser.tabs.executeScript(tab.id, {file: "content.js"}))    
        })
        browser.runtime.onMessage.addListener(message => {
            if (message.switchTab) 
                browser.tabs.update(message.switchTab.id, {active: true, highlighted: true});                
        })
        browser.windows.onCreated.addListener(() => 
            this.__actualize({})
        )
        browser.tabs.onCreated.addListener(tab => 
            this.__actualize({tabId: tab.id})
        )        
        browser.tabs.onActivated.addListener(({tabId}) => 
            this.__actualize({tabId: tabId, makeScreenShot: true})
        )
        browser.tabs.onUpdated.addListener((tabId, changeInfo) => 
            changeInfo.status === 'complete' && this.__actualize({tabId: tabId, makeScreenShot: true, fetchFavIcon: true})
        )
        browser.tabs.onDetached.addListener(tabId => 
            this.__actualize({tabId: tabId})
        )
        browser.tabs.onAttached.addListener(tabId => 
            this.__actualize({tabId: tabId})
        )        
        browser.tabs.onRemoved.addListener(tabId => 
            this.__actualize({tabId: tabId})
        )
    }

    async getTabs() {
        let window = await browser.windows.getCurrent()
        return this.__tabs
            .filter(tab => tab.windowId === window.id)
            .sort((tab1, tab2) => tab2.timestamp - tab1.timestamp)
    }    

    async __actualize({tabId, makeScreenShot, fetchFavIcon}) {
        let actualTabs = await browser.tabs.query({})
        for (const actualTab of actualTabs) {
            let tab = this.__tabs.find(x => x.id === actualTab.id)
            if (!tab) {
                tab = {id: actualTab.id}
                this.__tabs.push(tab)
            }
            
            tab.windowId = actualTab.windowId
            tab.title = actualTab.title
            tab.url = actualTab.url

            if (tab.id === tabId && fetchFavIcon || !tab.favIconDataUrl)
                tab.favIconDataUrl = await this.__getFavIconDataURL(actualTab.favIconUrl)

            if (tab.id === tabId && makeScreenShot)
                tab.screenShotDataUrl = await this.__makeScreenShot(actualTab)

            if (tab.id === tabId)
                tab.timestamp = Date.now()
        }

        this.__tabs = this.__tabs.filter(tab => !!actualTabs.find(actualTab => tab.id === actualTab.id))
    }

    async __makeScreenShot(tab) {
        try 
        {
            if (tab.active && tab.url && !tab.url.includes("chrome://") && !tab.url.includes("chrome-extension://")) {
                return browser.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 100 })
            }            
        } 
        catch(error) 
        {
            console.log(error)
        }

        return Promise.resolve(undefined)
    }

    __getFavIconDataURL(favIconUrl) {
        return new Promise((resolve) => {
            if (!favIconUrl){
                resolve(undefined)
                return
            }                

            let xhr = new XMLHttpRequest();
            xhr.open('GET', favIconUrl);
            xhr.responseType = 'blob';            
            xhr.onload = () => {
                let reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result);
                }
                reader.onerror = () => resolve(undefined)
                reader.readAsDataURL(xhr.response);
            };
            xhr.onerror = () => resolve(undefined)
            xhr.send();       
        })
    }
}

var tabShepherd = new TabShepherd();
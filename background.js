class TabShepherd {
    constructor() {
        this.__tabs = [];

        browser.runtime.onInstalled.addListener(this.__onInstalled.bind(this));
        browser.windows.onCreated.addListener(this.__onWindowCreated.bind(this))
        browser.tabs.onCreated.addListener(this.__onTabCreated.bind(this))        
        browser.tabs.onActivated.addListener(this.__onTabActivated.bind(this))
        browser.tabs.onUpdated.addListener(this.__onTabUpdated.bind(this))
        browser.tabs.onDetached.addListener(this.__onTabDetached.bind(this))        
        browser.tabs.onAttached.addListener(this.__onTabAttached.bind(this))        
        browser.tabs.onRemoved.addListener(this.__onTabRemoved.bind(this))        
        browser.runtime.onMessage.addListener(this.__onMessage.bind(this))
    }

    async getTabs() {
        let window = await browser.windows.getCurrent()
        await this.__actualize()
        return this.__tabs
            .filter(tab => tab.windowId === window.id)
            .sort((tab1, tab2) => tab2.timestamp - tab1.timestamp)
    }    

    async __onInstalled() {
        let tabs = await browser.tabs.query({}) 
        tabs.filter(tab => tab.url !== "" && !tab.url.includes("chrome://"))
            .forEach(tab => browser.tabs.executeScript(tab.id, {file: "content.js"}))
    }

    async __onWindowCreated() {
        return this.__actualize()
    }

    __onTabCreated(tab) {
        this.__addFromTab(tab)
    }

    async __onTabActivated({tabId, windowId}){
        let screenShotDataUrl = await this.__makeScreenShot(tabId, windowId) 
        this.__update(tabId, {screenShotDataUrl})
    }

    async __onTabUpdated(tabId, changeInfo, {windowId, url, title, favIconUrl}) {
        if (changeInfo.status === 'complete') {
            let screenShotDataUrl = await this.__makeScreenShot(tabId, windowId)
            this.__update(tabId, {url, title, favIconUrl, screenShotDataUrl})
        }
    }

    __onTabDetached(tabId) {
        this.__update(tabId, {windowId: null})
    }

    __onTabAttached(tabId, {newWindowId}) {
        this.__update(tabId, {windowId: newWindowId})
    }

    __onTabRemoved(tabId) {
        this.__remove(tabId)
    }

    __onMessage(message, sender, sendResponse) {
        if (message.switchTab) {
            browser.tabs.update(message.switchTab.id, {active: true, highlighted: true});
        }
    }

    async __makeScreenShot(tabId, windowId) {
        let tab = await browser.tabs.get(tabId)
        if (tab.active && tab.url && !tab.url.includes("chrome://")) {
            return browser.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 100 })
        }
        return 
    }

    __addFromTab(tab) {
        this.__tabs.push({
            id: tab.id,
            windowId: tab.windowId,
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
            timestamp: Date.now()
        });    
    }

    __update(tabId, {windowId, url, title, favIconUrl, screenShotDataUrl}) {
        var tab = this.__tabs.find(x => x.id === tabId)
        if (tab) {
            tab.windowId = windowId === undefined ? tab.windowId : windowId
            tab.title = title === undefined ? tab.title : title
            tab.url = url === undefined ? tab.url : url
            tab.favIconUrl = favIconUrl === undefined ? tab.favIconUrl : favIconUrl
            tab.screenShotDataUrl = screenShotDataUrl === undefined ? tab.screenShotDataUrl : screenShotDataUrl
            tab.timestamp = Date.now()
        }
    }   

    __remove(tabId) {
        this.__tabs = this.__tabs.filter(x => x.id !== tabId);
    }

    async __actualize() {
        let actualTabs = await browser.tabs.query({})
        for (const actualTab of actualTabs) {
            const tab = this.__tabs.find(x => x.id === actualTab.id)

            if (!tab) {
                this.__addFromTab(actualTab)
                continue
            }
                
            if (tab.url !== actualTab.url) {
                this.__update(tab.id, {...actualTab, screenShotDataUrl: null})
                continue
            }                
        }
    
        this.__tabs = this.__tabs.filter(tab => !!actualTabs.find(actualTab => tab.id === actualTab.id))
    }
}

var tabShepherd = new TabShepherd();
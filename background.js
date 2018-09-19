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
        return this.__update(tab.id, {...tab})
    }

    async __onTabActivated({tabId, windowId}){
        let screenShotDataUrl = await this.__makeScreenShot(tabId, windowId) 
        return this.__update(tabId, {screenShotDataUrl})
    }

    async __onTabUpdated(tabId, changeInfo, {windowId, url, title, favIconUrl}) {
        if (changeInfo.status === 'complete') {
            let screenShotDataUrl = await this.__makeScreenShot(tabId, windowId)
            return this.__update(tabId, {url, title, favIconUrl, screenShotDataUrl})
        }
    }

    __onTabDetached(tabId) {
        return this.__update(tabId, {windowId: null})
    }

    __onTabAttached(tabId, {newWindowId}) {
        return this.__update(tabId, {windowId: newWindowId})
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
        try 
        {
            let tab = await browser.tabs.get(tabId)
            if (tab.active && tab.url && !tab.url.includes("chrome://")) {
                return browser.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 100 })
            }            
        } 
        catch(error) 
        {
            console.log(error)
        }

        return Promise.resolve(undefined)
    }

    async __update(tabId, {windowId, url, title, favIconUrl, screenShotDataUrl}) {
        try 
        {
            let tab = this.__tabs.find(x => x.id === tabId)
            if (!tab) {
                tab = {id: tabId}
                this.__tabs.push(tab)
            }
            
            tab.windowId = windowId === undefined ? tab.windowId : windowId
            tab.title = title === undefined ? tab.title : title
            tab.url = url === undefined ? tab.url : url
            tab.favIconDataUrl = favIconUrl === undefined ? tab.favIconDataUrl : await this.__getFavIconDataURL(favIconUrl)
            tab.screenShotDataUrl = screenShotDataUrl === undefined ? tab.screenShotDataUrl : screenShotDataUrl
            tab.timestamp = Date.now()      
        } 
        catch (error) 
        {
            console.log(error)
        }
    }   

    __remove(tabId) {
        this.__tabs = this.__tabs.filter(x => x.id !== tabId);
    }

    __getFavIconDataURL(favIconUrl) {
        return new Promise((resolve) => {
            if (!favIconUrl || favIconUrl.includes("chrome://"))
                resolve(undefined)

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

    async __actualize() {
        let actualTabs = await browser.tabs.query({})
        actualTabs.forEach(actualTab => this.__update(actualTab.id, {...actualTab}))
        this.__tabs = this.__tabs.filter(tab => !!actualTabs.find(actualTab => tab.id === actualTab.id))
    }
}

var tabShepherd = new TabShepherd();
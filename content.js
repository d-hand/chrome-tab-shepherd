class TabShepherdKeyHandler {
    static __init() {
        TabShepherdKeyHandler.onShow = () => {}
        TabShepherdKeyHandler.onHide = () => {}
        TabShepherdKeyHandler.onArrowRight = () => {}
        TabShepherdKeyHandler.onArrowLeft = () => {}
        TabShepherdKeyHandler.onArrowUp = () => {}
        TabShepherdKeyHandler.onArrowDown = () => {}                

        TabShepherdKeyHandler.__wasShown = false
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
        if (e.code === "Backquote" && e.ctrlKey === true && !TabShepherdKeyHandler.__wasShown) {
            TabShepherdKeyHandler.__wasShown = true
            TabShepherdKeyHandler.onShow()
            e.stopPropagation()
        } 

        if (TabShepherdKeyHandler.__wasShown && TabShepherdKeyHandler.arrowHandlerMap[e.code]) {
            TabShepherdKeyHandler.arrowHandlerMap[e.code]()
            e.stopPropagation()
        }
    }

    static __documentOnKeyUp(e) {
        if (TabShepherdKeyHandler.__wasShown &&  e.key === "Control") {
            TabShepherdKeyHandler.__wasShown = false
            TabShepherdKeyHandler.onHide()
        }
    }
}
TabShepherdKeyHandler.__init()

//debugger;

/*
    TODO 
        0) надо зафиксировать ширину вкладки, точно можно будте сказать сколько вкладок влезит на экран 
        1) подобрать огненный шрифт
        2) переписать это говно на риакт (c Webpack-окм кончено)
        3) дефолтный favicon и screenShot
        4) что-то сделать со скринами... мелко не видно ничего 
        5) выравнить title по середине favicon-а?
        6) сделать background persistent=true, а то кажется из-за этого теряется вся инфа о вкладках
        7) что делать если вкладок слишком много ?)
        8) строка детализации полный url или title ?)
        9) добваить тень!)
        11) обработать клик мыши 
        12) по нормальному считать  rowOffset
*/

var tabs = undefined
var rowOffset = undefined
var selectedIndex = undefined

var iframe = document.createElement('iframe')
iframe.style.cssText = `
    position: fixed;
    top: 5%;
    left: 5%;
    width: 90%;
    height: 90%;
    z-index: 2147483647;
    background: rgba(128, 128, 128, 0.7);
    /*border: 0;*/
    border-radius: 15px;
`

var style = document.createElement('style');
style.type = 'text/css';
style.appendChild(document.createTextNode(`
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

    .tabList {
        width: 100%;
        height: 100%;
    
        display: flex;
        flex-direction: row;                
        flex-wrap: wrap;                    /* Переносить элементы wrap или нет nowrap (еще бывыает wrap-reverse) */
        justify-content: space-around;      /* выравнивает flex-элементы по главной оси текущей строки flex-контейнера */
        align-items: center;                /* Flex-ЭЛЕМЕНТЫ могут быть выровнены вдоль поперечной оси текущей строки flex-контейнера, подобно justify-content, но в перпендикулярном направлении.*/
        align-content: space-around;        /* Выравнивает СТРОКИ flex-контейнера во flex-контейнере, когда есть дополнительное пространство по поперечной оси, подобно тому,  как justify-content выравнивает отдельные элементы по главной оси. */   
    
        background:  rgba(0, 0, 0, 0.0);    
    }

    .tabItem {
        background: rgba(0, 0, 0, 0.0);
        width: 256px;
        border-width: 2px;
        border-style: solid;
        border-radius: 15px;       
    }

    .tabItem-selected {
        border-color: blue;
    }

    .titleContainer {
        background: #cecece;
        border-bottom: 1px solid black;
        border-radius: 15px 15px 0px 0px;
        padding: 3%;
        white-space: nowrap;        /* Запрещаем перенос строк */
        overflow: hidden;           /* Обрезаем все, что не помещается в область */
        text-overflow: ellipsis;    /* Добавляем многоточие */
    }

    .favicon {
        margin-right: 4px;
    }

    .screenShot {
        border-radius: 0px 0px 15px 15px;
    }
    
`));

var loader = document.createElement('div')
loader.classList.add('loader')

var tabList = document.createElement('div')
tabList.classList.add('tabList')

iframe.onload = function() {
    tabList.innerHTML = ''
    iframe.contentDocument.getElementsByTagName("head")[0].appendChild(style);    
    iframe.contentDocument.body.appendChild(tabList)
    
    tabList.appendChild(loader);

    chrome.runtime.sendMessage(chrome.runtime.id, {getTabs: true}, (response) => {
        tabList.removeChild(loader)
        tabs = response        
        tabs.forEach(tab => tabList.appendChild(createTabItem(tab)))
        selectNewTabItem(tabList.children.length > 1 ? 1 : 0)        
        calculateRowOffset()        
    });


    function createTabItem(tab) {
        var tabItem = document.createElement('div')
        tabItem.classList.add('tabItem')
        tabItem.appendChild(createTitleContainer(tab))
        tabItem.appendChild(createScreenShot(tab))            
        return tabItem

    }

    function createTitleContainer(tab) {
        var container = document.createElement('div')
        container.classList.add('titleContainer')

        var favicon = document.createElement('img')
        favicon.classList.add('favicon')

        favicon.src = tab.favIconUrl || ""
        favicon.width = 16
        favicon.height = 16
        container.appendChild(favicon)

        var title = document.createElement('span')
        title.innerText = tab.title
        container.appendChild(title)
        
        return container
    }

    function createScreenShot(tab) {
        var screenShot = document.createElement('img')
        screenShot.classList.add('screenShot')
        screenShot.src = tab.screenShotDataUrl || ""
        screenShot.width = 256 
        screenShot.height = 128 

        return screenShot
    }

    function calculateRowOffset() {    
        let bottom = tabList.children[0].getBoundingClientRect().bottom;
        for (let i = 0; i < tabList.children.length; ++i) {
            let top = tabList.children[i].getBoundingClientRect().top
            if (top > bottom) {
                rowOffset = i
                return;            
            }
        }    
    }    
};


TabShepherdKeyHandler.onShow = () =>  {
    document.body.appendChild(iframe)
}

TabShepherdKeyHandler.onHide  = () => {
    document.body.removeChild(iframe)
    if (tabs && tabs[selectedIndex])
        chrome.runtime.sendMessage(chrome.runtime.id, { selectedTabId: tabs[selectedIndex].tabId });    
}

TabShepherdKeyHandler.onArrowRight = () => {
    selectNewTabItem(selectedIndex + 1)
}

TabShepherdKeyHandler.onArrowLeft = () => {
    selectNewTabItem(selectedIndex - 1)
}

TabShepherdKeyHandler.onArrowUp = () => {
    var newSelectedIndex = selectedIndex - rowOffset
    selectNewTabItem(newSelectedIndex >= 0 ? newSelectedIndex : selectedIndex)    
}

TabShepherdKeyHandler.onArrowDown = () => {
    var newSelectedIndex = selectedIndex + rowOffset
    selectNewTabItem(newSelectedIndex < tabList.children.length ? newSelectedIndex : tabList.children.length - 1)
}

function selectNewTabItem(index) {
    var newSelectedTabItem = tabList.children[index]
    if (!newSelectedTabItem)
        return

    var selectedTabItem = tabList.children[selectedIndex]
    if (selectedTabItem) 
        selectedTabItem.classList.remove('tabItem-selected')

    newSelectedTabItem.classList.add('tabItem-selected')
    selectedIndex = index    
}
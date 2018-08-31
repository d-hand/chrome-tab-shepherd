class TabShepherdUserMessage {
    static __init() {
        TabShepherdUserMessage.onShow = () => {}
        TabShepherdUserMessage.onHide = () => {}
        TabShepherdUserMessage.onArrowRight = () => {}
        TabShepherdUserMessage.onArrowLeft = () => {}
        TabShepherdUserMessage.onArrowUp = () => {}
        TabShepherdUserMessage.onArrowDown = () => {}                

        TabShepherdUserMessage.__wasShown = false
        TabShepherdUserMessage.arrowHandlerMap = {
            ArrowUp: () => TabShepherdUserMessage.onArrowUp(),
            ArrowDown: () => TabShepherdUserMessage.onArrowDown(),            
            ArrowLeft: () => TabShepherdUserMessage.onArrowLeft(),
            ArrowRight: () => TabShepherdUserMessage.onArrowRight()
        }

        document.body.onkeydown = TabShepherdUserMessage.__documentOnKeyDown
        document.body.onkeyup = TabShepherdUserMessage.__documentOnKeyUp
    }

    static __documentOnKeyDown(e) {
        if (e.code === "KeyQ" && e.ctrlKey === true && !TabShepherdUserMessage.__wasShown) {
            TabShepherdUserMessage.__wasShown = true
            TabShepherdUserMessage.onShow()
        } 

        if (TabShepherdUserMessage.__wasShown && TabShepherdUserMessage.arrowHandlerMap[e.code])
            TabShepherdUserMessage.arrowHandlerMap[e.code]()
    }

    static __documentOnKeyUp(e) {
        if (TabShepherdUserMessage.__wasShown &&  e.key === "Control") {
            TabShepherdUserMessage.__wasShown = false
            TabShepherdUserMessage.onHide()
        }
    }
}
TabShepherdUserMessage.__init()

//debugger;

/*
    TODO 
        0) ширина каждого элемента должна зависить от ширены экрана
        1) подобрать огненный шрифт
        2) переписать это говно на риакт (c Webpack-окм кончено)
        3) дефолтный favicon и screenShot
        4) что-то сделать со скринами... мелко не видно ничего 
        5) выравнить title по середине favicon-а?
        6) сделать background persistent=true, а то кажется из-за этого теряется вся инфа о вкладках
        7) что делать если вкладок слишком много ?)
        8) строка детализации полный url или title
        9) добваить тень!)
        10) все переписать %) если вкладок много то подтормаживает getTabs и выпилить лоудер
*/

var tabs = undefined
var rowOffset = undefined
var selectedIndex = undefined

var iframe = document.createElement('iframe')
iframe.style.cssText = `
    display: none;
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
var rules = document.createTextNode(`
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
    }`);    
style.appendChild(rules);
var loader = document.createElement('div')
loader.classList.add('loader')

var tabList = document.createElement('div')
tabList.style.cssText = `    
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: row;                
    flex-wrap: wrap;                    /* Переносить элементы wrap или нет nowrap (еще бывыает wrap-reverse) */
    justify-content: space-around;      /* выравнивает flex-элементы по главной оси текущей строки flex-контейнера */
    align-items: center;                /* Flex-ЭЛЕМЕНТЫ могут быть выровнены вдоль поперечной оси текущей строки flex-контейнера, подобно justify-content, но в перпендикулярном направлении.*/
    align-content: space-around;        /* Выравнивает СТРОКИ flex-контейнера во flex-контейнере, когда есть дополнительное пространство по поперечной оси, подобно тому,  как justify-content выравнивает отдельные элементы по главной оси. */   

    background:  rgba(0, 0, 0, 0.0);
`

iframe.onload = function() {
    iframe.contentDocument.body.appendChild(tabList)
    iframe.contentDocument.getElementsByTagName("head")[0].appendChild(style);
    
    TabShepherdUserMessage.onShow = () => show()
    TabShepherdUserMessage.onHide  = () => hide()
    TabShepherdUserMessage.onArrowRight = () => selectNext()
    TabShepherdUserMessage.onArrowLeft = () => selectPrevious()
    TabShepherdUserMessage.onArrowUp = () => selectTop()
    TabShepherdUserMessage.onArrowDown = () => selectBottom()
    
};  
document.body.appendChild(iframe)


function show() {
    tabList.innerHTML = ''
    tabList.appendChild(loader);
    iframe.style.display = 'block';
    
    chrome.runtime.sendMessage(chrome.runtime.id, {getTabs: true}, (response) => {
        tabList.removeChild(loader)
        tabs = response        
        tabs.forEach(tab => tabList.appendChild(createTabItem(tab)))
        selectNewTabItem(tabList.children.length > 1 ? 1 : 0)        
        calculateRowOffset()        
    });

    function createTabItem(tab) {
        var tabItem = document.createElement('div')
        tabItem.style.cssText = `
            background: rgba(0, 0, 0, 0.0);
            width: 256px;
            border: 1px solid black;
            border-radius: 15px;
        `
        tabItem.appendChild(createTitleContainer(tab))
        tabItem.appendChild(createScreenShot(tab))            
        return tabItem

    }

    function createTitleContainer(tab) {
        var container = document.createElement('div')
        container.style.cssText = `
            background: #cecece;
            border-bottom: 1px solid black;
            border-radius: 15px 15px 0px 0px;
            padding: 3%;
            white-space: nowrap;        /* Запрещаем перенос строк */
            overflow: hidden;           /* Обрезаем все, что не помещается в область */
            text-overflow: ellipsis;    /* Добавляем многоточие */
        `
        var favicon = document.createElement('img')
        favicon.style.cssText = `
            margin-right: 4px;
        `
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
        screenShot.style.cssText = `
        border-radius: 0px 0px 15px 15px;
        `
        screenShot.src = tab.screenShotDataUrl || ""
        screenShot.width = 256 //todo надо в % 
        screenShot.height = 128

        return screenShot
    }
}

function hide() {
    iframe.style.display = 'none';
    if (tabs && tabs[selectedIndex])
        chrome.runtime.sendMessage(chrome.runtime.id, { selectedTabId: tabs[selectedIndex].tabId });
}

function selectNext() {    
    selectNewTabItem(selectedIndex + 1)
}

function selectPrevious() {
    selectNewTabItem(selectedIndex - 1)
}

function selectTop() {
    var newSelectedIndex = selectedIndex - rowOffset
    selectNewTabItem(newSelectedIndex >= 0 ? newSelectedIndex : selectedIndex)
}

function selectBottom() {
    var newSelectedIndex = selectedIndex + rowOffset
    selectNewTabItem(newSelectedIndex < tabList.children.length ? newSelectedIndex : tabList.children.length - 1)
}

function selectNewTabItem(index) {
    var newSelectedTabItem = tabList.children[index]
    if (!newSelectedTabItem)
        return

    var selectedTabItem = tabList.children[selectedIndex]
    if (selectedTabItem) 
        selectedTabItem.style.border = newSelectedTabItem.style.border

    newSelectedTabItem.style.border = "2px solid blue"    
    selectedIndex = index    
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
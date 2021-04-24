'use strict';

const AppLogs = ({}) => {

    const s = {
        SELECTED_PAGE_IDX: 'SELECTED_PAGE_IDX',
        NUM_OF_PAGES: 'NUM_OF_PAGES',
        LOGS_TO_SHOW: 'LOGS_TO_SHOW',
    }

    const [state, setState] = useState(() => createNewState({}))

    function createNewState({prevState, params}) {
        const getParam = createParamsGetter({prevState,params})

        const logRecordsPerPage = APP_CONFIG.logRecordsPerPage
        let numOfPages = Math.floor(APP_LOG_EVENTS.length / logRecordsPerPage + (APP_LOG_EVENTS.length % logRecordsPerPage == 0 ? 0 : 1))
        numOfPages = numOfPages == 0 ? 1 : numOfPages
        let selectedPageIdx = getParam(s.SELECTED_PAGE_IDX, 0)
        if (selectedPageIdx < 0) {
            selectedPageIdx = 0
        }
        if (numOfPages < selectedPageIdx+1) {
            selectedPageIdx = numOfPages - 1
        }
        const minIdx = selectedPageIdx*logRecordsPerPage
        const maxIdx = minIdx + logRecordsPerPage - 1

        return createObj({
            [s.NUM_OF_PAGES]: numOfPages,
            [s.SELECTED_PAGE_IDX]: selectedPageIdx,
            [s.LOGS_TO_SHOW]: [...APP_LOG_EVENTS].reverse().filter((e,i) => minIdx <= i && i <= maxIdx)
        })
    }

    function renderPagination() {
        return re(Pagination,{
            numOfPages:state[s.NUM_OF_PAGES],
            curPage:state[s.SELECTED_PAGE_IDX]+1,
            onChange:newPageNum=>setState(prev=>createNewState({prevState:prev,params:{[s.SELECTED_PAGE_IDX]:newPageNum-1}}))
        })
    }

    function renderLogs() {
        return RE.table({},
            RE.tbody({},
                state[s.LOGS_TO_SHOW].map(logRec => RE.tr({key:`${logRec.time}-${logRec.level}-${logRec.msg}`},
                    RE.td({style:{color:logRec.level === LOG_LEVELS.error.name ? 'red' : 'black'}}, logRecordToString(logRec))
                ))
            )
        )
    }

    return RE.Container.col.top.left({},{},
        renderPagination(),
        renderLogs(),
        renderPagination(),
    )
}
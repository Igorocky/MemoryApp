'use strict';

const APP_CONFIG_VIEW_CONFIG_TAB = 'APP_CONFIG_VIEW_CONFIG_TAB'
const APP_CONFIG_VIEW_LOG_TAB = 'APP_CONFIG_VIEW_LOG_TAB'
const APP_CONFIG_VIEW_DEBUG_TAB = 'APP_CONFIG_VIEW_DEBUG_TAB'

const AppConfigView = ({}) => {


    const s = {
        SELECTED_TAB_KEY: 'SELECTED_TAB_KEY',
    }

    const [state, setState] = useState(() => createNewState({}))

    function createNewState({prevState, params}) {
        const getParam = createParamsGetter({prevState,params})

        return createObj({
            [s.SELECTED_TAB_KEY]: getParam(s.SELECTED_TAB_KEY, APP_CONFIG_VIEW_DEBUG_TAB),
        })
    }

    return renderTabs({
        tabs: [
            {
                key: APP_CONFIG_VIEW_CONFIG_TAB,
                label: 'App config',
                render: () => re(AppConfigTab)
            },
            {
                key: APP_CONFIG_VIEW_LOG_TAB,
                label: 'App logs',
                render: () => re(AppLogs)
            },
            {
                key: APP_CONFIG_VIEW_DEBUG_TAB,
                label: 'Debug',
                render: () => re(DebugTab)
            },
        ],
        selectedTabKey: state[s.SELECTED_TAB_KEY],
        onTabSelected: newTabKey => setState(prev => prev.set(s.SELECTED_TAB_KEY, newTabKey))
    })
}
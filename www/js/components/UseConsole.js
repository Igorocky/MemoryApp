"use strict";

function useConsole() {

    const s = {
        RECORDS: 'RECORDS',
    }

    const [state, setState] = useState(() => createNewState({}))

    function createNewState({prevState, params}) {
        function getParam(name,defValue) {
            const fromParams = params?.[name]
            if (fromParams !== undefined) {
                return fromParams
            }
            const fromPrevState = prevState?.[name]
            if (fromPrevState !== undefined) {
                return fromPrevState
            }
            return defValue
        }

        return createObj({
            [s.RECORDS]: [],
        })
    }

    function log({msg, color}) {
        if (hasValue(msg) && msg.trim() !== '') {
            setState(prev => prev.set(s.RECORDS, [{msg,color}, ...prev[s.RECORDS]]))
        }
    }

    function info(msg) {
        log({msg,color:'blue'})
    }

    function error(msg) {
        log({msg,color:'red'})
    }

    function clean() {
        setState(prev => prev.set(s.RECORDS, []))
    }

    function renderConsole() {
        return RE.table({style: {border:'solid 1px blue'}},
            RE.tbody({},
                RE.tr({},
                    RE.td({},
                        RE.Button({onClick: clean}, 'Clean console')
                    )
                ),
                state[s.RECORDS].map(record =>
                    RE.tr({},
                        RE.td({style:{color:record.color}}, record.msg)
                    )
                ),
            )
        )
    }

    return {renderConsole, log, info, error}
}

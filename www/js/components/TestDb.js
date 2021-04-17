"use strict";

function TestDb({}) {

    const s = {
        RECORDS: 'RECORDS',
    }

    const [state, setState] = useState(() => createNewState({}))
    const newRecordTextFieldRef = useRef(null)

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
            [s.RECORDS]: getParam(s.RECORDS,[]),
        })
    }

    function addNewRecord() {
        const newRecordText = newRecordTextFieldRef.current.value
        if (hasValue(newRecordText) && newRecordText.trim() !== '') {
            setState(prev => prev.set(s.RECORDS, [newRecordText, ...prev[s.RECORDS]]))
            newRecordTextFieldRef.current.value=''
        }
    }

    return RE.table({},
        RE.tbody({},
            RE.tr({},
                RE.td({},
                    RE.TextField(
                        {
                            inputRef:newRecordTextFieldRef,
                            variant: 'outlined', label: 'Add new record',
                            style: {width: 300},
                            size: 'small',
                            onKeyDown: event => {
                                if (event.nativeEvent.keyCode == 13) {
                                    addNewRecord()
                                }
                            }
                        }
                    )
                ),
                RE.td({},
                    RE.Button({
                            onClick: addNewRecord
                        },
                        'Add'
                    )
                )
            ),
            state[s.RECORDS].map(record =>
                RE.tr({},
                    RE.td({}, record)
                )
            )
        )
    )
}

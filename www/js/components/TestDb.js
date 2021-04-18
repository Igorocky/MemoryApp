"use strict";

function TestDb({}) {

    const BACKUP_FILE = 'state-backup.json'

    const s = {
        RECORDS: 'RECORDS',
        CORDOVA_FILE: 'CORDOVA_FILE',
    }

    const [state, setState] = useState(() => createNewState({}))
    const newRecordTextFieldRef = useRef(null)

    useEffect(() => {
        readRecordsFromDatabase()
    }, [])

    const con = useConsole()

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
            [s.ERRORS]: [],
            [s.CORDOVA_FILE]: JSON.stringify(cordova.file),
        })
    }

    function readRecordsFromDatabase() {
        readAllTags({
            onDone: tags => setState(prev => prev.set(s.RECORDS, tags))
        })
    }

    function addNewRecord() {
        const newRecordText = newRecordTextFieldRef.current.value
        if (hasValue(newRecordText) && newRecordText.trim() !== '') {
            saveTag({
                tag: {crt: new Date().getTime(), name: newRecordText},
                onDone: () => {
                    readRecordsFromDatabase()
                    newRecordTextFieldRef.current.value=''
                }
            })
        }
    }

    function backup() {
        writeStringToFile({
            file: BACKUP_FILE,
            string: JSON.stringify(state[s.RECORDS])
        })
    }

    function restore() {
        readStringFromFile({
            file:BACKUP_FILE,
            onLoad: newStateStr => setState(prev => prev.set(s.RECORDS, JSON.parse(newStateStr)))
        })
    }

    return RE.Fragment({},
        // RE.div({}, `data-dir: ${state[s.CORDOVA_FILE]?.replaceAll(',',', ')}`),
        con.renderConsole(),
        RE.table({},
            RE.tbody({},
                RE.tr({},
                    RE.td({},
                        RE.Button({onClick: backup}, 'backup')
                    ),
                    RE.td({},
                        RE.Button({onClick: restore}, 'restore')
                    )
                ),
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
                        RE.Button({onClick: addNewRecord}, 'Add')
                    )
                ),
                state[s.RECORDS].map(record =>
                    RE.tr({},
                        RE.td({}, record.name)
                    )
                )
            )
        )
    )
}

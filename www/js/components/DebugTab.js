"use strict";

const DebugTab = ({}) => {

    const inputDataTextFieldRef = useRef(null)

    useEffect(() => {
        // doAction()
    }, [])

    function doAction(inputText) {
        inputText = '{\n' +
            '  "dbVersion": 1,\n' +
            '  "tags": [\n' +
            '    {\n' +
            '      "name": "1",\n' +
            '      "color": "1",\n' +
            '      "priority": "1",\n' +
            '      "id": 1\n' +
            '    },\n' +
            '    {\n' +
            '      "id": 2,\n' +
            '      "name": "2",\n' +
            '      "color": "green",\n' +
            '      "priority": ""\n' +
            '    }\n' +
            '  ]\n' +
            '}'
        console.log("inputText = " + inputText)
        restoreDatabaseFromString({
            dbContentStr:inputText,
            onDone: errMsg => console.log("Database restore completed: errMsg = " + errMsg)
        })
    }

    return RE.Container.col.top.left({}, {style: {marginBottom:'10px'}},
        RE.Button({
            variant:"contained",
            color:'primary',
            onClick: () => doAction(inputDataTextFieldRef.current.value)
        }, 'Start'),
        RE.TextField(
            {
                variant: 'outlined', label: 'Input data', multiline: true, rowsMax: 100,
                style: {width: '400px'},
                inputRef:inputDataTextFieldRef
            }
        )
    )
}
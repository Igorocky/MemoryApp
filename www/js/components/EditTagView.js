"use strict";

const EditTagView = ({tag, onSave, onCancel}) => {

    const s = {}

    const [state, setState] = useState(() => createNewState({}))
    const tagNameTextFieldRef = useRef(null)
    const tagColorTextFieldRef = useRef(null)
    const tagPriorityTextFieldRef = useRef(null)

    useEffect(() => {
        tagNameTextFieldRef.current.value = tag?.name??''
    }, [tagNameTextFieldRef.current])

    useEffect(() => {
        tagColorTextFieldRef.current.value = tag?.color??''
    }, [tagColorTextFieldRef.current])

    useEffect(() => {
        tagPriorityTextFieldRef.current.value = tag?.priority??''
    }, [tagPriorityTextFieldRef.current])

    function createNewState({prevState, params}) {
        const getParam = createParamsGetter({prevState, params})

        return createObj({
            // [s.EXISTING_TAG]: tag,
            // [s.TAG_NAME]: tag?.name??'',
            // [s.TAG_COLOR]: tag?.color??'',
            // [s.TAG_PRIORITY]: tag?.priority??0,
        })
    }

    function save() {
        onSave({
            id: tag?.id,
            name: tagNameTextFieldRef.current.value,
            color: tagColorTextFieldRef.current.value,
            priority: tagPriorityTextFieldRef.current.value,
        })
    }

    return RE.Container.col.top.left({}, {},
        RE.TextField(
            {
                inputRef:tagNameTextFieldRef,
                variant: 'outlined', label: 'Tag name',
                style: {width: 300},
                size: 'small',
            }
        ),
        RE.TextField(
            {
                inputRef:tagColorTextFieldRef,
                variant: 'outlined', label: 'Tag color',
                style: {width: 300},
                size: 'small',
            }
        ),
        RE.TextField(
            {
                inputRef:tagPriorityTextFieldRef,
                variant: 'outlined', label: 'Tag priority',
                style: {width: 300},
                size: 'small',
            }
        ),
        RE.Container.row.right.center({},{},
            RE.Button({color:'primary', onClick: onCancel}, 'cancel'),
            RE.Button({variant:"contained", color:'primary', onClick: save}, 'save'),
        )
    )
}
"use strict";

const EditTagView = ({tag, onSave, onCancel}) => {

    const s = {}

    const [state, setState] = useState(() => createNewState({}))
    const tagNameTextFieldRef = useRef(null)
    const tagColorTextFieldRef = useRef(null)
    const tagPriorityTextFieldRef = useRef(null)

    useEffect(() => {
        tagNameTextFieldRef.current.value = tag?.name??''
        tagColorTextFieldRef.current.value = tag?.color??''
        tagPriorityTextFieldRef.current.value = tag?.priority??''

        tagNameTextFieldRef.current.focus()
    }, [])

    function createNewState({prevState, params}) {
        const getParam = createParamsGetter({prevState, params})

        return createObj({
        })
    }

    function save() {
        onSave({
            ...(tag??{}),
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
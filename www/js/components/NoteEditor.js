"use strict";

const NoteEditor = ({note, allTags, onSave, onCancel}) => {

    const s = {
        SELECTED_TAGS: 'SELECTED_TAGS',
    }

    const [state, setState] = useState(() => createNewState({}))
    const noteContentTextFieldRef = useRef(null)

    useEffect(() => {
        noteContentTextFieldRef.current.value = note?.text??''
    }, [noteContentTextFieldRef.current])

    function createNewState({prevState, params}) {
        const getParam = createParamsGetter({prevState, params})

        return createObj({
            [s.SELECTED_TAGS]: hasNoValue(note?.tags) ? [] : allTags.filter(tag => note.tags.includes(tag.id)),
        })
    }

    function save() {
        onSave({
            ...(note??{}),
            text: noteContentTextFieldRef.current.value,
            tags: state[s.SELECTED_TAGS],
        })
    }

    function renderTagSelector() {
        return RE.Paper({},
            RE.Container.col.top.left({},{},
                RE.Container.row.left.center({},{},
                    state[s.SELECTED_TAGS].map(tag => RE.Chip({
                        label: tag.name,
                        onDelete: () => null
                    }))
                )
            )
        )
    }

    function renderComponentContent() {
        return RE.Container.col.top.left({}, {},
            RE.TextField(
                {
                    inputRef:noteContentTextFieldRef,
                    multiline: true,
                    rowsMax: 10,
                    variant: 'outlined', label: 'Note content',
                    style: {width: 300},
                    size: 'small',
                }
            ),
            renderTagSelector(),
            RE.Container.row.right.center({},{},
                RE.Button({color:'primary', onClick: onCancel}, 'cancel'),
                RE.Button({variant:"contained", color:'primary', onClick: save}, 'save'),
            )
        )
    }


    return renderComponentContent()
}
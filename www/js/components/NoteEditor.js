"use strict";

const NoteEditor = ({note, allTags, onSave, onCancel}) => {

    const s = {
        SELECTED_TAGS: 'SELECTED_TAGS',
    }

    const [state, setState] = useState(() => createNewState({
        params: {
            [s.SELECTED_TAGS]: hasNoValue(note?.tags) ? [] : allTags.filter(tag => note.tags.includes(tag.id))
        }
    }))
    const noteContentTextFieldRef = useRef(null)

    useEffect(() => {
        noteContentTextFieldRef.current.value = note?.text??''
        noteContentTextFieldRef.current.focus()
    }, [])

    function createNewState({prevState, params}) {
        const getParam = createParamsGetter({prevState, params})

        return createObj({
            [s.SELECTED_TAGS]: getParam(s.SELECTED_TAGS, []),
        })
    }

    function save() {
        onSave({
            ...(note??{}),
            text: noteContentTextFieldRef.current.value,
            tags: state[s.SELECTED_TAGS].map(tag => tag.id),
        })
    }

    function renderTagSelector() {
        const selectedTags = state[s.SELECTED_TAGS]
        const selectedTagIds = selectedTags.map(tag => tag.id)
        const allTagsToShow = allTags.filter(tag => !selectedTagIds.includes(tag.id))
        return re(TagSelector,{
            allTags:allTagsToShow,
            selectedTags: selectedTags,
            onTagSelected: tag => {
                if (!selectedTagIds.includes(tag.id)) {
                    setState(prev => prev.set(s.SELECTED_TAGS, [...selectedTags, tag]))
                }
            },
            onTagRemoved: tag => {
                setState(prev => prev.set(s.SELECTED_TAGS, selectedTags.filter(t => t.id != tag.id)))
            },
        })
    }

    function renderComponentContent() {
        return RE.Container.col.top.left({}, {style: {marginBottom:'10px'}},
            RE.Container.row.right.center({},{},
                RE.Button({color:'primary', onClick: onCancel}, 'cancel'),
                RE.Button({variant:"contained", color:'primary', onClick: save}, 'save'),
            ),
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
            renderTagSelector()
        )
    }


    return RE.Paper({style:{padding:'5px'}},renderComponentContent())
}
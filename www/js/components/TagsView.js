"use strict";

let ALL_TAGS

const TagsView = () => {

    const s = {
        ALL_TAGS: 'ALL_TAGS',
        TAG_ID_TO_EDIT: 'TAG_ID_TO_EDIT',
    }

    const [state, setState] = useState(() => createNewState({}))

    useEffect(() => {
        if (hasNoValue(ALL_TAGS)) {
            reloadTags()
        }
    }, [])

    function createNewState({prevState, params}) {
        const getParam = createParamsGetter({prevState, params})

        return createObj({
            [s.ALL_TAGS]: ALL_TAGS,
            [s.TAG_ID_TO_EDIT]: getParam(s.TAG_ID_TO_EDIT, null),
        })
    }

    function reloadTags() {
        setState(prev => prev.set(s.ALL_TAGS, null))
        readAllTagsFromDatabase({
            onDone: tags => setState(prev => prev.set(s.ALL_TAGS, tags))
        })
    }

    function readAllTagsFromDatabase({onDone}) {
        readAllTags({
            onDone: tags => {
                ALL_TAGS = tags
                onDone?.(tags)
            }
        })
    }

    function addNewTag() {
        setState(prev => prev.set(s.TAG_ID_TO_EDIT, -100))
    }

    function editTag({id}) {
        setState(prev => prev.set(s.TAG_ID_TO_EDIT, id))
    }

    function closeEditTagDialog() {
        setState(prev => prev.set(s.TAG_ID_TO_EDIT, null))
    }

    function renderAllTagsList() {
        if (hasNoValue(state[s.ALL_TAGS])) {
            return "Loading tags..."
        } else {
            return RE.Container.col.top.left({},{},
                RE.Container.col.top.left({},{},
                    RE.Button({onClick: reloadTags}, 'Reload'),
                    RE.Button({onClick: addNewTag}, 'New tag'),
                ),
                RE.table({},
                    RE.tbody({},
                        state[s.ALL_TAGS].map(tag =>
                            RE.tr({key:tag.id},
                                RE.td({},
                                    RE.Button({
                                            style: {},
                                            onClick: () => editTag({id:tag.id}),
                                        },
                                        RE.Icon({style:{transform: "scaleX(-1)"}}, "play_arrow")
                                    )
                                ),
                                RE.td({}, tag.name),
                            )
                        )
                    )
                )
            )
        }
    }

    function renderEditTagDialog() {
        return re(EditTagView, {
            tag:(state[s.ALL_TAGS]??[]).find(tag => tag.id == state[s.TAG_ID_TO_EDIT]),
            onSave: tag => saveTag({
                tag,
                onDone: () => {
                    reloadTags()
                    closeEditTagDialog()
                }
            }),
            onCancel: closeEditTagDialog
        })
    }

    function renderContent() {
        if (hasValue(state[s.TAG_ID_TO_EDIT])) {
            return renderEditTagDialog()
        } else {
            return renderAllTagsList()
        }
    }

    return renderContent()
}
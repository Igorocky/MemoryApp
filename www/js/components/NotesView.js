"use strict";

const NotesView = ({}) => {

    const s = {
        ALL_TAGS: 'ALL_TAGS',
        ALL_NOTES: 'ALL_NOTES',
        NOTE_ID_TO_EDIT: 'NOTE_ID_TO_EDIT',
    }

    const [state, setState] = useState(() => createNewState({}))

    useEffect(() => {
        reloadNotes()
        reloadTags()
    }, [])

    function createNewState({prevState, params}) {
        const getParam = createParamsGetter({prevState, params})

        return createObj({
            [s.ALL_NOTES]: null,
            [s.NOTE_ID_TO_EDIT]: getParam(s.NOTE_ID_TO_EDIT, null),
        })
    }

    function reloadNotes() {
        setState(prev => prev.set(s.ALL_NOTES, null))
        readAllNotes({
            onDone: notes => setState(prev => prev.set(s.ALL_NOTES, notes))
        })
    }

    function reloadTags() {
        setState(prev => prev.set(s.ALL_TAGS, null))
        readAllTags({
            onDone: tags => setState(prev => prev.set(s.ALL_TAGS, tags))
        })
    }

    function addNewNote() {
        setState(prev => prev.set(s.NOTE_ID_TO_EDIT, -1))
    }

    function editNote({id}) {
        setState(prev => prev.set(s.NOTE_ID_TO_EDIT, id))
    }

    function closeEditNoteDialog() {
        setState(prev => prev.set(s.NOTE_ID_TO_EDIT, null))
    }

    function renderNote({note}) {
        if (state[s.NOTE_ID_TO_EDIT] == note.id) {
            return RE.Fragment({},
                RE.td({},
                    re(NoteEditor, {
                        note,
                        allTags: state[s.ALL_TAGS],
                        onSave: note => saveNote({
                            note,
                            onDone: () => {
                                reloadNotes()
                                closeEditNoteDialog()
                            }
                        }),
                        onCancel: closeEditNoteDialog
                    })
                )
            )
        } else {
            return RE.Fragment({},
                RE.td({},
                    RE.Button({
                            style: {},
                            onClick: () => editNote({id:note.id}),
                        },
                        RE.Icon({style:{transform: "scaleX(-1)"}}, "edit")
                    )
                ),
                RE.td({}, note.text),
            )
        }
    }

    function renderAllNotesList() {
        if (hasNoValue(state[s.ALL_NOTES]) || hasNoValue(state[s.ALL_TAGS])) {
            return 'Loading data...'
        } else {
            return RE.Container.col.top.left({},{},
                RE.table({},
                    RE.tbody({},
                        state[s.ALL_NOTES].map(note =>
                            RE.tr({key:note.id},
                                renderNote({note})
                            )
                        )
                    )
                )
            )
        }
    }

    function renderEditNoteDialog() {
        return re(NoteEditor, {
            note:(state[s.ALL_NOTES]??[]).find(note => note.id == state[s.NOTE_ID_TO_EDIT]),
            allTags: state[s.ALL_TAGS],
            onSave: note => saveNote({
                note,
                onDone: () => {
                    reloadNotes()
                    closeEditNoteDialog()
                }
            }),
            onCancel: closeEditNoteDialog
        })
    }

    function renderContent() {
        return RE.Container.col.top.left({},{},
            RE.Container.row.left.center({},{},
                RE.Button({onClick: reloadNotes}, 'Reload'),
                RE.Button({onClick: addNewNote}, 'New note'),
            ),
            (state[s.NOTE_ID_TO_EDIT] == -1)?renderEditNoteDialog():null,
            renderAllNotesList()
        )
    }

    return renderContent()
}
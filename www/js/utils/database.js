'use strict';

let db;

const DB_NAME = 'memory-app-db'
const DB_VERSION = 1
const TAGS_STORE = 'tags'
const NOTES_STORE = 'notes'

const dbLog = createLogger(LOGGERS.database)

function openDb({logger = dbLog}) {
    logger.debug(() => "openDb ...")
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function (evt) {
        db = req.result
    }
    req.onerror = function (err) {
        logger.error(() => `Open DB error: ` + JSON.stringify(err))
    }

    req.onupgradeneeded = function (evt) {
        logger.debug(() => 'openDb.onupgradeneeded')

        const tagsStore = evt.currentTarget.result.createObjectStore(TAGS_STORE, { keyPath: 'id', autoIncrement: true })
        tagsStore.createIndex('name', 'name', { unique: true })

        const notesStore = evt.currentTarget.result.createObjectStore(NOTES_STORE, { keyPath: 'id', autoIncrement: true })
        notesStore.createIndex('createdAt', 'createdAt', { unique: false })
    }
}

function withDatabase(dbConsumer) {
    withDatabaseCnt({dbConsumer,cnt:10})
}

function withDatabaseCnt({dbConsumer,cnt}) {
    if (cnt < 0) {
        dbLog.error(() => 'DB timeout error.')
    } else {
        if (hasNoValue(db)) {
            setTimeout(() => withDatabaseCnt({dbConsumer,cnt:cnt-1}), 1000)
        } else {
            dbConsumer(db)
        }
    }
}

function withTransaction({storeNames, isReadWrite, onError, onAbort, onComplete, action}) {
    withDatabase(db => {
        const transaction = db.transaction(storeNames, isReadWrite?"readwrite":undefined)
        transaction.onerror = err => {
            dbLog.error(() => `Transaction error ${err}`)
            onError?.(err)
        }
        transaction.onabort = err => {
            dbLog.error(() => `Transaction abort ${err}`)
            onAbort?.(err)
        }
        transaction.oncomplete = onComplete
        action(transaction)
    })
}

function readAllTags({onDone}) {
    readAllObjects({storeName: TAGS_STORE, onDone})
}

function saveTag({tag, onDone}) {
    withTransaction({
        storeNames: [TAGS_STORE],
        isReadWrite: true,
        onError: err => dbLog.error(() => `saveTag error: ` + JSON.stringify(err)),
        onComplete: () => {
            dbLog.debug(()=>`Tag on complete: ${JSON.stringify(tag)}`)
            onDone(tag)
        },
        action: transaction => {
            const objectStore = transaction.objectStore(TAGS_STORE)
            if (hasNoValue(tag.id)) {
                delete tag.id
                objectStore.add(tag)
            } else {
                objectStore.put(tag)
            }
        }
    })
}

function readAllNotes({onDone}) {
    readAllObjects({storeName:NOTES_STORE, onDone})
}

function readAllObjects({storeName, onDone}) {
    withTransaction({storeNames: [storeName], action: transaction => {
            const result = []

            transaction.objectStore(storeName).openCursor().onsuccess = cursorResult => {
                const cursor = cursorResult.target.result
                if (cursor) {
                    result.push(cursor.value)
                    cursor.continue()
                } else {
                    onDone(result)
                }
            }
        }
    })
}

function saveNote({note, onDone}) {
    withTransaction({
        storeNames: [NOTES_STORE],
        isReadWrite: true,
        onError: err => dbLog.error(() => `saveNote error: ` + JSON.stringify(err)),
        onComplete: () => {
            dbLog.debug(()=>`Note on complete: ${JSON.stringify(note)}`)
            onDone(note)
        },
        action: transaction => {
            const objectStore = transaction.objectStore(NOTES_STORE)
            if (hasNoValue(note.id)) {
                delete note.id
                note.createdAt = new Date().getTime()
                objectStore.add(note)
            } else {
                objectStore.put(note)
            }
        }
    })
}

function backupDatabase({fileName, onDone}) {
    readAllTags({
        onDone: tags => readAllNotes({
            onDone: notes => {
                const dbContent = {
                    dbVersion: DB_VERSION,
                    [TAGS_STORE]: tags,
                    [NOTES_STORE]: notes,
                }
                const dbContentStr = JSON.stringify(dbContent)
                writeStringToFile({
                    file:fileName,
                    string: dbContentStr,
                    onDone
                })
            }
        })
    })
}

function restoreDatabase({fileName, onDone}) {
    function error(msg) {
        dbLog.error(() => msg)
        onDone?.(msg)
    }
    readStringFromFile({
        file:fileName,
        onFileDoesntExist: () => {
            error(`The file to restore database from ${fileName} doesn't exist.`)
        },
        onLoad: dbContentStr => restoreDatabaseFromString({dbContentStr, onDone})
    })
}

function restoreDatabaseFromString({dbContentStr, onDone}) {
    function error(msg) {
        dbLog.error(() => msg)
        onDone?.(msg)
    }
    const dbContent = JSON.parse(dbContentStr)
    if (dbContent.dbVersion !== DB_VERSION) {
        error(`dbContent.dbVersion !== DB_VERSION: dbContent.dbVersion=${dbContent.dbVersion}, DB_VERSION=${DB_VERSION}`)
    }
    const newTags = dbContent[TAGS_STORE]
    if (!Array.isArray(newTags)) {
        error(`!Array.isArray(newTags)`)
    }
    const newNotes = dbContent[NOTES_STORE]
    if (!Array.isArray(newNotes)) {
        error(`!Array.isArray(newNotes)`)
    }

    function writeObjectsToStore({transaction,storeName,objects,onDone}) {
        const objectStore = transaction.objectStore(storeName)
        objectStore.clear().onsuccess = clearTagsRes => {
            function saveObject(idx) {
                if (idx < objects.length) {
                    objectStore.add(objects[idx]).onsuccess = () => {
                        saveObject(idx+1)
                    }
                } else {
                    objectStore.count().onsuccess = countRes => {
                        const countMatch = countRes.target.result === objects.length
                        onDone({countMatch})
                    }
                }
            }
            saveObject(0)
        }
    }

    let tagsCountMatch = false
    let notesCountMatch = false
    withTransaction({
        storeNames: [TAGS_STORE, NOTES_STORE],
        isReadWrite: true,
        onError: () => error(`Transaction errored.`),
        onAbort: () => error(`Transaction aborted.`),
        onComplete: () => {
            if (!tagsCountMatch) {
                error(`!tagsCountMatch`)
            } else if (!notesCountMatch) {
                error(`!notesCountMatch`)
            } else {
                onDone?.()
            }
        },
        action: transaction => {
            writeObjectsToStore({
                transaction,
                storeName: TAGS_STORE,
                objects: newTags,
                onDone: ({countMatch}) => {
                    tagsCountMatch = countMatch
                    if (!tagsCountMatch) {
                        transaction.abort()
                    }
                    writeObjectsToStore({
                        transaction,
                        storeName: NOTES_STORE,
                        objects: newNotes,
                        onDone: ({countMatch}) => {
                            notesCountMatch = countMatch
                            if (!notesCountMatch) {
                                transaction.abort()
                            }
                        }
                    })
                }
            })
        }
    })
}


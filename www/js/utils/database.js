'use strict';

let db;

const DB_NAME = 'memory-app-db'
const DB_VERSION = 1
const TAGS_STORE = 'tags'

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
    withDatabase(db => {
        const objectStore = db.transaction([TAGS_STORE]).objectStore(TAGS_STORE)
        const result = []

        objectStore.openCursor().onsuccess = function(event) {
            const cursor = event.target.result
            if (cursor) {
                result.push(cursor.value)
                cursor.continue()
            } else {
                onDone(result)
            }
        }
    })
}

function saveTag({tag, onDone}) {
    withDatabase(db => {
        const transaction = db.transaction([TAGS_STORE], "readwrite")
        transaction.oncomplete = function(event) {
            onDone(tag)
        }

        transaction.onerror = function(err) {
            dbLog.error(() => `saveTag error: ` + JSON.stringify(err))
        }

        const objectStore = transaction.objectStore(TAGS_STORE)
        if (hasNoValue(tag.id)) {
            delete tag.id
            objectStore.add(tag)
        } else {
            objectStore.put(tag)
        }
    })
}

function backupDatabase({fileName, onDone}) {
    readAllTags({
        onDone: tags => {
            const dbContent = {
                dbVersion: DB_VERSION,
                [TAGS_STORE]: tags
            }
            const dbContentStr = JSON.stringify(dbContent);
            writeStringToFile({
                file:fileName,
                string: dbContentStr,
                onDone
            })
        }
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

    let tagsCountMatch = false
    withTransaction({
        storeNames: [TAGS_STORE],
        isReadWrite: true,
        onError: () => error(`Transaction errored.`),
        onAbort: () => error(`Transaction aborted.`),
        onComplete: () => {
            if (!tagsCountMatch) {
                error(`!tagsCountMatch`)
            } else {
                onDone?.()
            }
        },
        action: transaction => {
            const tagsStore = transaction.objectStore(TAGS_STORE)
            tagsStore.clear().onsuccess = clearRes => {
                function saveTag(idx) {
                    if (idx < newTags.length) {
                        tagsStore.add(newTags[idx]).onsuccess = () => {
                            saveTag(idx+1)
                        }
                    } else {
                        tagsStore.count().onsuccess = countRes => {
                            tagsCountMatch = countRes.target.result === newTags.length
                            if (!tagsCountMatch) {
                                transaction.abort()
                            }
                        }
                    }
                }
                saveTag(0)
            }
        }
    })
}
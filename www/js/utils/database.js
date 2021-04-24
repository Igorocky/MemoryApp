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
    if (hasNoValue(db)) {
        //todo: add countdown
        setTimeout(() => withDatabase(dbConsumer), 1000)
    } else {
        dbConsumer(db)
    }
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
                tags
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
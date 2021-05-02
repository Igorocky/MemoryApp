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

        const database = evt.currentTarget.result

        const tagsStore = createObjectStore({database, storeName: TAGS_STORE})
        tagsStore.createIndex('name', 'name', { unique: true })

        const notesStore = createObjectStore({database, storeName: NOTES_STORE})
        notesStore.createIndex('createdAt', 'createdAt', { unique: false })
    }
}

function createObjectStore({database, storeName}) {
    return database.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
}

function withDatabase(dbConsumer) {
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
    withDatabaseCnt({dbConsumer,cnt:10})
}

function withTransaction({
                             transaction,
                             storeNames = [TAGS_STORE, NOTES_STORE],
                             isReadWrite = false,
                             onError,
                             onAbort,
                             onComplete,
                             action
}) {
    if (hasNoValue(transaction)) {
        withDatabase(db => {
            const transaction = db.transaction(storeNames, isReadWrite?"readwrite":undefined)
            transaction.onerror = err => {
                dbLog.error(() => `Transaction error: ${err}`)
                onError?.(err)
            }
            transaction.onabort = err => {
                dbLog.error(() => `Transaction abort: ${err}`)
                onAbort?.(err)
            }
            transaction.oncomplete = onComplete
            action(transaction)
        })
    } else {
        if (hasValue(onError) && onError !== transaction.onerror) {
            const existingOnError = transaction.onerror
            transaction.onerror = err => {
                onError?.(err)
                existingOnError?.(err)
            }
        }
        if (hasValue(onAbort) && onAbort !== transaction.onabort) {
            const existingOnAbort = transaction.onabort
            transaction.onabort = err => {
                onAbort?.(err)
                existingOnAbort?.(err)
            }
        }
        if (hasValue(onComplete) && onComplete !== transaction.oncomplete) {
            const existingOnComplete = transaction.oncomplete
            transaction.oncomplete = () => {
                onComplete?.()
                existingOnComplete?.()
            }
        }
        action(transaction)
    }
}

function readAllObjects({transaction, storeName, onProgress, onDone}) {
    withTransaction({transaction, storeNames: [storeName], action: transaction => {
        const result = []
        transaction.objectStore(storeName).openCursor().onsuccess = cursorResult => {
            const cursor = cursorResult.target.result
            if (cursor) {
                result.push(cursor.value)
                onProgress?.(result)
                cursor.continue()
            } else {
                onProgress?.(result)
                onDone(result)
            }
        }
    }})
}

function saveObject({transaction, storeName, obj, onSaved}) {
    withTransaction({transaction, storeNames: [storeName], isReadWrite: true, action: transaction => {
        const objectStore = transaction.objectStore(storeName)
        const onSuccess = res => onSaved({...obj, id: res.target.result})
        if (hasNoValue(obj.id)) {
            delete obj.id
            obj.createdAt = new Date().getTime()
            objectStore.add(obj).onsuccess = onSuccess
        } else {
            objectStore.put(obj).onsuccess = onSuccess
        }
    }})
}

function saveObjectInNewTransaction({storeName, obj, onTransactionComplete}) {
    let savedObject
    withTransaction({
        storeNames:[storeName],
        isReadWrite: true,
        onComplete: () => {
            if (hasNoValue(savedObject)) {
                throw new Error('hasNoValue(savedObject)')
            }
            onTransactionComplete(savedObject)
        },
        action: transaction => saveObject({
            transaction,
            storeName,
            obj,
            onSaved: objAfterSave => savedObject = objAfterSave
        })
    })
}

function saveAllObjectsInOneNewTransaction({objectsPerTransaction, storeName, numOfObjects, getObject, onObjectSaved, onAllObjectsSaved}) {
    let numOfObjectsCreated = 0
    let numOfObjectsSavedInTransaction = 0
    function onTransactionComplete() {
        commonLog.info(() => `############### Transaction completed for ${storeName} ###############`)
        if (numOfObjectsCreated >= numOfObjects) {
            onAllObjectsSaved()
        }
    }
    function saveRemainingObjects({transaction}) {
        withTransaction({
            transaction,
            isReadWrite: true,
            onComplete: onTransactionComplete,
            action: transaction => {
                saveObject({
                    transaction,
                    storeName,
                    obj: getObject(numOfObjectsCreated),
                    onSaved: () => {
                        onObjectSaved(numOfObjectsCreated)
                        numOfObjectsCreated++
                        numOfObjectsSavedInTransaction++
                        if (numOfObjectsCreated < numOfObjects) {
                            if (hasValue(objectsPerTransaction) && numOfObjectsSavedInTransaction >= objectsPerTransaction) {
                                numOfObjectsSavedInTransaction = 0
                                transaction = undefined
                            }
                            saveRemainingObjects({transaction})
                        }
                    }
                })
            }
        })
    }
    saveRemainingObjects({})
}

function backupDatabaseToString({storeNames, onProgress, onSuccess}) {
    onProgress?.(`backupDatabaseToString: Reading all the data to backup...`)
    function readAllData({storeNames,results,onDone}) {
        if (storeNames.length == 0) {
            onDone(results)
        } else {
            const storeNameToRead = storeNames.first()
            onProgress?.(`backupDatabaseToString: Start reading from ${storeNameToRead}...`)
            readAllObjects({
                storeName:storeNameToRead,
                onProgress: arr => {
                    if (arr.length % 100 == 0) {
                        onProgress?.(`backupDatabaseToString: Reading ${storeNameToRead} from the database... ${arr.length} ${storeNameToRead} read.`)
                    }
                },
                onDone: arr => {
                    readAllData({
                        storeNames: storeNames.rest(),
                        results: {...results, [storeNameToRead]: arr},
                        onDone
                    })
                }
            })
        }
    }

    readAllData({
        storeNames,
        results: {dbVersion: DB_VERSION},
        onDone: dbContent => {
            onProgress?.(`backupDatabaseToString: Stringifying all the data...`)
            const dbContentStr = JSON.stringify(dbContent)
            commonInfoLog.info(() => `backupDatabaseToString: dbContentStr.length = ${dbContentStr.length}`)
            onSuccess?.(dbContentStr)
        }
    })
}

function readAllTags({transaction,onDone}) {
    readAllObjects({transaction,storeName: TAGS_STORE, onDone})
}

function saveTag({tag, onDone}) {
    saveObjectInNewTransaction({
        storeName:TAGS_STORE,
        obj:tag,
        onTransactionComplete:onDone
    })
}

function readAllNotes({transaction,onDone}) {
    readAllObjects({transaction,storeName: NOTES_STORE, onDone})
}

function saveNote({note, onDone}) {
    saveObjectInNewTransaction({
        storeName:NOTES_STORE,
        obj:note,
        onTransactionComplete:onDone
    })
}

function backupDatabase({fileName, onProgress, onSuccess, onError}) {
    backupDatabaseToString({
        storeNames:[TAGS_STORE,NOTES_STORE],
        onProgress,
        onSuccess: dbContentStr => {
            if (isInBrowser()) {
                compareDatabaseWithBackupFromString({
                    bkpContentStr:dbContentStr,
                    onProgress,
                    onError: msg => onError?.(`Data comparison after backup failed in browser mode: ${msg}`),
                    onSuccess: () => onSuccess?.(`Database was successfully backed up in browser mode. dbContentStr.length=${dbContentStr.length}.`)
                })
            } else {
                onProgress?.(`backupDatabase: Writing all the data to file...`)
                writeStringToFile({
                    file:fileName,
                    string: dbContentStr,
                    onDone: () => {
                        onProgress?.(`backupDatabase: Comparing the database against the backup file...`)
                        compareDatabaseWithBackupFromFile({
                            fileName,
                            onProgress,
                            onError: msg => onError?.(`Data comparison after backup failed in smartphone mode: ${msg}`),
                            onSuccess: () => onSuccess?.(`Database was successfully backed up in smartphone mode. fileName=${fileName}.`)
                        })
                    }
                })
            }
        }
    })
}

function restoreDatabase({fileName, onDone}) {
    function error(msg) {
        dbLog.error(() => msg)
        onDone?.(msg)
        throw new Error(msg)
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
        throw new Error(msg)
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

function generateRandomData({numOfTags, numOfNotes}) {
    function randomSentence() {
        return ints(1,randomInt(3,10)).map(i => randomString({minLength:3,maxLength:10})).join(' ')
    }
    function randomTag() {
        return {
            name: randomString({minLength:5,maxLength:15}),
            color: randomString({minLength:5,maxLength:10}),
            priority: randomInt(0,20)
        }
    }
    function randomNote({tagIds}) {
        const numOfTags = randomInt(1,5)
        const selectedTagIds = []
        for (let i = 0; i < numOfTags; i++) {
            let tagIdx = randomInt(0,tagIds.length-1)
            while (selectedTagIds.includes(tagIds[tagIdx])) {
                tagIdx = randomInt(0,tagIds.length-1)
            }
            selectedTagIds.push(tagIds[tagIdx])
        }
        return {
            text: randomSentence(),
            tags: selectedTagIds
        }
    }
    function saveTags({onAllSaved}) {
        saveAllObjectsInOneNewTransaction({
            storeName: TAGS_STORE,
            numOfObjects: numOfTags,
            getObject: () => randomTag(),
            onObjectSaved: lastIdx => {
                const numOfTagsCreated = lastIdx+1
                if (numOfTagsCreated % 100 == 0) {
                    commonLog.info(() => `tags saved: ${numOfTagsCreated} of ${numOfTags} (${(numOfTagsCreated/numOfTags*100).toFixed(2)}%)`)
                }
            },
            onAllObjectsSaved: () => {
                commonLog.info(() => `All tags were saved.`)
                onAllSaved?.()
            }
        })
    }
    function saveNotes({tagIds,onAllSaved}) {
        saveAllObjectsInOneNewTransaction({
            storeName: NOTES_STORE,
            numOfObjects: numOfNotes,
            getObject: () => randomNote({tagIds}),
            onObjectSaved: lastIdx => {
                const numOfNotesCreated = lastIdx+1
                if (numOfNotesCreated % 100 == 0) {
                    commonLog.info(() => `notes saved: ${numOfNotesCreated} of ${numOfNotes} (${(numOfNotesCreated/numOfNotes*100).toFixed(2)}%)`)
                }
            },
            onAllObjectsSaved: () => {
                commonLog.info(() => `All notes were saved.`)
                onAllSaved?.()
            }
        })
    }
    withTransaction({isReadWrite:true, action: transaction => {
        commonLog.debug(() => `Start cleaning the database.`)
        const tagsStore = transaction.objectStore(TAGS_STORE)
        tagsStore.clear().onsuccess = () => {
            const notesStore = transaction.objectStore(NOTES_STORE)
            notesStore.clear().onsuccess = () => {
                commonLog.debug(() => `The database was cleaned.`)
                saveTags({
                    onAllSaved: () => readAllTags({onDone: allTags => {
                        const tagIds = allTags.map(t => t.id)
                        saveNotes({tagIds})
                    }})
                })
            }
        }
    }})
}

function compareDatabaseWithBackupFromFile({fileName, onProgress, onSuccess, onError}) {
    function error(msg) {
        dbLog.error(() => `compareDatabaseWithBackupFromFile: ${msg}`)
        onError?.(msg)
        throw new Error(msg)
    }
    onProgress?.(`Reading the backup from the file...`)
    readStringFromFile({
        file:fileName,
        onFileDoesntExist: () => {
            error(`File ${fileName} doesn't exist.`)
        },
        onLoad: bkpContentStr => compareDatabaseWithBackupFromString({
            bkpContentStr, onProgress, onSuccess, onError
        })
    })
}

function compareDatabaseWithBackupFromString({bkpContentStr, onProgress, onSuccess, onError}) {
    onProgress?.(`Comparing the database against the backup...`)
    commonInfoLog.info(() => `Start: compareDatabaseWithBackupFromString`)
    function error(msg) {
        dbLog.error(() => `compareDatabaseWithBackupFromString: ${msg}`)
        onError?.(msg)
        throw new Error(msg)
    }
    function createMap(arr) {
        const result = {}
        for (const obj of arr) {
            result[obj.id] = obj
        }
        return result
    }
    const dbContent = JSON.parse(bkpContentStr)
    if (dbContent.dbVersion !== DB_VERSION) {
        error(`dbContent.dbVersion !== DB_VERSION: dbContent.dbVersion=${dbContent.dbVersion}, DB_VERSION=${DB_VERSION}`)
    }
    const tagsBkp = dbContent[TAGS_STORE]
    if (!Array.isArray(tagsBkp)) {
        error(`!Array.isArray(tagsBkp)`)
    }
    const notesBkp = dbContent[NOTES_STORE]
    if (!Array.isArray(notesBkp)) {
        error(`!Array.isArray(notesBkp)`)
    }

    function compareDbVsBkp({storeName, dbCount, bkpCount, dbArr, bkpArr}) {
        onProgress?.(`Starting data comparison for ${storeName}...`)
        function assertEquals(v1,v1Name,v2,v2Name) {
            if (v1 !== v2) {
                error(`${storeName}: ${v1Name} !== ${v2Name}; ${v1Name} = ${v1}, ${v2Name} = ${v2}.`)
            }
        }
        assertEquals(dbCount,'dbCount',bkpCount,'bkpCount')
        assertEquals(dbArr.length,'dbArr.length',bkpArr.length,'bkpArr.length')
        const dbMap = createMap(dbArr)
        const dbIds = Object.getOwnPropertyNames(dbMap).sort()
        const bkpMap = createMap(bkpArr)
        const bkpIds = Object.getOwnPropertyNames(bkpMap).sort()

        assertEquals(dbIds.length,'dbIds.length',dbArr.length,'dbArr.length')
        assertEquals(bkpIds.length,'bkpIds.length',bkpArr.length,'bkpArr.length')
        const idsCompareResult = compareObjects(dbIds,bkpIds)
        assertEquals(idsCompareResult,'idsCompareResult',true,'true')
        for (let i = 0; i < dbIds.length; i++) {
            const id = dbIds[i]
            const dbObj = dbMap[id]
            const bkpObj = bkpMap[id]
            if (!compareObjects(dbObj, bkpObj)) {
                error(`${storeName}: found discrepancy for: db=${JSON.stringify(dbObj)}, bkp=${JSON.stringify(bkpObj)}`)
            }
            if ((i+1)%100==0) {
                onProgress?.(`Comparing ${storeName}: ${i+1} of ${dbIds.length} / ${((i+1) / dbIds.length * 100).toFixed(2)}%`)
            }
        }
    }

    function compareDbVsBkpH({storeName, bkpArr, onDone}) {
        withTransaction({action: transaction => {
                transaction.objectStore(storeName).count().onsuccess = dbCountResult => {
                    onProgress?.(`Reading ${storeName} from the database...`)
                    readAllObjects({
                        storeName,
                        onProgress: arr => {
                            if (arr.length % 100 == 0) {
                                onProgress?.(`Reading ${storeName} from the database... ${arr.length} ${storeName} read.`)
                            }
                        },
                        onDone: dbArr => {
                            onProgress?.(`All ${storeName} were read from the database...`)
                            compareDbVsBkp({
                                storeName,
                                bkpCount:bkpArr.length,
                                bkpArr,
                                dbCount:dbCountResult.target.result,
                                dbArr
                            })
                            onDone?.()
                        }
                    })
                }
            }})
    }

    compareDbVsBkpH({
        storeName: NOTES_STORE,
        bkpArr: notesBkp,
        onDone: () => {
            compareDbVsBkpH({
                storeName: TAGS_STORE,
                bkpArr: tagsBkp,
                onDone: () => {
                    commonInfoLog.info(() => `Completed successfully: compareDatabaseWithBackupFromString`)
                    onSuccess?.()
                }
            })
        }
    })

}
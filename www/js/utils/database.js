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

function saveAllObjectsInOneTransaction({transaction, objectsPerTransaction, storeName, objs, onObjectSaved, onAllObjectsSaved}) {
    const initialTransaction = transaction
    let numOfObjectsCreated = 0
    let numOfObjectsSavedInTransaction = 0
    function onTransactionComplete() {
        commonLog.info(() => `############### Transaction completed for ${storeName} ###############`)
        if (numOfObjectsCreated >= numOfObjects) {
            onAllObjectsSaved()
        } else {
            dbLog.error(`numOfObjectsCreated < numOfObjects`)
        }
    }
    function saveRemainingObjects({transaction}) {
        withTransaction({
            transaction,
            isReadWrite: true,
            onComplete: hasNoValue(initialTransaction) ? onTransactionComplete : undefined,
            action: transaction => {
                saveObject({
                    transaction,
                    storeName,
                    obj: objs[numOfObjectsCreated],
                    onSaved: () => {
                        onObjectSaved(numOfObjectsCreated)
                        numOfObjectsCreated++
                        numOfObjectsSavedInTransaction++
                        if (numOfObjectsCreated < objs.length) {
                            if (hasValue(objectsPerTransaction) && numOfObjectsSavedInTransaction >= objectsPerTransaction) {
                                numOfObjectsSavedInTransaction = 0
                                transaction = undefined
                            }
                            saveRemainingObjects({transaction})
                        } else if (hasValue(initialTransaction)) {
                            onAllObjectsSaved()
                        }
                    }
                })
            }
        })
    }
    saveRemainingObjects({transaction})
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

function restoreDatabase({storeNames, dbContentStr, onProgress, onSuccess, onError}) {
    function error(msg) {
        dbLog.error(() => msg)
        onError?.(msg)
        throw new Error(msg)
    }
    onProgress?.(`Parsing the backup string...`)
    const dbContent = JSON.parse(dbContentStr)
    if (dbContent.dbVersion !== DB_VERSION) {
        error(`dbContent.dbVersion !== DB_VERSION: dbContent.dbVersion=${dbContent.dbVersion}, DB_VERSION=${DB_VERSION}`)
    }
    for (const storeName of storeNames) {
        if (hasNoValue(dbContent[storeName])) {
            error(`The backup doesn't contain data for ${storeName}.`)
        }
        if (!Array.isArray(dbContent[storeName])) {
            error(`!Array.isArray(dbContent['${storeName}']).`)
        }
    }

    let allDataWasWritten = false
    function onWritingComplete() {
        if (!allDataWasWritten) {
            error(`!allDataWasWritten`)
        }
        onSuccess?.()
    }
    function onErrorClbk() {
        error(`Error restoring database from string.`)
    }
    function onAbort() {
        error(`Aborted restoring database from string.`)
    }

    function writeAllData({transaction,storeNames}) {
        if (storeNames.length == 0) {
            allDataWasWritten = true
        } else {
            withTransaction({
                transaction,
                isReadWrite:true,
                storeNames,
                onError: onErrorClbk,
                onAbort,
                onComplete: onWritingComplete,
                action: transaction => {
                    const storeNameToWriteTo = storeNames.first()
                    const objs = dbContent[storeNameToWriteTo]
                    onProgress?.(`${storeNameToWriteTo}: deleting all data...`)
                    transaction.objectStore(storeNameToWriteTo).clear().onsuccess = () => {
                        onProgress?.(`${storeNameToWriteTo} start writing new data...`)
                        saveAllObjectsInOneTransaction({
                            transaction,
                            storeName: storeNameToWriteTo,
                            objs,
                            onObjectSaved: lastIdx => {
                                const numOfObjsCreated = lastIdx+1
                                if (numOfObjsCreated % 100 == 0) {
                                    onProgress?.(`${storeNameToWriteTo} saved: ${numOfObjsCreated} of ${objs.length} (${(numOfObjsCreated/objs.length*100).toFixed(2)}%)`)
                                }
                            },
                            onAllObjectsSaved: () => {
                                writeAllData({
                                    transaction,
                                    storeNames: storeNames.rest()
                                })
                            }
                        })
                    }
                }
            })
        }
    }

    writeAllData({storeNames})
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
                    onSuccess: () => {
                        if (dbContentStr.length <= 100000) {
                            console.log(`dbContentStr = ${dbContentStr}`)
                        } else {
                            console.log(`dbContentStr.length > 100000`)
                        }
                        onSuccess?.(`Database was successfully backed up in browser mode. dbContentStr.length=${dbContentStr.length}.`)
                    }
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

function restoreDatabaseFromString({dbContentStr, onProgress, onSuccess, onError}) {
    restoreDatabase({
        storeNames: [TAGS_STORE, NOTES_STORE],
        dbContentStr,
        onProgress,
        onError,
        onSuccess: () => {
            compareDatabaseWithBackupFromString({
                bkpContentStr:dbContentStr, onProgress, onSuccess, onError
            })
        }
    })
}

function restoreDatabaseFromFile({fileName, onProgress, onSuccess, onError}) {
    function error(msg) {
        dbLog.error(() => msg)
        onError?.(msg)
        throw new Error(msg)
    }
    readStringFromFile({
        file:fileName,
        onFileDoesntExist: () => {
            error(`The file to restore database from ${fileName} doesn't exist.`)
        },
        onLoad: dbContentStr => {
            restoreDatabaseFromString({
                storeNames: [TAGS_STORE, NOTES_STORE],
                dbContentStr,
                onProgress,
                onSuccess,
                onError
            })
        }
    })
}

function generateRandomData({numOfTags, numOfNotes, onProgress, onSuccess, onError}) {
    function progress(msg) {
        onProgress?.(msg)
        commonInfoLog.info(() => msg)
    }
    progress(`Start generating random test data...`)
    function randomSentence() {
        return ints(1,randomInt(3,10)).map(i => randomString({minLength:3,maxLength:10})).join(' ')
    }
    function randomTag({id}) {
        return {
            id,
            name: randomString({minLength:5,maxLength:15}),
            color: randomString({minLength:5,maxLength:10}),
            priority: randomInt(0,20)
        }
    }
    function randomNote({id,tagIds}) {
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
            id,
            text: randomSentence(),
            tags: selectedTagIds
        }
    }

    progress(`Generating tags...`)
    const newTags = ints(1,numOfTags).map(i => randomTag({id:i}))
    const tagIds = newTags.map(t => t.id)
    progress(`Generating notes...`)
    const newNotes = ints(1,numOfNotes).map(i => randomNote({id:i,tagIds}))
    const newDbContent = {
        dbVersion: DB_VERSION,
        [TAGS_STORE]: newTags,
        [NOTES_STORE]: newNotes
    }
    progress(`Writing test data to database...`)
    restoreDatabaseFromString({
        dbContentStr: JSON.stringify(newDbContent),
        onProgress,
        onSuccess,
        onError
    })
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
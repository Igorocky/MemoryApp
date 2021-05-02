"use strict";

const DbInfoTab = ({}) => {

    const [memoryUsageInfo, setMemoryUsageInfo] = useState(null)
    const [countsInfo, setCountsInfo] = useState(null)

    useEffect(() => {
        loadMemoryUsage()
        loadObjectCounts()
    }, [])

    function loadObjectCounts() {
        withTransaction({action: transaction =>{
            transaction.objectStore(TAGS_STORE).count().onsuccess = tagsCountRes => {
                transaction.objectStore(NOTES_STORE).count().onsuccess = notesCountRes => {
                    setCountsInfo(
                        `Tags - ${tagsCountRes.target.result}, Notes - ${notesCountRes.target.result}`
                    )
                }
            }
        }})
    }

    function loadMemoryUsage() {
        const estimate = navigator?.storage?.estimate()
        if (hasNoValue(estimate)) {
            setMemoryUsageInfo(
                `No memory usage info available: navigator - ${hasValue(navigator)}, navigator?.storage - ${hasValue(navigator?.storage)}.`
            )
        } else {
            function calcUsagePct(used,all) {
                if (hasValue(used) && hasValue(all)) {
                    return (used/all*100).toFixed(2)
                } else {
                    return undefined
                }
            }
            estimate.then(r => setMemoryUsageInfo(
                `Memory usage: ${JSON.stringify(r)}. 
                ${calcUsagePct(r.usage, r.quota)}% used overall. 
                ${calcUsagePct(r.usageDetails?.indexedDB, r.quota)}% used by indexedDB.`
            ))
        }
    }

    return RE.Container.col.top.left({},{style:{marginBottom:'15px'}},
        RE.div({},memoryUsageInfo??'Loading memory usage info...'),
        RE.div({},countsInfo??'Loading object counts info...'),
    )
}
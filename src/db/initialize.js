db.user.insertOne({
    name: "Rooty",
    password: BinData(0, "JDJiJDEyJHhmL1Q0RVRxVUNJOVN1dFE5MHhCdy4uRFduNkxhTzNNNUZaNE9NNDNmM1FQSFBEYkg3SHd5"),
    assignedTo: [""],
    role: "root",
    email: "rooty@root.com"
})

// Only during development
db.user.insertOne({
    name: "Alberto",
    password: BinData(0, "JDJiJDEyJGdhY3EuNG1GR0l0TjdPbGhTcGJoNy5nRFZISEsuYWJMZkNPR3VHLjBseWwycEYuQkwzSXB1"),
    assignedTo: ["aik_behnke"],
    role: "user",
    email: "ab@gmail.com"
})
db.user.insertOne({
    name: "Bea",
    password: BinData(0, "JDJiJDEyJFpMTmNhcngzbHNMVU5nS3dIRjA2SWVHQkNiTTJ6UzBXbnBPWDJwMzZJUTNqSmpWZlJEbHB5"),
    assignedTo: ["aik_behnke"],
    role: "user",
    email: "abc@gmail.com"
})
db.user.insertOne({
    name: "Dario",
    password: BinData(0, "JDJiJDEyJHpNMVJ4eVFOQlNFbmZVZ1N5bk5SdmU0MmoySlFOOVNIcXlwc25oSzAuVmY4VkU1RWZqa2pl"),
    assignedTo: ["aik_behnke"],
    role: "user",
    email: "abcd@gmail.com"
})
db.objectType.insertOne({
    "type": "personAIK",
    "datasetType": "actionInKitchen",
    "numKeypoints": 1,
    "labels": ["nose"]
})

db.objectType.insertOne({
    "type": "box",
    "datasetType": "actionInKitchen",
    "numKeypoints": 8,
    "labels": ["tfl", "tfr", "tbl", "tbr", "bfl", "bfr", "bbl", "bbr"]
})

db.activities.insertMany([
    { "name": 'drinking' },
    { "name": 'eating' },
    { "name": 'washing dishes' },
    { "name": 'cutting cake' },
    { "name": 'writing on whiteboard' },
    { "name": 'phone call' },
    { "name": 'type/read on phone' },
    { "name": 'read paper' },
    { "name": 'use laptop' },
    { "name": 'peel fruit' },
    { "name": 'put dish in dishwasher' },
    { "name": 'start dishwasher' },
    { "name": 'pour milk into mug' },
    { "name": 'fill water into water heater' },
    { "name": 'boil water' },
    { "name": 'prepare tea' },
    { "name": 'get glass of water' },
    { "name": 'use coffee machine' },
    { "name": 'fill water into coffee machine' },
    { "name": 'clear tray of coffee machine' },
    { "name": 'walking' },
    { "name": 'standing' },
    { "name": 'leaning' },
    { "name": 'sitting' },
    { "name": 'crouching' }
]);
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
  { "name": 'standing' },
  { "name": 'walking' },
  { "name": 'sitting' },
  { "name": 'leaning' },
  { "name": 'sitting down' },
  { "name": 'standing up' },
  { "name": 'leaning down' },
  { "name": 'squatting' },
  { "name": 'kneeling down' },
  { "name": 'kneeling' },
  { "name": 'steps' },
  { "name": 'empty dishwasher' },
  { "name": 'clean dish' },
  { "name": 'take cake out of fridge' },
  { "name": 'place cake on table' },
  { "name": 'cut cake in pieces' },
  { "name": 'take kettle' },
  { "name": 'put water in kettle' },
  { "name": 'pour kettle' },
  { "name": 'open fridge' },
  { "name": 'close fridge' },
  { "name": 'take milk' },
  { "name": 'pour milk' },
  { "name": 'put cup in microwave' },
  { "name": 'start microwave' },
  { "name": 'take cup out of microwave' },
  { "name": 'put sugar in cup' },
  { "name": 'open cupboard' },
  { "name": 'close cupboard' },
  { "name": 'take dish out of cupboard' },
  { "name": 'place cup onto coffee machine' },
  { "name": 'make coffee' },
  { "name": 'take cup from coffee machine' },
  { "name": 'fill water to coffee machine' },
  { "name": 'empty ground from coffee machine' },
  { "name": 'empty water from coffee machine' },
  { "name": 'remove sheet from whiteboard' },
  { "name": 'place sheet onto whiteboard' },
  { "name": 'put teabag in cup' },
  { "name": 'take teabag' },
  { "name": 'peal fruit' },
  { "name": 'eat fruit' },
  { "name": 'throw in trash' },
  { "name": 'start dishwasher' },
  { "name": 'place in dishwasher' },
  { "name": 'open dishwasher' },
  { "name": 'close dishwasher ' },
  { "name": 'draw on whiteboard' },
  { "name": 'erase on whiteboard' },
  { "name": 'take piece of cake' },
  { "name": 'eat cake' },
  { "name": 'put cake in fridge' },
  { "name": 'clean countertop' },
  { "name": 'open window' },
  { "name": 'close window' },
  { "name": 'use laptop' },
  { "name": 'use smartphone' },
  { "name": 'phone call' },
  { "name": 'drink' },
  { "name": 'take water from sink' },
  { "name": 'read paper' },
  { "name": 'talking' },
  { "name": 'listening' },
  { "name": 'open drawer' },
  { "name": 'close drawer' },
  { "name": 'place cake on plate' },
  { "name": 'washing hands' }
]);

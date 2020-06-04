db.user.insertOne({
    name: "Rooty",
    password: BinData(0, "JDJiJDEyJHhmL1Q0RVRxVUNJOVN1dFE5MHhCdy4uRFduNkxhTzNNNUZaNE9NNDNmM1FQSFBEYkg3SHd5"),
    assignedTo: [""],
    role: "root",
    email: "rooty@root.com"
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
  "numKeypoints": 3,
  "labels": ["tfl", "tfr", "bbl"]
})

// db.objectType.insertOne({
//     "type": "box",
//     "datasetType": "actionInKitchen",
//     "numKeypoints": 8,
//     "labels": ["tfl", "tfr", "tbl", "tbr", "bfl", "bfr", "bbl", "bbr"]
// })

db.objectType.insertOne({
  "type": "poseAIK",
  "datasetType": "actionInKitchen",
  "numKeypoints": 24,
  "labels": [
    "Nose",
    "Neck",
    "Shoulder right",
    "Elbow right",
    "Hand right",
    "Shoulder left",
    "Elbow left",
    "Hand left",
    "Hip right",
    "Knee right",
    "Foot right",
    "Hip left",
    "Knee left",
    "Foot left",
    "Eye right",
    "Eye left",
    "Ear right",
    "Ear left",
    "Small toe left",
    "Large toe left",
    "Heel left",
    "Small toe right",
    "Large toe right",
    "Heel right"
  ],
  "skeleton": [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [1, 5],
    [5, 6],
    [6, 7],
    [2, 8],
    [8, 9],
    [9, 10],
    [5, 11],
    [11, 12],
    [12, 13],
    [0, 14],
    [0, 15],
    [0, 16],
    [0, 17],
    [1,16],
    [1,17],
    [14, 16],
    [15, 17],
    [10, 21],
    [10, 22],
    [10, 23],
    [21, 22],
    [22, 23],
    [13, 18],
    [13, 19],
    [13, 20],
    [18, 19],
    [19, 20]
  ]
});

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

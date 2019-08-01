// db.user.insertOne({ name: "Root", password: "test", assignedTo: [""], role: "root" })
// db.user.insertOne({ name: "Alberto", password: "test", assignedTo: ["example3"], role: "admin", email: "alberto@alberto.com" })
// db.user.insertOne({ name: "Dario", password: "test", assignedTo: ["example1"], role: "user", email: "dario@dario.com" })
// db.user.insertOne({ name: "Beatriz", password: "test", assignedTo: ["example3"], role: "user", email: "bea@bea.com" })
// db.user.insertOne({ name: "pt", password: "test", assignedTo: ["posetrack_example"], role: "user", email: "albeasdo@alberto.com" })
// db.user.insertOne({ name: "aik", password: "test", assignedTo: ["aik_kitchen_test2"], role: "user", email: "albeaasihdvo@alberto.com" })
// db.user.insertOne({ name: "aik2", password: "test", assignedTo: ["aik_kitchen2"], role: "user", email: "albeaasihdvo@alberto.com" })
db.user.insertOne({ name: "Rooty", password: BinData(0,"JDJiJDEyJHhmL1Q0RVRxVUNJOVN1dFE5MHhCdy4uRFduNkxhTzNNNUZaNE9NNDNmM1FQSFBEYkg3SHd5"),
    assignedTo: [""], role: "root", email: "rooty@root.com" })

// db.dataset.insertOne({name: "example1", type: "poseTrack"})
// db.dataset.insertOne({name: "example2", type: "poseTrack"})
// db.dataset.insertOne({name: "example3", type: "actionInKitchen"})

db.task.insertOne({
        "name": "task1",
        "assignedUser": "Beatriz",
        "dataset": "example3",
        "frameFrom": "50",
        "frameTo": "200",
        "videos": ["video1", "video4"],
        "POV": 1,
        "lastFrame": "50",
        "finished": "0"
    })
    //
    // db.video.insertOne({
    // 	"name": "video1",
    // 	"dataset": "example3",
    // 	"path": "example3",
    // 	"duration": "00:02:10.2",
    // 	"frames": "3"
    // })

db.annotation.insertOne({
    "scene": "Testing_2",
    "frame": 1,
    "user": "aik2",
    "dataset": "Testing_2",
    "validated": "uncheck",
    "objects": [{
            "uid": 1,
            "type": "person",
            "keypoints": [
                [1, 1, 1, ""],
                [2, 2, 2, ""]
            ],
            "labels": ["l1", "l2"]
        },
        {
            "uid": 3,
            "type": "person",
            "keypoints": [
                [20, 80, 20, ""],
                [100, 100, 100, ""]
            ],
            "labels": ["l1", "l2"]
        },
        {
            "uid": 5,
            "type": "table",
            "keypoints": [
                [20, 80, 20, ""],
                [100, 100, 100, ""]
            ],
            "labels": ["l5", "l4"]
        }
    ]
})

db.annotation.insertOne({
    "scene": "Testing_2",
    "frame": 2,
    "user": "aik2",
    "dataset": "Testing_2",
    "validated": "uncheck",
    "objects": [{
        "uid": "1",
        "type": "person",
        "keypoints": [
            [3, 3, 1, ""],
            [4, 4, 4, ""]
        ],
        "labels": ["l1", "l2"]
    },
        {
            "uid": 5,
            "type": "table",
            "keypoints": [
                [20, 80, 20, ""],
                [100, 100, 100, ""]
            ],
            "labels": ["l5", "l4"]
        }]
})

db.action.insertOne({
    "name": "walking",
    "dataset": "Testing_2",
    "objectUID": 1,
    "user": "aik2",
    "startFrame": 1,
    "endFrame": 10
})

db.action.insertOne({
    "name": "drinking coffee",
    "dataset": "Testing_2",
    "objectUID": 1,
    "user": "aik2",
    "startFrame": 1,
    "endFrame": 10
})

db.objectType.insertOne({
    "type": "personAIK",
    "datasetType": "actionInKitchen",
    "numKeypoints": "6",
    "labels": ["nose", "right-hand", "left-hand", "hip", "left-foot", "right-foot"]
})

db.objectType.insertOne({
    "type": "microwave",
    "datasetType": "actionInKitchen",
    "numKeypoints": "8",
    "labels": ["0", "1", "2", "3", "4", "5", "6", "7", "8"]
})

db.objectType.insertOne({
    "type": "table",
    "datasetType": "actionInKitchen",
    "numKeypoints": "8",
    "labels": ["0", "1", "2", "3", "4", "5", "6", "7", "8"]
})

db.activities.insertMany([
    {"name": 'drinking'},
    {"name": 'eating'},
    {"name": 'washing dishes'},
    {"name": 'cutting cake'},
    {"name": 'writing on whiteboard'},
    {"name": 'phone call'},
    {"name": 'type/read on phone'},
    {"name": 'read paper'},
    {"name": 'use laptop'},
    {"name": 'peel fruit'},
    {"name": 'put dish in dishwasher'},
    {"name": 'start dishwasher'},
    {"name": 'pour milk into mug'},
    {"name": 'fill water into water heater'},
    {"name": 'boil water'},
    {"name": 'prepare tea'},
    {"name": 'get glass of water'},
    {"name": 'use coffee machine'},
    {"name": 'fill water into coffee machine'},
    {"name": 'clear tray of coffee machine'},
    {"name": 'walking'},
    {"name": 'standing'},
    {"name": 'leaning'},
    {"name": 'sitting'},
    {"name": 'crouching'}
]);
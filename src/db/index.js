db.video.getIndexes()

db.video.createIndex( {"dataset": 1,"name":1} );
db.frame.createIndex( {"dataset": 1, "video": 1 ,"number":1})
db.frame.createIndex( {"frame_id": 1})

db.annotation.createIndex( {"dataset":1, "scene": 1, "user": 1, "frame": 1})

db.dataset.createIndex({"name": 1});

db.user.createIndex({"name": 1});
db.user.createIndex({"assignedTo": 1});
db.user.createIndex({"email": 1});

db.objectType.createIndex({"datasetType": 1, "type": 1});
db.activities.createIndex({"name": 1});
db.action.createIndex({"dataset": 1, "user": 1, "startFrame": 1, "endFrame": 1, "objectUID": 1, "name": 1});



db.task.createIndex({"dataset": 1, "assignedUser": 1, "name": 1});
db.user.insertOne({name: "Root", password: "test", assignedTo: [""], role: "root"})
db.user.insertOne({name: "Alberto", password: "test", assignedTo: ["example3"], role: "admin", email: "alberto@alberto.com"})
db.user.insertOne({name: "Dario", password: "test", assignedTo: ["example1"], role: "user", email: "dario@dario.com"})
db.user.insertOne({name: "Beatriz", password: "test", assignedTo: ["example3"], role: "user", email: "bea@bea.com"})

db.dataset.insertOne({name: "example1", type: "poseTrack"})
db.dataset.insertOne({name: "example2", type: "poseTrack"})
db.dataset.insertOne({name: "example3", type: "actionInKitchen"})

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

db.video.insertOne({
	"name": "video1",
	"dataset": "example3",
	"path": "example3",
	"duration": "00:02:10.2",
	"frames": "3"
})

db.annotation.insertOne({
	"video": "video1",
	"frame": "1",
	"keypointDim": "3d",
	"objects": [
		{	"uid": "1",
			"type": "person",
			"keypoints": [ [1,1,1,""], [2,2,2,""]],
			"labels": ["l1", "l2"]}
	]
})

db.annotation.insertOne({
	"video": "video1",
	"frame": "2",
	"keypointDim": "3d",
	"objects": [
		{	"uid": "1",
			"type": "person",
			"keypoints": [ [3,1,1,""], [3,2,2,""]],
			"labels": ["l1", "l2"]}
	]
})

db.object.insertOne({
	"type": "person",
	"nkp": "6",
	"labels": ["nose", "right-hand", "left-hand", "hip", "left-foot", "right-foot"]
})

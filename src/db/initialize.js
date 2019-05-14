db.user.insertOne({name: "Root", password: "test", assignedTo: [""], role: "root"})
db.user.insertOne({name: "Alberto", password: "test", assignedTo: ["cvg", "example2"], role: "admin", email: ""})
db.user.insertOne({name: "Dario", password: "test", assignedTo: ["Posetrack", "example1"], role: "user", email: "dario@dario.com"})
db.user.insertOne({name: "Beatriz", password: "test", assignedTo: ["cvg", "example3"], role: "user", email: "bea@bea.com"})

db.dataset.insertOne({name: "cvg"})
db.dataset.insertOne({name: "Posetrack"})


db.video.insertOne({
	"video": "dorian2",
	"frame": "1",
	"keypointDim": "3d",
	"objects": [
		{	"uid": "1",
			"type": "person",
			"keypoints": [ [1,1,1,""], [2,2,2,""]],
			"labels": ["l1", "l2"]}
	]
})

db.video.insertOne({
	"video": "dorian2",
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

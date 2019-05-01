db.user.insertOne({admin: "test"})
db.user.insertOne({user: "Alberto"})
db.user.insertOne({user: "Beatriz"})

db.video.insertOne({
	"video": "dorian2",
	"frame": "1",
	"objects": [
		{	"uid": 1,
			"type": "person",
			"keypoints": [ [1,1,1,""], [2,2,2,""]],
			"labels": ["l1", "l2"]}
	]
})

db.video.insertOne({
	"video": "dorian2",
	"frame": "2",
	"objects": [
		{	"uid": 1,
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

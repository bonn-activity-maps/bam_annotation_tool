from pymongo import MongoClient, errors
import logging
from bson.son import SON

from python.objects.annotation import Annotation
from python.objects.object import Object

# AnnotationManager logger
log = logging.getLogger('annotationManager')


class AnnotationManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.annotation

    aik = 'actionInKitchen'
    pt = 'poseTrack'

    # Get annotation info for given frame, dataset, scene and user. Not return mongo id
    # AIK: ignore user parameter
    def get_annotation(self, annotation):
        try:
            if annotation.dataset.is_aik():
                result = self.collection.find_one({"dataset": annotation.dataset.name, "scene": annotation.scene, "frame": annotation.frame}, {'_id': 0})
            else:
                # result = self.collection.find_one({"dataset": dataset, "scene": scene, "user": user, "frame": int(frame)}, # User instead of root
                result = self.collection.find_one({"dataset": annotation.dataset.name, "scene": annotation.scene, "user": "root", "frame": annotation.frame},
                                                  {'_id': 0})

            if result is None:
                return {}
            else:
                return Annotation.from_json(result)
        except errors.PyMongoError as e:
            log.exception('Error finding annotation in db')
            return 'Error'

    # Get annotations info for given frame range, dataset, scene and user. Not return mongo id
    # AIK: ignore user parameter
    def get_annotations_by_frame_range(self, start_annotation, end_annotation):
        try:
            if start_annotation.dataset.is_aik():
                result = self.collection.find({"dataset": start_annotation.dataset.name, "scene": start_annotation.scene,
                                               "frame": {"$gte": start_annotation.frame, "$lte": end_annotation.frame}},
                                               {'_id': 0}).sort("frame", 1)
            else:
                # result = self.collection.find_one({"dataset": dataset, "scene": scene, "user": user, "frame": int(frame)}, # User instead of root
                result = self.collection.find({"dataset": start_annotation.dataset.name, "scene": start_annotation.scene, "user": "root",
                                               "frame": {"$gte": start_annotation.frame, "$lte": end_annotation.frame}},
                                                {'_id': 0}).sort("frame", 1)

            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding annotation in db')
            return 'Error'

    # Get all annotations for given dataset, scene, user and val. Not return mongo id
    # AIK: ignore user parameter
    def get_annotations(self, annotation):
        try:
            if annotation.dataset.is_aik():
                result = self.collection.find({"dataset": annotation.dataset.name, "scene": annotation.scene}, {'_id': 0})
            else:
                # result = self.collection.find({"dataset": dataset, "scene": scene, "user": user, "validated": val}, {'_id': 0})
                # result = self.collection.find({"dataset": dataset, "scene": scene, "user": user}, {'_id': 0}) # User instead of root
                result = self.collection.find({"dataset": annotation.dataset.name, "scene": annotation.scene, "user": "root"}, {'_id': 0})
            return [Annotation.from_json(r,  annotation.dataset.type) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding annotation in db')
            return 'Error'

    # Get objects with uid and type for given dataset, scene and user.
    # AIK: ignore user parameter
    # TODO: check query
    def get_annotated_objects(self, annotation):
        try:
            # If posetrack, return track_id too
            if annotation.dataset.is_pt():
                # result = self.collection.aggregate([{"$unwind": "$objects"}, {"$match": {"dataset": dataset, "scene": scene, "user": user}}, # User instead of root
                result = self.collection.aggregate([{"$unwind": "$objects"}, {"$match": {"dataset": annotation.dataset.name, "scene": annotation.scene, "user": "root"}},
                                                    {"$group": {"_id": {"uid": "$objects.uid", "type": "$objects.type",
                                                                        "track_id": "$objects.track_id",
                                                                        "frame": "$frame"}}},
                                                    {"$project": {"_id": 0, "object": "$_id"}},
                                                    {"$sort": SON([("object.track_id", 1)])}])
            elif annotation.dataset.is_aik():
                result = self.collection.aggregate([{"$unwind": "$objects"}, {"$match": {"dataset": annotation.dataset.name, "scene": annotation.scene}},
                                                    {"$group": {"_id": {"uid": "$objects.uid", "type": "$objects.type"}}},
                                                    {"$project": {"_id": 0, "object": "$_id"}},
                                                    {"$sort": SON([("object.uid", 1)])}])
            else:
                result = self.collection.aggregate([{"$unwind": "$objects"}, {"$match": {"dataset": annotation.dataset.name, "scene": annotation.scene, "user": annotation.user}},
                                                    {"$group": {"_id": {"uid": "$objects.uid", "type": "$objects.type"}}},
                                                    {"$project": {"_id": 0, "object": "$_id"}},
                                                    {"$sort": SON([("object.uid", 1)])}])
            if result is None:
                return {}
            else:
                return list(result)
                # return [Object.from_json(r, annotation.dataset.type) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error retrieving annotated objects in db')
            return 'Error'

    # Get all annotations for the dataset order by frame
    # Return json for export
    def get_objects_by_dataset(self, dataset):
        try:
            # result = self.collection.find({"dataset": dataset, "scene": dataset, "objects.type": "person"})
            result = self.collection.find({"dataset": dataset.name, "scene": dataset.name}, {"_id": 0, "frame": 1, "objects": 1}).sort("frame", 1)

            # result = self.collection.aggregate([{"$match": {"dataset": dataset, "scene": dataset, "objects.type": "person"}},
            #                          {"$group": {"_id": { "frame": "$frame"},
            #                                       "persons": {"$push": {"pid": "$objects.uid", "location": "$objects.keypoints"}}}},
            #                          {"$sort": {"_id.frame": 1}},
            #                          {"$project": {"_id": 0, "frame": "$_id.frame", "persons": "$persons"}}
            #                          ])
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding annotation in db')
            return 'Error'

    # Get annotation for object in frame, without mongo id
    # Always a single object in "objects" so always objects[0] !!
    # AIK: ignore user parameter
    def get_frame_object(self, annotation):
        try:
            if annotation.dataset.is_aik():
                result = self.collection.find_one({"dataset": annotation.dataset.name, "scene": annotation.scene, "frame": annotation.frame},
                                                  {"objects": {"$elemMatch": {"uid": annotation.objects[0].uid, "type": annotation.objects[0].type}}, '_id': 0})
            else:
                # result = self.collection.find_one({"dataset": dataset, "scene": scene, "user": user, "frame": frame}, # User instead of root
                result = self.collection.find_one({"dataset": annotation.dataset.name, "scene": annotation.scene, "user": "root", "frame": annotation.frame},
                                                  {"objects": {"$elemMatch": {"uid": annotation.objects[0].uid, "type": annotation.objects[0].type}}, '_id': 0})
            if not result:          # if empty json
                return 'No annotation'
            else:
                return Object.from_json(result['objects'][0], annotation.dataset.type)
        except errors.PyMongoError as e:
            log.exception('Error finding object in annotation in db')
            return 'Error'

    # Get annotations for object in frame range, without mongo id
    # Always only one object in "objects" so use objects[0] !!
    # AIK: ignore user parameter
    #TODO: revisar
    def get_object_in_frames(self, start_annotation, end_annotation):
        try:
            if start_annotation.dataset.is_aik():
                result = self.collection.find({"dataset": start_annotation.dataset.name, "scene": start_annotation.scene, "frame": {"$gte": start_annotation.frame, "$lte": end_annotation.frame},
                                               "objects.uid": start_annotation.objects[0].uid, "objects.type": start_annotation.objects[0].type},
                                                {"objects": {"$elemMatch": {"uid": start_annotation.objects[0].uid, "type": start_annotation.objects[0].type}}, "dataset": 1, "scene": 1, "frame": 1,  '_id': 0}).sort("frame", 1)
            else:
                # result = self.collection.find_one({"dataset": dataset, "scene": scene, "user": user, "frame": frame}, # User instead of root
                result = self.collection.find({"dataset": start_annotation.dataset.name, "scene": start_annotation.scene, "user": "root", "frame": {"$gte": start_annotation.frame, "$lte": end_annotation.frame},
                                               "objects.uid": start_annotation.objects[0].uid, "objects.type": start_annotation.objects[0].type},
                                                {"objects": {"$elemMatch": {"uid": start_annotation.objects[0].uid, "type": start_annotation.objects[0].type}}, "dataset": 1, "scene": 1, "frame": 1, '_id': 0}).sort("frame", 1)

            # return [Annotation.from_json(r, start_annotation.dataset.type) for r in list(result)]
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding object in annotation in db')
            return 'Error'

    # Get annotations for object in different frames, without mongo id
    def get_annnotations_by_object(self, dataset, scene, user, uid):
        try:
            if dataset.type == dataset.aik:
                result = self.collection.find({"dataset": dataset.name, "scene": scene, "objects.uid": uid},
                                              {"objects": {"$elemMatch": {"uid": uid}}, "frame": 1, "scene":1, "dataset": 1, '_id': 0}).limit(2)
            else:
                # result = self.collection.find({"dataset": dataset, "scene": scene, "user": user, # User instead of root
                result = self.collection.find({"dataset": dataset.name, "scene": scene, "user": "root",
                                               "objects.track_id": uid, "objects.type": "bbox_head"},
                                        {"objects": {"$elemMatch": {"track_id": uid, "type": "bbox_head"}},
                                         "frame": 1, "scene":1, "dataset": 1, '_id': 0}).limit(10)

            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding object in annotation in db')
            return 'Error'

    # # Get all annotations except of people for the dataset.
    # def get_objects_by_dataset(self, dataset):
    #     try:
    #         result = self.collection.aggregate([{"$match": {"dataset": dataset, "scene": dataset, "objects.type": {"$not": {"$regex": "/person/"}}}},
    #                                 {"$group": {"_id": { "frame": "$frame"},
    #                                              "objects": {"$push": { "labels": "$objects.labels", "location": "$objects.keypoints", "oid": "$objects.uid"}}}},
    #                                 {"$sort": {"_id.frame":1}},
    #                                 {"$project": {"_id": 0, "frame": "$_id.frame", "objects": "$objects"}}])
    #         return list(result)
    #     except errors.PyMongoError as e:
    #         log.exception('Error finding annotation in db')
    #         return 'Error'

    # Return 'ok' if the annotation has been updated.
    # The annotation is created if it doesn't exist and return 'ok
    # Validated flag is set to unchecked if is not received in params
    def update_annotation(self, dataset, scene, frame, user, objects, val='unchecked'):
        query = {"dataset": dataset, "scene": scene, "user": user, "frame": int(frame)}   # Search by dataset, scene, frame, user
        # Update all objects of the frame and validated flag.
        new_values = {"$set": {"objects": objects, "validated": val}}

        try:
            result = self.collection.update_one(query, new_values, upsert=True)
            # ok if object has been modified or new annotation has been created
            if result.modified_count == 1 or result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating annotation in db')
            return 'Error'

    # Return 'ok' if the annotation has been updated.
    # The annotation is created if it doesn't exist and return 'ok
    # Validated flag is set to unchecked if is not received in params
    # Basically same as above but for PoseTrack
    # def updateAnnotationPT(self, dataset, scene, frame, user, objects, val='unchecked'):
    #     # query = {"dataset": dataset, "scene": scene, "user": user, "frame": int(frame)}   # User instead of Root
    #     query = {"dataset": dataset, "scene": scene, "user": "root", "frame": int(frame)}   # Search by dataset, scene, frame, user
    #     # Update all objects of the frame and validated flag.
    #     new_values = {"$set": {"objects": objects, "validated": val}}
    #
    #     try:
    #         result = self.collection.update_one(query, new_values, upsert=True)
    #         # ok if object has been modified or new annotation has been created
    #         if result.modified_count == 1 or result.acknowledged:
    #             return 'ok'
    #         else:
    #             return 'Error'
    #     except errors.PyMongoError as e:
    #         log.exception('Error updating annotation in db')
    #         return 'Error'

    # Return 'ok' if the annotation has been removed
    def remove_annotation(self, annotation):
        try:
            result = self.collection.delete_one({"dataset": annotation.dataset.name, "scene": annotation.scene, "user": annotation.user, "frame": annotation.frame})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing annotation in db')
            return 'Error'

    # Return 'ok' if the annotations of dataset has been removed
    def remove_annotations_by_dataset(self, dataset):
        try:
            result = self.collection.delete_many({"dataset": dataset.name})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing annotations in db')
            return 'Error'

    # # Return 'ok' if the validated flag has been updated in all frames. if annotation doesn't exist, it isn't created
    # def updateValidation(self, dataset, scene, frames, user, val):  #TODO PT validation
    #     query = {"dataset": dataset, "scene": scene, "user": user, "frame": {"$in": frames}}   # Search by dataset, video, user, and all frames in array
    #     # Update validated flag
    #     new_values = {"$set": {"validated": val}}
    #     try:
    #         result = self.collection.update_many(query, new_values, upsert=False)
    #         if result.modified_count == len(frames):
    #             return 'ok'
    #         else:
    #             return 'Error'
    #     except errors.PyMongoError as e:
    #         log.exception('Error updating validated annotation in db')
    #         return 'Error'

    # Return max uid of objects in dataset
    def max_uid_object_dataset(self, dataset):
        try:
            result = self.collection.aggregate([{"$unwind": "$objects"}, {"$match": {"dataset": dataset.name}},
                                                {"$group": {"_id": None, "max": {"$max": "$objects.uid"}}},
                                                {"$project": {"_id": 0, "max": 1}}])       # Avoid return mongo id
            # Read max value returned
            result = list(result)
            if not result:    # If there are no objects -> max uid is 0
                return 0
            else:               # Return max
                return result[0]['max']
        except errors.PyMongoError as e:
            log.exception('Error finding maximum id in annotation in db')
            return 'Error'

    # Return 'ok' if the annotation for an object in a frame has been created.
    # Always only one object in "objects" so use objects[0] !!
    # AIK: ignore user parameter
    def create_frame_object(self, annotation):
        # if annotation.dataset.type is not None and
        if annotation.dataset.is_aik():
            query = {"dataset": annotation.dataset.name, "scene": annotation.scene, "frame": annotation.frame}
        else:
            # query = {"dataset": dataset, "scene": scene, "user": user, "frame": frame} # User instead of root
            query = {"dataset": annotation.dataset.name, "scene": annotation.scene, "user": "root", "frame": annotation.frame}

        new_values = {"$push": {"objects": annotation.objects[0].to_json()}}
        # TODO: check if labels are added when they exist
        # Add object (uid, type, kps) and labels only if it's in objects
        # if annotation.dataset_type is not None and annotation.dataset_type == self.pt:
        #     category_id = objects["category_id"] if "category_id" in objects else 1
        #     track_id = objects["track_id"] if "track_id" in objects else abs(uidObj) % 100
        #     if "labels" in objects:
        #         labels = objects["labels"]
        #         new_values = {"$push": {"objects": {"uid": uidObj, "type": type, "keypoints": keypoints, "labels": labels,
        #                                            "category_id": category_id, "track_id": track_id}}}
        #     else:
        #         new_values = {"$push": {"objects": {"uid": uidObj, "type": type, "keypoints": keypoints,
        #                                            "category_id": category_id, "track_id": track_id}}}
        #
        # else:
        #     new_values = {"$push": {"objects": annotation.objects.to_json()}}

        try:
            result = self.collection.update_one(query, new_values, upsert=True)
            # ok if object has been modified
            if result.modified_count == 1 or result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating object in annotation in db')
            return 'Error'

    # Return 'ok' if the annotation for an object in a frame has been updated.
    # The annotation is not created if it doesn't exist and return Error
    # Always only one object in "objects" so use objects[0] !!
    # AIK: ignore user parameter
    def update_frame_object(self, annotation):
        # if annotation.dataset_type is not None and
        if annotation.dataset.is_aik():
            query = {"dataset": annotation.dataset.name, "scene": annotation.scene, "objects.uid": annotation.objects[0].uid, "objects.type": annotation.objects[0].type, "frame": annotation.frame}
        else:
            # query = {"dataset": dataset, "scene": scene, "user": user, "frame": frame, "objects.uid": uidObj} # User instead of root
            query = {"dataset": annotation.dataset.name, "scene": annotation.scene, "user": "root", "objects.uid": annotation.objects[0].uid, "objects.type": annotation.objects[0].type, "frame": annotation.frame}

        array_filter = [{"elem.uid": {"$eq": annotation.objects[0].uid}, "elem.type": {"$eq": annotation.objects[0].type}}]     # Filter by object uid and type

        # Update object (uid, type, kps) and labels only if it's in objects
        if annotation.objects[0].labels is not None:
            new_values = {"$set": {"objects.$[elem].keypoints": annotation.objects[0].keypoints, "objects.$[elem].labels": annotation.objects[0].labels}}
        else:
            new_values = {"$set": {"objects.$[elem].keypoints": annotation.objects[0].keypoints}}

        try:
            result = self.collection.update_one(query, new_values, upsert=False, array_filters=array_filter)

            # ok if no error (it doesn't matter if the keypoints have not been modified)
            if result.acknowledged == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating object in annotation in db')
            return 'Error'

    # Update an annotation and let the object empty in selected frames
    # Return 'ok' if the annotation for an object in a frame has been updated.
    # Always only one object in "objects" so use objects[0] !!
    # AIK: ignore user parameter
    def remove_frame_object(self, start_annotation, end_annotation):

        if start_annotation.dataset.is_aik():
            query = {"dataset": start_annotation.dataset.name, "scene": start_annotation.scene,
                     "frame": {"$gte": start_annotation.frame, "$lte": end_annotation.frame},
                     "objects.uid": start_annotation.objects[0].uid, "objects.type": start_annotation.objects[0].type}
        else:
            # query = {"dataset": dataset, "scene": scene, "user": user, "frame": {"$gte": int(startFrame), "$lte": int(endFrame)},
            #          "objects.uid": uidObj, "objects.type": objectType}         # User instead of root
            query = {"dataset": start_annotation.dataset.name, "scene": start_annotation.scene, "user": "root",
                     "frame": {"$gte": start_annotation.frame, "$lte": end_annotation.frame},
                     "objects.uid": start_annotation.objects[0].uid, "objects.type": start_annotation.objects[0].type}

        # Filter each annotation and select only objects with uid and type
        arrayFilter = [{"elem.uid": {"$eq": start_annotation.objects[0].uid}, "elem.type": {"$eq": start_annotation.objects[0].type}}]

        # Update object to empty list
        new_values = {"$set": {"objects.$[elem].keypoints": []}}

        try:
            result = self.collection.update_many(query, new_values, upsert=False, array_filters=arrayFilter)
            if result.acknowledged == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error updating object in annotation in db')
            return 'Error'
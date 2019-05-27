from pymongo import MongoClient, errors
import logging
import os

# DatasetManager logger
log = logging.getLogger('datasetManager')


class DatasetManager:

    c = MongoClient('172.18.0.2', 27017)
    db = c.cvg
    collection = db.dataset

    # Return info dataset if exist in DB. Ignore mongo id
    def getDataset(this, dataset):
        try:
            result = this.collection.find_one({"name": dataset}, {"_id": 0})
            if result == None:
                return 'Error'
            else:
                return result
        except errors.PyMongoError as e:
            log.exception('Error finding dataset in db')
            return 'Error'

    # Return list with info of all datasets. Empty list if there are no datasets
    # Ignore mongo id
    def getDatasets(this):
        try:
            result = this.collection.find({},{"_id": 0})
            return list(result)
        except errors.PyMongoError as e:
            log.exception('Error finding datasets in db')
            return 'Error'

    # Return 'ok' if the dataset has been created
    def createDataset(this, dataset, type):
        try:
            filename, filextension = os.path.splitext(dataset)
            result = this.collection.insert_one({"name": filename, "type": type})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating dataset in db')
            return 'Error'

    # Return 'ok' if the dataset has been removed
    def removeDataset(this, dataset):
        try:
            result = this.collection.delete_one({"name": dataset})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing dataset in db')
            return 'Error'

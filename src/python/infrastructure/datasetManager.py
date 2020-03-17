from pymongo import MongoClient, errors
import logging
import os
import python.config as cfg

from python.objects.dataset import Dataset

# DatasetManager logger
log = logging.getLogger('datasetManager')


class DatasetManager:
    c = MongoClient(cfg.mongo["ip"], cfg.mongo["port"])
    db = c.cvg
    collection = db.dataset

    # Return dataset if exist in DB. Ignore mongo id
    def get_dataset(self, dataset):
        try:
            result = self.collection.find_one({"name": dataset.name}, {"_id": 0})
            if result is None:
                return 'Error'
            else:
                return Dataset.from_json(result)
        except errors.PyMongoError as e:
            log.exception('Error finding dataset in db')
            return 'Error'

    # Return list with all datasets. Empty list if there are no datasets
    # Ignore mongo id
    def get_datasets(self):
        try:
            result = self.collection.find({}, {"_id": 0})
            return [Dataset.from_json(r) for r in list(result)]
        except errors.PyMongoError as e:
            log.exception('Error finding datasets in db')
            return 'Error'

    # Return 'ok' if the dataset has been created
    def create_dataset(self, dataset):
        try:
            result = self.collection.insert_one({"name": dataset.name, "type": dataset.type, "keypointDim": dataset.keypoint_dim})
            if result.acknowledged:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error creating dataset in db')
            return 'Error'

    # Return 'ok' if the dataset has been removed
    def remove_dataset(self, dataset):
        try:
            result = self.collection.delete_one({"name": dataset.name})
            if result.deleted_count == 1:
                return 'ok'
            else:
                return 'Error'
        except errors.PyMongoError as e:
            log.exception('Error removing dataset in db')
            return 'Error'

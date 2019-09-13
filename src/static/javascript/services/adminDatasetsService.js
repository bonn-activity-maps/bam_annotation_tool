angular.module('CVGTool')

    .factory('adminDatasetsSrvc', function ($state, $http, $httpParamSerializer) {

        return {
            getInfoOfVideos: function (callbackSuccess, activeDataset, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/dataset/getVideos',
                    headers: {
                        'dataset': activeDataset
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallback(response) {
                    callbackError('danger', "Error while retrieving info from videos.")
                });
            },

            readData: function (dataset, type, callback) {
                $http({
                    method: 'POST',
                    url: '/api/dataset/readData',
                    data: {
                        'dataset': dataset,
                        'type': type
                    }
                }).then(function successCallback(response) {
                    callback('success', 'Load data finished')
                }, function errorCallback(response) {
                    callback('danger', response.data.msg)
                });
            },

            getDatasets: function (callback, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/dataset/getDatasets'
                }).then(function successCallback(response) {
                    callback(response.data.msg);
                }, function errorCallback(response) {
                    callbackError('danger', response.data.msg)
                });
            },

            getDataset: function (datasetName, callbackSuccess) {
                $http({
                    method: 'GET',
                    url: '/api/dataset/getDataset',
                    headers: {
                        'name': datasetName
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg);
                }, function errorCallback(response) {
                    console.log(response.data.msg)
                });
            },

            removeDataset: function (name, callbackSuccess, callbackError) {
                $http({
                    method: 'POST',
                    url: '/api/dataset/removeDataset',
                    data: {
                        'name': name
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            },

            exportDataset: function (name, type, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/dataset/exportDataset',
                    headers: {
                        'dataset': name,
                        'datasetType': type
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            },

            getZipFiles: function(callback, callbackError) {
                console.log("service");
                $http({
                    method: 'GET',
                    url: 'api/dataset/getZipFiles'
                }).then(function successCallback(response) {
                    callback(response.data.msg)
                }, function errorCallback(response) {
                    callbackError('danger', response.data.msg)
                })
            },

            loadZip: function(name, type, callbackSuccess, callbackError) {
                $http({
                    method: 'POST',
                    url: 'api/dataset/loadZip',
                    data: {
                        'name': name,
                        'type': type
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                    callbackError(response.data.msg);
                })
            }
        }
    });

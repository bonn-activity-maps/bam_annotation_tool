angular.module('CVGTool')

    .factory('adminUserActionsSrvc', ['navSrvc', '$state', '$http', '$httpParamSerializer', function(navSrvc, $state, $http, $httpParamSerializer) {

        return {
            getUserActions: function (dataset, datasetType, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/userAction/getUserActions',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                        'dataset': dataset,
                        'datasetType': datasetType
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallBack(response) {
                    callbackError('danger', response.data.msg);
                });
            },

            getUserActionsByLogin: function (user, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/userAction/getUserActions/login',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                        'user': user,
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallBack(response) {
                    callbackError('danger', response.data.msg);
                });
            },

            getUserActionsTimeByWeek: function (user, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/userAction/getStatistic/hours/week',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                        'user': user.name,
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallBack(response) {
                    callbackError('danger', response.data.msg);
                });
            },

            getUserActionsBySession: function(user, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: 'api/userAction/getStatistic/actions/session',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                        'user': user.name
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallBack(response) {
                    callbackError('danger', response.data.msg);
                });
            },

            getUserActionsByDay: function (user, dataset, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: 'api/userAction/getStatistic/actions/day',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                        'user': user.name,
                        'dataset': dataset.name,
                        'datasetType': dataset.type
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallBack(response) {
                    callbackError('danger', response.data.msg);
                });
            },
            getUserActionsPerMinute: function (user, dataset, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/userAction/getStatistic/avg/actions/minute',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                        'user': user.name,
                        'dataset': dataset.name,
                        'datasetType': dataset.type
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallBack(response) {
                    callbackError('danger', response.data.msg);
                });
            },
            getUserActionsTimeSpentPerSequence: function (dataset, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/userAction/getStatistic/time/scene',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                        'dataset': dataset.name,
                        'datasetType': dataset.type
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallBack(response) {
                    callbackError('danger', response.data.msg);
                });
            },
            getUserActionsSequenceTimeStats: function (dataset, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/userAction/getStatistic/stats/time/scenes',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                        'dataset': dataset.name,
                        'datasetType': dataset.type
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallBack(response) {
                    callbackError('danger', response.data.msg);
                });
            },
            getUserActionsSequenceTimeStatsByPersons: function (dataset, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/userAction/getStatistic/stats/time/scenes/persons',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                        'dataset': dataset.name,
                        'datasetType': dataset.type
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallBack(response) {
                    callbackError('danger', response.data.msg);
                });
            }
        }
    }]);
